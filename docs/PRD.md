# CloudQuest 产品需求文档（PRD）

| 项 | 内容 |
| :--- | :--- |
| 产品名称 | CloudQuest —— AWS 认证在线刷题与模拟考试平台 |
| 文档版本 | v1.0 |
| 更新日期 | 2026-08-05 |
| 状态 | 现状梳理 + 规划（Living Document） |
| 适用代码分支 | `frontend-cloud-control-restyle` / `feature/exam-banks` |

---

## 1. 产品概述

### 1.1 背景
准备 AWS 云认证（如 SAA-C03、CLF-C02、DVA-C02 等）的考生需要：紧跟考纲的真题、逐题的深度解析，以及与真实考场一致的模拟体验。市面工具往往三者割裂，且难以同时管理多门考试的题库。

CloudQuest 将「刷题 + 解析 + 全真模考 + 错题复习」整合到一个平台，并支持**按考试分库管理**，让一个站点同时服务多门 AWS 认证。

### 1.2 产品目标
- 让考生在一个平台完成从练习到模考的完整备考闭环。
- 管理员可便捷地按考试导入、维护题库与解析。
- 学习数据（进度、正确率、错题）按考试独立统计，反馈清晰。

### 1.3 价值主张
- **真题 + 深度解析**：每题可配 Markdown 格式解析，讲清为什么对/错。
- **全真模考**：65 题 / 60 分钟 / 70% 通过线，1:1 还原考场节奏。
- **多考试分库**：一个平台承载多门认证，互不干扰。
- **数据驱动**：仪表盘呈现真实的刷题进度与模考正确率，错题自动归集。

---

## 2. 目标用户与角色

| 角色 | 描述 | 核心诉求 |
| :--- | :--- | :--- |
| **普通学员（User）** | 备考 AWS 认证的考生 | 刷题、看解析、模考、复习错题、追踪进度 |
| **管理员（Admin）** | 题库维护者 / 运营 | 导入题库、编辑解析、按考试管理内容 |

权限模型：基于 JWT 的无状态鉴权，角色分 `Admin` / `User`；题库导入、解析编辑等接口仅 `Admin` 可用。

---

## 3. 技术架构

| 层 | 技术 |
| :--- | :--- |
| 前端 | React 19 + Vite 8 + Tailwind CSS 3.4，React Router 7，axios，lucide-react，react-markdown |
| 后端 | C# / ASP.NET Core Web API（.NET 9/10），Entity Framework Core |
| 数据库 | PostgreSQL（Npgsql EF Provider） |
| 鉴权 | JWT（Bearer Token，前端存 localStorage，axios 拦截器自动附带） |
| 部署 | Docker（前端 nginx 静态托管，后端容器化），docker-compose 编排 |

**前后端约定**：前端所有请求走 `/api` 前缀；开发环境 Vite proxy 转发到后端，生产环境 nginx 转发。

---

## 4. 功能需求

### 4.1 用户系统（认证）
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| AUTH-1 | 注册 | 用户名 + 密码（≥6 位）+ 确认密码；用户名唯一 |
| AUTH-2 | 登录 | 校验通过后签发 JWT，前端持久化并全局附带 |
| AUTH-3 | 路由守卫 | 未登录访问受保护页跳转登录；`Admin` 专属页对非管理员跳转仪表盘 |
| AUTH-4 | 退出登录 | 清除本地 token，回到首页 |

### 4.2 题库管理（按考试分库，Admin）
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| BANK-1 | 考试（分类）概念 | 每个「考试」对应一个题库（`Category`），名称唯一，如 SAA-C03 |
| BANK-2 | 上传题库 | 上传结构化 JSON；先选择已有考试或**新建考试**，再上传 |
| BANK-3 | 按考试替换 | 导入时**只清空并替换该考试下的题目**，其它考试不受影响 |
| BANK-4 | 答案兼容解析 | 兼容 `correct_answer`（数组 `["A"]`/`["A","C"]`）与 `answer`（字符串）；多选自动识别 |
| BANK-5 | 题型 | 单选（Single）、多选（Multiple）、判断（TrueFalse）；答案存字母（如 `B`、`AC`） |
| BANK-6 | 解析管理 | 按考试筛选题目列表，逐题编辑 Markdown 解析，实时预览、单题保存 |
| BANK-7 | 顺序号显示 | 解析管理中显示考试内顺序号（#1、#2…），真实数据库 ID 悬停可见 |

**导入 JSON 格式（单题示例）**：
```json
{
  "question": "题干……",
  "options": { "A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D" },
  "correct_answer": ["B"],
  "topic": "存储 Storage"
}
```

