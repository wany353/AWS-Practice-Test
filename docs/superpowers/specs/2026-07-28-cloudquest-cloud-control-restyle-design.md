# CloudQuest 前端改版设计 — "Cloud Control" (方向 1a)

**日期:** 2026-07-28
**范围:** 仅前端样式 (`Frontend/`)。不改任何 API、状态逻辑、路由或组件行为。
**目标:** 将现有 AWS 刷题网站的视觉风格，整体替换为 `CloudQuest Redesign.dc.html` 中的 **方向 1a — Cloud Control**(深空暗色 + 暖橙渐变 + 极客工程感),并把首页 `Home` 重建为设计稿里的 Hero。

> 说明:`support.js` 是该 `.dc.html` 设计画布的渲染运行时,不是需要移植的产物。"按 support.js 风格" = 复刻设计稿呈现出来的视觉风格。

---

## 1. 现状 (Baseline)

* 技术栈:React 19 + Tailwind CSS 3.4 + Vite。所有样式都是页面内联 utility class。
* 现有主题:深灰 `bg-gray-950` 底 + **靛蓝/紫/粉 (indigo/purple/pink)** 品牌色(~110 处),emerald/red 表示对/错(~76 处),系统字体。
* 涉及文件(9 个):`App.jsx`、`components/Navbar.jsx`、`components/ProtectedRoute.jsx`、`pages/{Login,Register,Dashboard,PracticeMode,MockExam,WrongAnswers,Admin}.jsx`,以及 `index.html`、`index.css`、`tailwind.config.js`。
* 已知遗留问题:代码引用了 `animate-fade-in-up` / `animate-fade-in` / `animate-blob` / `animation-delay-2000` / `animation-delay-4000`,但这些从未在 config/css 中定义 —— 目前是**静默失效**。本次改版顺手把它们真正接上。

---

## 2. 设计系统 — "Cloud Control"

### 2.1 颜色 token

在 `tailwind.config.js` 的 `theme.extend.colors` 下新增 `cq` 命名空间:

| Token | 值 | 用途 |
| :--- | :--- | :--- |
| `cq.bg` | `#17100A` | 页面背景 |
| `cq.surface` | `#1C140C` | 卡片 / 面板 |
| `cq.panel` | `#211812` | 更浅一层的嵌套面板 / 输入框 |
| `cq.ink` | `#F5EEE3` | 主文字 |
| `cq.sub` | `#AC9C86` | 次级文字 |
| `cq.faint` | `#8B7C67` | 弱化标签 / 占位 |
| `cq.line` | `rgba(255,255,255,.08)` | 边框 / 分隔线 |
| `cq.coral` | `#FF6B4A` | 品牌渐变起点 |
| `cq.amber` | `#FF8A3D` | 品牌渐变终点 / 主 accent |
| `cq.gold` | `#FFC98A` | 小面积高亮(pill 文字等) |
| `cq.onAccent` | `#2A1608` | 橙色按钮上的深色文字 |

### 2.2 状态色规则 (关键)

刷题应用必须区分「我的选择」和「对/错」,所以:

* **橙色 accent (`cq.coral`→`cq.amber`)** = 品牌 / 主 CTA / **未提交前的选中态 (pending)**。
* **提交后**:`correct` = **绿色**(沿用 Tailwind emerald),`wrong` = **红色**(沿用 Tailwind red)。绿/红只做「答题反馈」语义,不做品牌色。
* emerald/red 保留原有类名,仅确保在暖色深底上对比度可读;不把它们替换成橙色。

### 2.3 字体

在 `index.html` `<head>` 里加 Google Fonts `<link>`(带 `preconnect`),加载:`Space Grotesk` / `Manrope` / `JetBrains Mono` / `Noto Sans SC`。在 `tailwind.config.js` 映射:

| Tailwind 类 | 字体栈 | 用途 |
| :--- | :--- | :--- |
| `font-sans` (默认) | `Manrope, 'Noto Sans SC', system-ui, sans-serif` | 正文 |
| `font-display` | `'Space Grotesk', 'Noto Sans SC', sans-serif` | 大标题 / h1·h2 |
| `font-mono` | `'JetBrains Mono', ui-monospace, monospace` | 统计数字、倒计时、选项字母、考试代码、`#id` |

