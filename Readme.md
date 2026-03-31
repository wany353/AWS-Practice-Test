# 答题网站项目实现报告 (Implementation Report)

## 1. 项目概述
本项目是一个基于 Web 的答题系统，旨在为用户提供练习和模拟考试功能。系统支持用户管理、题库导入、实时刷题及模拟测试结果统计。

## 2. 技术栈
* **前端**: React.js (v18+)
* **样式**: Tailwind CSS (响应式设计)
* **后端**: C# / ASP.NET Core Web API (v8.0)
* **数据库**: Entity Framework Core + PostgreSQL
* **身份验证**: JWT (JSON Web Tokens)

## 3. 核心功能设计

### 3.1 用户系统
* **注册/登录**: 使用 JWT 进行无状态验证。
* **权限控制**: 区分普通用户（刷题、考试）和管理员（上传题库）。

### 3.2 题库管理
* **上传功能**: 仅限管理员操作，后端解析 JSON 文件题库并持久化到数据库。
* **题目类型**: 支持单选题、多选题和判断题。

### 3.3 刷题与模拟测试
* **顺序/随机刷题**: 从数据库获取题目，前端记录当前进度。
* **模拟测试**: 倒计时功能，交卷后自动评分并展示错题分析。

---

## 4. 数据库架构 (Schema)



| 表名 | 描述 | 核心字段 |
| :--- | :--- | :--- |
| **Users** | 用户信息 | Id, Username, PasswordHash, Role |
| **Questions** | 题目信息 | Id, Content, Type, Options(JSON), Answer, Analysis |
| **Categories** | 题库分类 | Id, Name, Description |
| **TestRecords** | 考试记录 | Id, UserId, Score, CreatedAt |

---

## 5. 后端实现 (C# / ASP.NET Core)

### 5.1 题目模型示例
```csharp
public class Question {
    public int Id { get; set; }
    public string Content { get; set; } // 题目内容
    public string Type { get; set; } // Single/Multiple/TrueFalse
    public string OptionsJson { get; set; } // 存储选项的JSON字符串
    public string Answer { get; set; } // 正确答案
    public string Analysis { get; set; } // 解析
}

```



## 6.目前的问题

### 改Bug

### 美化界面
模考结束界面优化
### 功能改进
改进加入解析功能，目前难以查找



# 未来方向

- [ ] 加入AI Agent，智能询问解答题目
- [ ] 建立RAG，能够实时更新，实现RAG的增删功能