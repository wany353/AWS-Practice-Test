using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using System.Security.Claims;
using System.Linq;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires authentication by default
public class QuestionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public QuestionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllQuestions([FromQuery] int? categoryId)
    {
        // Don't leak answers when just fetching question contents for practicing.
        // We will return everything including answers now for simplification as it's a practice website.
        var query = _context.Questions.AsQueryable();
        if (categoryId.HasValue) query = query.Where(q => q.CategoryId == categoryId.Value);

        var questions = await query.OrderBy(q => q.Id).ToListAsync();
        return Ok(questions);
    }

    [HttpPost("import")]
    [Authorize(Roles = "Admin")] // Only Admin can upload Questions JSON
    public async Task<IActionResult> ImportQuestions([FromBody] ImportRequestDto request)
    {
        if (request?.Questions == null || request.Questions.Count == 0) return BadRequest("题库数据为空");

        var examName = (request.ExamName ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(examName)) return BadRequest("请填写考试名称");

        // Use transaction to ensure data safety during the flush and import
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 找到或新建该考试（题库分类）
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == examName);
            if (category == null)
            {
                category = new Category { Name = examName };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
            }

            // 只清空并替换“该考试”下的题目，其它考试题库不受影响
            await _context.Questions.Where(q => q.CategoryId == category.Id).ExecuteDeleteAsync();

            var newQuestions = request.Questions.Select(d => new Question
            {
                Content = d.Content,
                Answer = d.Answer,
                Type = d.Type,
                OptionsJson = d.OptionsJson,
                Analysis = d.Analysis,
                CategoryId = category.Id
            }).ToList();

            _context.Questions.AddRange(newQuestions);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = $"已成功导入 {newQuestions.Count} 道题目到「{examName}」。", examId = category.Id, examName });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"导入失败：{ex.Message}");
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetQuestion(int id)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null) return NotFound($"Question {id} not found.");
        return Ok(question);
    }

    [HttpPatch("{id}/analysis")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAnalysis(int id, [FromBody] UpdateAnalysisDto dto)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null) return NotFound($"Question {id} not found.");

        question.Analysis = dto.Analysis;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Question {id} analysis updated successfully." });
    }

    [HttpPost("submit-test")]
    public async Task<IActionResult> SubmitTest([FromBody] TestSubmitDto testSubmit)
    {
        var userId = int.Parse(User.FindFirstValue("uid") ?? "0");
        if (userId <= 0) return Unauthorized();

        int score = 0;
        var questionIds = testSubmit.Answers.Select(a => a.QuestionId).ToList();
        var questions = await _context.Questions.Where(q => questionIds.Contains(q.Id)).ToListAsync();

        foreach(var answer in testSubmit.Answers)
        {
            var q = questions.FirstOrDefault(x => x.Id == answer.QuestionId);
            if (q != null && string.Equals(q.Answer, answer.UserAnswer, StringComparison.OrdinalIgnoreCase))
            {
                score += 1;
            }
        }

        var record = new TestRecord
        {
            UserId = userId,
            CategoryId = testSubmit.CategoryId,
            Score = score,
            Total = questions.Count
        };

        _context.TestRecords.Add(record);
        await _context.SaveChangesAsync();

        return Ok(new { Score = score, TotalQuestions = questions.Count });
    }


    // 归一化答案字母：只保留 A-Z 并排序，便于比较 "A, C" / "ca" / "AC"
    private static string NormalizeAnswer(string? s) =>
        string.IsNullOrEmpty(s) ? "" : new string(s.ToUpperInvariant().Where(char.IsLetter).OrderBy(c => c).ToArray());

    // 批量导入解析：按“考试内序号”匹配（题库导入时按文件顺序插入），并用 correct_answer 校验对齐
    [HttpPost("import-analysis")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ImportAnalysis([FromBody] AnalysisImportRequestDto request)
    {
        if (request?.Items == null || request.Items.Count == 0) return BadRequest("解析数据为空");

        var query = _context.Questions.AsQueryable();
        if (request.CategoryId.HasValue) query = query.Where(q => q.CategoryId == request.CategoryId.Value);
        var questions = await query.OrderBy(q => q.Id).ToListAsync();
        if (questions.Count == 0) return BadRequest("该考试下没有题目，请先上传题库");

        int updated = 0, mismatch = 0, outOfRange = 0, empty = 0;
        var mismatchSample = new List<int>();

        foreach (var item in request.Items)
        {
            var idx = item.Number - 1;
            if (idx < 0 || idx >= questions.Count) { outOfRange++; continue; }
            if (string.IsNullOrWhiteSpace(item.Explanation)) { empty++; continue; }

            var q = questions[idx];
            var expect = NormalizeAnswer(item.CorrectAnswer);
            var actual = NormalizeAnswer(q.Answer);
            if (expect.Length > 0 && expect != actual)
            {
                mismatch++;
                if (mismatchSample.Count < 20) mismatchSample.Add(item.Number);
                if (request.SkipMismatch) continue;
            }

            q.Analysis = item.Explanation;
            updated++;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"已更新 {updated} 条解析" + (mismatch > 0 ? $"，{mismatch} 条因答案不匹配被跳过" : ""),
            updated, mismatch, outOfRange, empty,
            total = request.Items.Count,
            dbCount = questions.Count,
            mismatchSample
        });
    }

    [HttpGet("test-history")]
    public async Task<IActionResult> GetTestHistory([FromQuery] int? categoryId)
    {
        var userId = int.Parse(User.FindFirstValue("uid") ?? "0");
        if (userId <= 0) return Unauthorized();

        var query = _context.TestRecords.Where(t => t.UserId == userId);
        if (categoryId.HasValue) query = query.Where(t => t.CategoryId == categoryId.Value);

        var history = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

        return Ok(history);
    }
}
