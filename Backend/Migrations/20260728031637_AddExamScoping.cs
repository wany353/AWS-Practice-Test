using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddExamScoping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PracticeProgresses_UserId",
                table: "PracticeProgresses");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "TestRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "PracticeProgresses",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PracticeProgresses_UserId_CategoryId",
                table: "PracticeProgresses",
                columns: new[] { "UserId", "CategoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PracticeProgresses_UserId_CategoryId",
                table: "PracticeProgresses");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "TestRecords");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "PracticeProgresses");

            migrationBuilder.CreateIndex(
                name: "IX_PracticeProgresses_UserId",
                table: "PracticeProgresses",
                column: "UserId");
        }
    }
}
