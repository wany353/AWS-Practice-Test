using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPracticeProgressAndWrongAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserPracticeProgresses_Users_UserId",
                table: "UserPracticeProgresses");

            migrationBuilder.DropTable(
                name: "WrongQuestions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserPracticeProgresses",
                table: "UserPracticeProgresses");

            migrationBuilder.RenameTable(
                name: "UserPracticeProgresses",
                newName: "PracticeProgresses");

            migrationBuilder.RenameIndex(
                name: "IX_UserPracticeProgresses_UserId",
                table: "PracticeProgresses",
                newName: "IX_PracticeProgresses_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PracticeProgresses",
                table: "PracticeProgresses",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "WrongAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    UserAnswerJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WrongAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WrongAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WrongAnswers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswers_QuestionId",
                table: "WrongAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswers_UserId",
                table: "WrongAnswers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PracticeProgresses_Users_UserId",
                table: "PracticeProgresses",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PracticeProgresses_Users_UserId",
                table: "PracticeProgresses");

            migrationBuilder.DropTable(
                name: "WrongAnswers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PracticeProgresses",
                table: "PracticeProgresses");

            migrationBuilder.RenameTable(
                name: "PracticeProgresses",
                newName: "UserPracticeProgresses");

            migrationBuilder.RenameIndex(
                name: "IX_PracticeProgresses_UserId",
                table: "UserPracticeProgresses",
                newName: "IX_UserPracticeProgresses_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserPracticeProgresses",
                table: "UserPracticeProgresses",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "WrongQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WrongCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WrongQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WrongQuestions_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WrongQuestions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WrongQuestions_QuestionId",
                table: "WrongQuestions",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_WrongQuestions_UserId",
                table: "WrongQuestions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserPracticeProgresses_Users_UserId",
                table: "UserPracticeProgresses",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
