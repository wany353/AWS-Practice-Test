using System.Text.Json.Serialization;

namespace Backend.Models;

public class Question
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "Single"; // Single/Multiple/TrueFalse
    public string OptionsJson { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Analysis { get; set; }

    // 所属考试（题库分类）。旧数据可能为空，迁移时会归入「默认题库」。
    public int? CategoryId { get; set; }

    [JsonIgnore]
    public Category? Category { get; set; }
}