### 4.3 刷题练习（Practice）
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| PRAC-1 | 选择考试 | 顶部下拉切换考试，加载该考试题目；记忆上次考试（`cq-exam`） |
| PRAC-2 | 开始方式 | 进入时弹窗：继续上次进度 / 重新开始（按考试各自记录） |
| PRAC-3 | 逐题作答 | 单选单选、多选多选；提交后即时判定对错 |
| PRAC-4 | 即时解析 | 提交后展示正确答案 + Markdown 深度解析 |
| PRAC-5 | 进度自动保存 | 防抖自动保存到服务器，**按考试独立**（每用户每考试一条） |
| PRAC-6 | 重做 / 导航 | 单题重做、上一题/下一题、底部进度条点击跳题 |
| PRAC-7 | 错题联动 | 答错自动写入错题本（按题目去重，幂等） |
| PRAC-8 | 底部统计 | 答对 / 答错 / 未答实时计数 |

### 4.4 全真模拟考试（Mock Exam）
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| EXAM-1 | 选择考试 | 在开始界面选择考试，从该考试抽取（最多 65 题，随机） |
| EXAM-2 | 开始/暂停/放弃 | **进入不自动开考**；开始界面展示规则→点击开始计时；可暂停（冻结计时并隐藏题目）、继续、放弃（清空作答回到开始界面） |
| EXAM-3 | 倒计时 | 60 分钟倒计时，剩余 <5 分钟高亮告警，到时自动交卷 |
| EXAM-4 | 交卷评分 | 提交后计算正确率；记录含所属考试与总题数 |
| EXAM-5 | 结果展示 | 通过（≥70%）/ 未通过；正确率、答对/答错、PASSED/FAILED 标记 |
| EXAM-6 | 逐题回看 | 交卷后展示每题正确答案与解析 |

### 4.5 错题本（Wrong Answers）
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| WRONG-1 | 自动收集 | 练习答错的题目自动归入错题本 |
| WRONG-2 | 按考试筛选 | 支持「全部考试 / 具体考试」筛选（经 `Question.CategoryId` 关联过滤） |
| WRONG-3 | 详情展开 | 折叠列表，展开看选项对错、我的答案 vs 正确答案、解析 |
| WRONG-4 | 移除 | 掌握后可从错题本移除单题 |

### 4.6 学习仪表盘（Dashboard）
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| DASH-1 | 欢迎与入口 | 问候语 + 开始刷题 / 全真模拟入口 |
| DASH-2 | 按考试查看 | 「全部考试 / 具体考试」筛选，驱动下方统计 |
| DASH-3 | 刷题进度环 | 圆环显示**当前考试的刷题进度**（已答/该考试总题数），下方标注考试名与 X/Y |
| DASH-4 | 真实指标 | 平均正确率、通过次数（≥70%）、最近一次正确率（基于模考记录，真实数据） |
| DASH-5 | 统计卡 | 参加模考次数、历史最高得分、错题数、账号状态 |
| DASH-6 | 继续练习横幅 | 有未完成练习时提示并一键继续（标注考试名） |
| DASH-7 | 历史记录表 | 模考时间、得分（X/总数）、正确率%、评级 |

> 说明：设计稿中的「XP/等级/连续打卡」游戏化板块已**移除**，改用上述真实学习指标。

### 4.7 视觉与主题
| 编号 | 需求 | 说明 |
| :--- | :--- | :--- |
| UI-1 | Cloud Control 设计 | 暖色系 + 珊瑚→琥珀渐变主色，Space Grotesk / Manrope / JetBrains Mono 字体，网格+光晕底纹 |
| UI-2 | 深/浅色切换 | 导航栏日/夜切换；跟随系统默认，选择持久化（localStorage `cq-theme`），首屏无闪烁 |
| UI-3 | 语义色一致 | 主色=品牌/CTA/待提交选中；绿=正确、红=错误，全站统一 |
| UI-4 | 统一下拉样式 | `.cq-select`：继承正文字体、自定义箭头、跟随主题 |
| UI-5 | 响应式 | 移动端到桌面端自适应 |

---

## 5. 数据模型

| 表 | 关键字段 | 说明 |
| :--- | :--- | :--- |
| **Users** | Id, Username(唯一), PasswordHash, Role | 用户与角色 |
| **Categories** | Id, Name(唯一), Description | 一个「考试 / 题库」 |
| **Questions** | Id, Content, Type, OptionsJson, Answer, Analysis, **CategoryId(FK)** | 题目，归属某考试；删考试时外键置空 |
| **TestRecords** | Id, UserId, **CategoryId**, Score, **Total**, CreatedAt | 模考记录，按考试统计正确率 |
| **UserPracticeProgress** | Id, UserId, **CategoryId**, CurrentIndex, AnswersJson, UpdatedAt | 练习进度，(UserId,CategoryId) 唯一 |
| **WrongAnswers** | Id, UserId, QuestionId(FK), UserAnswerJson, CreatedAt | 错题，经 Question 关联考试 |

