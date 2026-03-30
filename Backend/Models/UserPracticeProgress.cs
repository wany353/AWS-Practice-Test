namespace Backend.Models;

public class UserPracticeProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CurrentIndex { get; set; }
    public string AnswersJson { get; set; } = "{}"; // 已提交的题目答案 {questionIndex: [选项, ...], ...}
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
