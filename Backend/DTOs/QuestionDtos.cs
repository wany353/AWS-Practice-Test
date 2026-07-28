namespace Backend.DTOs;

public class UpdateAnalysisDto
{
    public string? Analysis { get; set; }
}

public class QuestionImportDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Analysis { get; set; }
    public string OptionsJson { get; set; } = string.Empty;
}

// 上传题库时携带考试名称 + 题目列表
public class ImportRequestDto
{
    public string ExamName { get; set; } = string.Empty;
    public List<QuestionImportDto> Questions { get; set; } = new();
}

public class TestSubmitDto
{
    public List<QuestionAnswerResponse> Answers { get; set; } = new();
}

public class QuestionAnswerResponse
{
    public int QuestionId { get; set; }
    public string UserAnswer { get; set; } = string.Empty;
}