**关键约束**：`Category.Name` 唯一；`Question.CategoryId` 外键 `OnDelete:SetNull`；`(UserPracticeProgress.UserId, CategoryId)` 唯一。

**迁移记录**：`InitialCreate` → `AddPracticeProgressAndWrongAnswers` → `AddQuestionCategory`（并为旧题目播种「默认题库」）→ `AddExamScoping` → `AddTestRecordTotal`。

---

## 6. 接口清单（`/api` 前缀）

| 方法 | 路径 | 权限 | 说明 |
| :--- | :--- | :--- | :--- |
| POST | `/Auth/register` | 匿名 | 注册 |
| POST | `/Auth/login` | 匿名 | 登录，返回 JWT |
| GET | `/Categories` | 登录 | 考试列表 + 每考试题目数 |
| GET | `/Questions?categoryId=` | 登录 | 题目列表（可按考试过滤） |
| POST | `/Questions/import` | Admin | 导入 `{ examName, questions[] }`，按考试替换 |
| GET | `/Questions/{id}` | Admin | 单题详情 |
| PATCH | `/Questions/{id}/analysis` | Admin | 更新单题解析 |
| POST | `/Questions/submit-test` | 登录 | 交卷评分（带 categoryId、总题数） |
| GET | `/Questions/test-history?categoryId=` | 登录 | 模考历史（可按考试过滤） |
| GET | `/PracticeProgress?categoryId=` | 登录 | 读取某考试的练习进度 |
| POST | `/PracticeProgress` | 登录 | 保存某考试的练习进度 |
| GET | `/WrongAnswers?categoryId=` | 登录 | 错题列表（可按考试过滤，含题目详情） |
| GET | `/WrongAnswers/count?categoryId=` | 登录 | 错题计数（可按考试过滤） |
| POST | `/WrongAnswers` | 登录 | 记录错题（按题目幂等） |
| DELETE | `/WrongAnswers/{questionId}` | 登录 | 移除错题 |

**前端路由**：`/`（首页）、`/login`、`/register`、`/dashboard`、`/practice`、`/exam`、`/wrong-answers`、`/admin`。

---

## 7. 非功能需求
- **安全**：密码哈希存储（BCrypt）；JWT 鉴权；写操作（导入/编辑解析）限 Admin。
- **性能**：题目按考试过滤查询；导入用事务保证一致性。
- **可用性**：解析支持 Markdown；深浅色主题；响应式布局。
- **可维护性**：前端 Tailwind 语义 token（`cq-*` CSS 变量）统一主题；后端 EF 迁移管理 schema 演进。
- **数据一致性**：导入使用数据库事务；进度自动保存带防抖，避免频繁写。

---

## 8. 已知限制与未来方向

### 8.1 已知限制
- **旧数据残留**：升级前的题目被迁移归入「默认题库」，需管理员手动清理或忽略（目前尚无「删除整个考试」功能）。
- **删除考试功能缺失**：暂不能在界面删除某考试及其题目（需 SQL 或后续开发）。
- **题目 ID 非连续**：反复重传使数据库自增 ID 从较大值起（正常现象，解析管理已改为显示考试内顺序号）。
- **模考抽题上限 65**：题量不足时取全部。

### 8.2 未来方向（Roadmap）
- **删除/重命名考试**：管理端增删改考试及其题目。
- **题库检索页（Bank）**：面向学员的题目检索 + 主题/题型筛选（设计稿已有）。
- **按主题（topic）维度**：利用导入的 topic 字段做分类练习与统计。
- **模考深化**：交卷记录与错题本更紧密联动；单场模考详情留存。
- **管理端题目 CRUD**：新增/编辑/删除单题，不仅是解析。

---

## 9. 验收标准（核心）
- 管理员可新建考试并上传对应 JSON 题库，答案（含 `correct_answer` 数组）正确入库，多选被正确识别。
- 上传某考试**不影响**其它考试题库。
- 学员可选择考试进行练习，进度按考试独立保存与恢复。
- 模考进入后**不自动开考**，需点击「开始」；可暂停/继续/放弃；到时自动交卷并给出真实正确率。
- 错题在练习答错后自动归集，可按考试筛选、可移除。
- 仪表盘圆环反映当前考试的真实刷题进度，指标与历史记录为真实数据。
- 深浅色切换即时生效、刷新后保持，全站语义色一致。
