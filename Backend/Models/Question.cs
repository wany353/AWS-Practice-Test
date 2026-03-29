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
}
