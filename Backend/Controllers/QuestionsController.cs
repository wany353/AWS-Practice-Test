using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using System.Security.Claims;

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
