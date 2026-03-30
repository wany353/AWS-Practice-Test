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
public class PracticeProgressController : ControllerBase
{
    private readonly AppDbContext _context;

    public PracticeProgressController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue("uid")!);

    // GET /api/PracticeProgress — 获取当前用户的练习进度
    [HttpGet]
    public async Task<IActionResult> GetProgress()
    {
        var userId = GetUserId();
        var progress = await _context.PracticeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (progress == null)
            return Ok(new { currentIndex = 0, answersJson = "{}" });

        return Ok(new
        {
            currentIndex = progress.CurrentIndex,
            answersJson = progress.AnswersJson,
            updatedAt = progress.UpdatedAt
        });
    }

    // POST /api/PracticeProgress — 保存或更新进度
    [HttpPost]
    public async Task<IActionResult> SaveProgress([FromBody] PracticeProgressDto dto)
    {
        var userId = GetUserId();
        var progress = await _context.PracticeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (progress == null)
        {
            progress = new UserPracticeProgress
            {
                UserId = userId,
                CurrentIndex = dto.CurrentIndex,
                AnswersJson = dto.AnswersJson,
                UpdatedAt = DateTime.UtcNow
            };
            _context.PracticeProgresses.Add(progress);
        }
        else
        {
            progress.CurrentIndex = dto.CurrentIndex;
            progress.AnswersJson = dto.AnswersJson;
            progress.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "进度已保存" });
    }
}