### 2.4 关键视觉元件

* **全局底纹**:`body`(或 `App` 根)固定一层暖色深底 + 一到两处橙色径向光晕 (`radial-gradient`) + 极淡的 44px 网格纹理(顶部渐隐 mask),复刻 1a。放在 `index.css`,用一个 `.cq-backdrop` 辅助类或直接作用于 `body::before`/`body::after`。
* **卡片**:`bg-cq-surface/90 backdrop-blur border border-cq-line rounded-2xl` + 柔和阴影(玻璃拟态)。替换现有 `bg-gray-900/60 border-gray-800`。
* **主按钮**:`bg-gradient-to-br from-cq-coral to-cq-amber text-cq-onAccent` + 橙色光晕阴影 `shadow-[0_10px_28px_rgba(255,107,74,.4)]`。
* **次按钮**:`border border-cq-line bg-white/[.03] text-cq-ink`。
* **Pill / badge**:`font-mono`,小字号,橙色描边或橙色底。

### 2.5 动画(补齐定义)

在 `tailwind.config.js` `theme.extend` 定义 keyframes + animation,让现有引用生效,并新增 hero 用的 `float`:

* `keyframes`: `fadeIn`、`fadeInUp`、`blob`、`float`。
* `animation`: `fade-in`、`fade-in-up`、`blob`、`float`。
* `index.css` `@layer utilities` 补 `.animation-delay-2000` / `.animation-delay-4000`。

---

## 3. 首页 Hero 重建 (`App.jsx` 的 `Home`)

按 1a 结构重建(纯展示,静态内容,无新数据依赖):

1. 状态 pill:`● AWS 认证 · 智能刷题系统`(橙点 + mono 字)。
2. 大标题(`font-display`):`拿下 AWS 认证 / 一次「通过」考试`,其中「通过」用 `cq.coral→cq.amber` 渐变裁剪文字。
3. 副文案(中英双语,`cq.sub` / `cq.faint`)。
4. 两个 CTA:`立即开始刷题 →`(橙渐变,链到 `/practice`)、`查看题库`(次按钮 —— 项目无独立题库路由,统一链到 `/practice`)。
5. mono 统计行:`1,200+ 真题` · `65 题 模考`(竖线分隔)。
6. 右侧浮动「真题预览卡」:单选题样例,4 个选项,其中一个显示为正确(橙勾),底部一行「答题后查看深度解析」。带 `animate-float`。
7. 底部 4 个特性 tile:真题题库 / 深度解析 / 全真模考 / 错题本(各带 lucide 图标 + 中英说明)。

> 未登录用户看到 Hero;已登录用户行为不变(仍可导航到各页)。不新增路由守卫逻辑。

---

## 4. 逐页改造清单 (只换样式)

对每个文件,做统一映射:`indigo/purple/pink → cq 橙 accent 或中性 cq 文本`;`gray-900/800/950 底与边 → cq.surface/panel/line`;标题加 `font-display`;数字/代码/字母加 `font-mono`;主按钮换橙渐变。**保留 emerald=对 / red=错。**

