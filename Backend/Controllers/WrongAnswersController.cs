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
[Authorize]
public class WrongAnswersController : ControllerBase
{
    private readonly AppDbContext _context;

    public WrongAnswersController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue("uid")!);

    // GET /api/WrongAnswers — 获取当前用户全部错题（含题目详情）
    [HttpGet]
    public async Task<IActionResult> GetWrongAnswers()
    {
        var userId = GetUserId();
        var records = await _context.WrongAnswers
            .Where(w => w.UserId == userId)
            .Include(w => w.Question)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        var result = records.Select(w => new WrongAnswerResponseDto
        {
            Id = w.Id,
            QuestionId = w.QuestionId,
            UserAnswerJson = w.UserAnswerJson,
            CreatedAt = w.CreatedAt,
            QuestionContent = w.Question?.Content ?? "",
            QuestionType = w.Question?.Type ?? "",
            OptionsJson = w.Question?.OptionsJson ?? "[]",
            Answer = w.Question?.Answer ?? "",
            Analysis = w.Question?.Analysis
        }).ToList();

        return Ok(result);
    }

    // GET /api/WrongAnswers/count — 获取错题总数
    [HttpGet("count")]
    public async Task<IActionResult> GetCount()
    {
        var userId = GetUserId();
        var count = await _context.WrongAnswers.CountAsync(w => w.UserId == userId);
        return Ok(new { count });
    }

    // POST /api/WrongAnswers — 添加一道错题（幂等：已存在则更新用户回答）
    [HttpPost]
    public async Task<IActionResult> AddWrongAnswer([FromBody] WrongAnswerDto dto)
    {
        var userId = GetUserId();
        var existing = await _context.WrongAnswers
            .FirstOrDefaultAsync(w => w.UserId == userId && w.QuestionId == dto.QuestionId);

        if (existing != null)
        {
            existing.UserAnswerJson = dto.UserAnswerJson;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.WrongAnswers.Add(new WrongAnswer
            {
                UserId = userId,
                QuestionId = dto.QuestionId,
                UserAnswerJson = dto.UserAnswerJson,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "已记录错题" });
    }

    // DELETE /api/WrongAnswers/{questionId} — 从错题本移除题目
    [HttpDelete("{questionId}")]
    public async Task<IActionResult> RemoveWrongAnswer(int questionId)
    {
        var userId = GetUserId();
        var record = await _context.WrongAnswers
            .FirstOrDefaultAsync(w => w.UserId == userId && w.QuestionId == questionId);

        if (record == null) return NotFound();

        _context.WrongAnswers.Remove(record);
        await _context.SaveChangesAsync();
        return Ok(new { message = "已从错题本移除" });
    }
}
