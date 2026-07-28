using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<TestRecord> TestRecords { get; set; }
    public DbSet<UserPracticeProgress> PracticeProgresses { get; set; }
    public DbSet<WrongAnswer> WrongAnswers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Ensure username is unique
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // 考试名称唯一（Category 即“考试/题库”）
        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Name)
            .IsUnique();

        // 每道题目归属一个考试；删除考试时把题目的外键置空
        modelBuilder.Entity<Question>()
            .HasOne(q => q.Category)
            .WithMany()
            .HasForeignKey(q => q.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        // 每个用户每个考试只保留一条练习进度
        modelBuilder.Entity<UserPracticeProgress>()
            .HasIndex(p => new { p.UserId, p.CategoryId })
            .IsUnique();
    }
}