* **`Navbar.jsx`** — 品牌图标底色换橙渐变;链接文字用 `cq.sub`/`cq.ink`;`免费注册` 按钮换橙渐变;分隔线 `cq.line`;毛玻璃底换 `cq.bg/80`。
* **`ProtectedRoute.jsx`** — loading spinner 颜色 `indigo → cq.amber`。
* **`Login.jsx`** — 三个模糊光斑改为暖橙/珊瑚/金色调;卡片换 cq 玻璃;输入框 `focus:ring` 换 `cq.amber`;主按钮橙渐变;底部链接橙色。
* **`Register.jsx`** — 同 Login;把 emerald/teal/cyan 光斑与按钮统一到橙 accent(注册按钮也用橙渐变,保持品牌一致)。
* **`Dashboard.jsx`** — 头部横幅 + 统计卡换 cq 卡片;`参加模考`卡=橙 accent,`最高分`卡可用金色,`错题本`卡=红(语义),`账号状态`卡=中性;`继续练习` 主按钮橙渐变;历史表格配色换 cq(表头 `cq.sub`,行 hover `white/5`,分数 pill 橙底 mono)。
* **`PracticeMode.jsx`** — StartModal:`继续上次` = 绿(继续/前进语义可接受)或橙,`重新开始` = 橙 accent;题号 pill / `已自动保存` 文案配色;`getOptionStyle`/`getCheckboxStyle` 里 **pending 态 `indigo → 橙`**,`correct 态`保持绿,`wrong 态`保持红;提交按钮橙渐变;解析框 `indigo → cq.surface + 橙标题`;prose 的 `prose-strong`/`prose-a`/`prose-blockquote` 由 indigo 换橙,`prose-code` 保持琥珀;底部进度条 `current=橙`,对=绿,错=红。
* **`MockExam.jsx`** — sticky 计时条换 cq 卡 + 计时数字 `font-mono`(<5 分钟仍红色 pulse);`提交考卷` 按钮(绿=前进语义,或橙,二选一,文档默认**橙**保持品牌一致);选项 selected 态 `indigo → 橙`;成绩卡通过=绿渐变 / 未通过=红渐变(保留);`返回面板` 主按钮橙渐变;题目卡换 cq;prose indigo→橙。
* **`WrongAnswers.jsx`** — 页面语义本就是红/错,保留红作为「错题」强调;卡片换 cq 玻璃 + 红色描边;正确选项绿、用户错选红(保留);解析框 `indigo → cq.surface + 橙标题`;空状态的绿色勾保留;`去练习` 主按钮橙渐变;正确答案 `font-mono`。
* **`Admin.jsx`** — 品牌/主色 `indigo/pink → 橙`:tab 激活态、上传区图标与光斑、`开始导入`/`保存解析` 主按钮、编辑态高亮边框、`编辑解析` 次按钮、textarea `focus` 环、prose `prose-strong`/`blockquote`;`已有解析` 的绿点/绿字保留(语义);成功=绿、失败=红提示保留;`#id`、答案、字数等用 `font-mono`。

---

## 5. 全局 / 基础层改动

* **`index.html`** — `<head>` 加字体 `preconnect` + `<link>`;可选把 `<title>` 改为 `CloudQuest`。
* **`index.css`** — `body` 基础色换 `bg-cq-bg text-cq-ink font-sans`;滚动条配色换暖色;加 `.cq-backdrop`(网格 + 光晕底纹)与 `animation-delay-*` utilities。
* **`tailwind.config.js`** — 加 `cq` 颜色、`fontFamily`、`keyframes`、`animation`。
* **`App.jsx`** — 根容器 `bg-gray-950 → bg-cq-bg`,`selection` 高亮换橙;挂载 `.cq-backdrop` 底纹层;重建 `Home`。
* **`App.css`** — 现存为 Vite 模板遗留(`.hero`/`#next-steps` 等),未被使用;不动它,避免无谓改动(如确认无引用可后续清理,非本次目标)。

---

## 6. 非目标 (Out of scope / YAGNI)

* 不改后端、`utils/api.js`、路由结构、鉴权逻辑、数据模型。
* 不做 1b/1c 方向,不做游戏化 XP/徽章/排行等 1c 独有元素。
* 不引入新依赖(字体走 Google Fonts CDN,lucide-react 已有)。
* 不做响应式重构(保留现有断点),仅在换色/换字/换卡时顺带保持既有响应式类。
* 不重写 `App.css` 模板残留。

---

## 7. 验收标准

* 全站 9 个文件中不再出现 indigo/purple/pink 作为**品牌/主色**(emerald/red 作为对错语义保留)。
* 首页 `Home` 呈现 1a Hero(标题 + 双 CTA + mono 统计 + 浮动预览卡 + 4 特性 tile)。
* Space Grotesk / Manrope / JetBrains Mono 生效;标题为 Space Grotesk,数字为 JetBrains Mono。
* 引用到的动画类(`fade-in-up` 等)真正产生动画。
* `npm run build` 通过;`npm run dev` 启动后用浏览器截图确认首页 + 登录 + 刷题页视觉符合 1a。
* 答题交互行为(选择、提交、对错反馈、进度、倒计时、上传解析)与改版前完全一致。
