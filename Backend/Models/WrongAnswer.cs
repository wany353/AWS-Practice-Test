namespace Backend.Models;

public class WrongAnswer
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int QuestionId { get; set; }
    public string UserAnswerJson { get; set; } = "[]"; // 用户错误的回答
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Question? Question { get; set; }
}
