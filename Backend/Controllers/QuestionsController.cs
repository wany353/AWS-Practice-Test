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
    public async Task<IActionResult> GetAllQuestions()
    {
        // Don't leak answers when just fetching question contents for practicing. 
        // We will return everything including answers now for simplification as it's a practice website.
        var questions = await _context.Questions.OrderBy(q => q.Id).ToListAsync();
        return Ok(questions);
    }

    [HttpPost("import")]
    [Authorize(Roles = "Admin")] // Only Admin can upload Questions JSON
    public async Task<IActionResult> ImportQuestions([FromBody] List<QuestionImportDto> dtos)
    {
        if (dtos == null || dtos.Count == 0) return BadRequest("Invalid JSON data");

        // Use transaction to ensure data safety during the flush and import
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Fast deletion of existing records (EF Core 7+)
            await _context.Questions.ExecuteDeleteAsync();

            var newQuestions = dtos.Select(d => new Question
            {
                Content = d.Content,
                Answer = d.Answer,
                Type = d.Type,
                OptionsJson = d.OptionsJson,
                Analysis = d.Analysis
            }).ToList();

            _context.Questions.AddRange(newQuestions);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = $"Successfully imported {newQuestions.Count} questions." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Internal server error while importing: {ex.Message}");
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
            Score = score
        };

        _context.TestRecords.Add(record);
        await _context.SaveChangesAsync();

        return Ok(new { Score = score, TotalQuestions = questions.Count });
    }

    [HttpGet("test-history")]
    public async Task<IActionResult> GetTestHistory()
    {
        var userId = int.Parse(User.FindFirstValue("uid") ?? "0");
        if (userId <= 0) return Unauthorized();

        var history = await _context.TestRecords
                                    .Where(t => t.UserId == userId)
                                    .OrderByDescending(t => t.CreatedAt)
                                    .ToListAsync();

        return Ok(history);
    }
}
