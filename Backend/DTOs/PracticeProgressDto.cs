namespace Backend.DTOs;

public class PracticeProgressDto
{
    public int CurrentIndex { get; set; }
    public string AnswersJson { get; set; } = "{}";
}

public class WrongAnswerDto
{
    public int QuestionId { get; set; }
    public string UserAnswerJson { get; set; } = "[]";
}

public class WrongAnswerResponseDto
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string UserAnswerJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    // inline question info
    public string QuestionContent { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Analysis { get; set; }
}
