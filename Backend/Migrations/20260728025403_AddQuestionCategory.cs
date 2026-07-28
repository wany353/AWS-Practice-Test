using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Questions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_CategoryId",
                table: "Questions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Categories_CategoryId",
                table: "Questions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // 把升级前已存在的题目归入「默认题库」，避免它们在按考试筛选时“消失”
            migrationBuilder.Sql(@"
                INSERT INTO ""Categories"" (""Name"", ""Description"")
                SELECT '默认题库', '系统升级前导入的题库'
                WHERE EXISTS (SELECT 1 FROM ""Questions"" WHERE ""CategoryId"" IS NULL)
                  AND NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '默认题库');

                UPDATE ""Questions""
                SET ""CategoryId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '默认题库' LIMIT 1)
                WHERE ""CategoryId"" IS NULL
                  AND EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '默认题库');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Categories_CategoryId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_CategoryId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Categories_Name",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Questions");
        }
    }
}
