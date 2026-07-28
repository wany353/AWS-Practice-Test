namespace Backend.Models;

public class TestRecord
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? CategoryId { get; set; } // 本次模考所属考试（题库分类）
    public int Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
