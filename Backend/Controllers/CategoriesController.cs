using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    // 所有考试（题库分类）+ 每个考试的题目数量
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                questionCount = _context.Questions.Count(q => q.CategoryId == c.Id)
            })
            .ToListAsync();

        return Ok(categories);
    }

    // 浏览题库页面用：题量 + 当前用户在各题库的练习进度
    // 允许匿名访问（只暴露题库名称与题量，不含题目内容），未登录时进度为 0
    [HttpGet("overview")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOverview()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                questionCount = _context.Questions.Count(q => q.CategoryId == c.Id)
            })
            .ToListAsync();

        var progressByCategory = new Dictionary<int, UserPracticeProgress>();
        if (int.TryParse(User.FindFirstValue("uid"), out var userId))
        {
            progressByCategory = await _context.PracticeProgresses
                .Where(p => p.UserId == userId && p.CategoryId != null)
                .ToDictionaryAsync(p => p.CategoryId!.Value);
        }

        var overview = categories.Select(c =>
        {
            progressByCategory.TryGetValue(c.Id, out var progress);
            var answered = progress == null ? 0 : CountAnswered(progress.AnswersJson);

            return new
            {
                c.Id,
                c.Name,
                c.Description,
                c.questionCount,
                // 重新上传题库后题目会变少，旧进度可能超出当前题量
                answered = Math.Min(answered, c.questionCount),
                lastPracticedAt = progress?.UpdatedAt
            };
        });

        return Ok(overview);
    }

    // AnswersJson 形如 {题目序号: [选项, ...]}，答对答错都算已答
    private static int CountAnswered(string answersJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(answersJson);
            return doc.RootElement.ValueKind == JsonValueKind.Object
                ? doc.RootElement.EnumerateObject().Count()
                : 0;
        }
        catch (JsonException)
        {
            return 0;
        }
    }
}
