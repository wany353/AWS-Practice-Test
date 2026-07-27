# CloudQuest "Cloud Control" 前端改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `Frontend/` 的视觉风格整体替换为 CloudQuest 设计稿方向 1a "Cloud Control"(暖色深底 + 橙渐变 + Space Grotesk/JetBrains Mono),并重建首页 Hero。

**Architecture:** 先建立一次性设计 token 层(Tailwind 颜色/字体/动画 + 全局底纹 CSS + Google Fonts),再逐页把 indigo/purple/pink 品牌色映射到 `cq` 橙 token,保留 emerald/red 作为对/错语义。纯样式,不动 API、状态逻辑、路由。

**Tech Stack:** React 19、Tailwind CSS 3.4、Vite 8、lucide-react。

## Global Constraints

- 只改样式;不改 API 调用、组件状态逻辑、路由结构、鉴权、数据模型。(spec §Out of scope)
- **状态色规则:** 橙 accent (`cq.coral`→`cq.amber`) = 品牌 / 主 CTA / 未提交前选中态;提交后 `correct` 保持绿 (emerald),`wrong` 保持红 (red)。(spec §2.2)
- 不新增运行时依赖;字体走 Google Fonts CDN。(spec §Out of scope)
- 每个任务的验证 = `npm run build` 必须通过(本项目无单测;样式任务以 build 通过 + 视觉检查为门槛)。
- 所有命令在 `Frontend/` 目录下执行。
- 每个任务完成后只 `git add` 该任务涉及的文件再 commit(工作区有大量无关的预存改动,不要 `git add -A`)。
- Commit message 结尾附:`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

**Token 速查(所有任务通用):**

| 旧类(品牌/中性) | 新类 |
| :--- | :--- |
| `bg-gray-950` | `bg-cq-bg` |
| `bg-gray-900/60`、`bg-gray-900/50`、`bg-gray-900/80`、`bg-gray-900` | `bg-cq-surface/90`(卡片)/ `bg-cq-surface`(实心) |
| `bg-gray-800`、`bg-gray-800/50` | `bg-cq-panel` / `bg-cq-panel/60` |
| `border-gray-800`、`border-gray-700` | `border-cq-line` |
| `text-white`(标题) | `text-cq-ink`(标题另加 `font-display`) |
| `text-gray-300`、`text-gray-200` | `text-cq-ink` / `text-cq-sub` |
| `text-gray-400`、`text-gray-500` | `text-cq-sub` / `text-cq-faint` |
| `bg-indigo-600 hover:bg-indigo-500`(主按钮) | `bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent hover:brightness-110 shadow-cq-accent` |
| `text-indigo-400`、`text-indigo-300`(品牌强调) | `text-cq-amber` |
| `bg-indigo-500/10`、`bg-indigo-500/20`(品牌软底) | `bg-cq-amber/12` |
| `border-indigo-500`、`ring-indigo-500`(选中/聚焦) | `border-cq-amber` / `ring-cq-amber` |
| `bg-indigo-600/20 border-indigo-500 text-indigo-100`(选项 pending) | `bg-cq-amber/15 border-cq-amber text-cq-ink` |
| `selection:bg-indigo-500/30` | `selection:bg-cq-amber/30` |

> emerald-*/red-* 类**保持不变**(对/错语义)。仅在必要时确认在暖底上对比度可读。

---

### Task 1: 设计 token 基础层(config + 字体 + 全局 CSS)

**Files:**
- Modify: `Frontend/tailwind.config.js`(整体替换)
- Modify: `Frontend/index.html:5-8`(head 加字体、改 title)
- Modify: `Frontend/src/index.css`(整体替换)

**Interfaces:**
- Produces(后续所有任务依赖):Tailwind 类 `bg-cq-bg`、`bg-cq-surface`、`bg-cq-panel`、`text-cq-ink`、`text-cq-sub`、`text-cq-faint`、`border-cq-line`、`from-cq-coral`、`to-cq-amber`、`text-cq-amber`、`text-cq-gold`、`text-cq-on-accent`、`font-display`、`font-mono`、`shadow-cq-accent`、`shadow-cq-card`、`animate-fade-in`、`animate-fade-in-up`、`animate-blob`、`animate-float`;CSS 类 `.cq-backdrop`、`.animation-delay-2000`、`.animation-delay-4000`。

- [ ] **Step 1: 整体替换 `Frontend/tailwind.config.js`**

```js
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cq: {
          bg: '#17100A',
          surface: '#1C140C',
          panel: '#211812',
          ink: '#F5EEE3',
          sub: '#AC9C86',
          faint: '#8B7C67',
          line: 'rgba(255,255,255,0.08)',
          coral: '#FF6B4A',
          amber: '#FF8A3D',
          gold: '#FFC98A',
          'on-accent': '#2A1608',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'cq-accent': '0 12px 28px rgba(255,107,74,0.40)',
        'cq-card': '0 12px 40px rgba(0,0,0,0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0px,0px) scale(1)' },
          '33%': { transform: 'translate(20px,-30px) scale(1.1)' },
          '66%': { transform: 'translate(-15px,15px) scale(0.95)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        blob: 'blob 8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [
    typography,
  ],
}
```

- [ ] **Step 2: 修改 `Frontend/index.html` head** — 在 `<meta name="viewport" ...>` 之后、`</head>` 之前插入字体链接,并把 `<title>frontend</title>` 改为 `<title>CloudQuest · AWS 认证刷题</title>`:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: 整体替换 `Frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-cq-bg text-cq-ink font-sans antialiased;
  }
}

/* 全局暖色底纹:两处橙色径向光 + 极淡 44px 网格(顶部渐隐) */
.cq-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(680px 420px at 82% -6%, rgba(255, 138, 61, 0.14), transparent 60%),
    radial-gradient(720px 480px at 4% 8%, rgba(255, 107, 74, 0.16), transparent 62%),
    #17100A;
}
.cq-backdrop::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 75%);
  mask-image: linear-gradient(180deg, #000, transparent 75%);
}

@layer utilities {
  .animation-delay-2000 { animation-delay: 2s; }
  .animation-delay-4000 { animation-delay: 4s; }
}

/* Custom scrollbar (warm) */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #17100A; }
::-webkit-scrollbar-thumb { background: #3a2c1e; border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: #4d3a27; }
```

- [ ] **Step 4: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错(应生成 dist,CSS 体积略有变化)。

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js index.html src/index.css
git commit -m "style: add Cloud Control design tokens, fonts, global backdrop

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: App 外壳 + Navbar + ProtectedRoute

**Files:**
- Modify: `Frontend/src/App.jsx`(根容器 + 挂载底纹;`Home` 留到 Task 3)
- Modify: `Frontend/src/components/Navbar.jsx`
- Modify: `Frontend/src/components/ProtectedRoute.jsx`

**Interfaces:**
- Consumes: Task 1 的 `cq` token、`.cq-backdrop`、`font-display`。
- Produces:统一的顶部导航与页面外壳配色,后续页面在此壳内渲染。

- [ ] **Step 1: `App.jsx` 根容器** — 把
  `<div className="min-h-screen bg-gray-950 text-gray-50 font-sans selection:bg-indigo-500/30">`
  改为:
```jsx
    <div className="min-h-screen text-cq-ink font-sans selection:bg-cq-amber/30">
      <div className="cq-backdrop" />
```
  (根 `<div>` 内第一行加入 `<div className="cq-backdrop" />`;去掉 `bg-gray-950`,底色由 `body` + backdrop 提供。)

- [ ] **Step 2: `Navbar.jsx` 映射**
  - 外层 `nav`:`bg-gray-900/80` → `bg-cq-bg/80`;`border-gray-800` → `border-cq-line`。
  - 品牌链接 `text-indigo-400 hover:text-indigo-300` → `text-cq-amber hover:text-cq-gold`;`BookOpen` 图标外可选包一层 `w-8 h-8 rounded-lg bg-gradient-to-br from-cq-coral to-cq-amber flex items-center justify-center`(图标改 `text-cq-on-accent`),品牌名加 `font-display`。
  - 普通链接 `text-gray-300 hover:text-white` → `text-cq-sub hover:text-cq-ink`。
  - 错题本链接保留 `text-red-400 hover:text-red-300`(语义)。
  - 管理面板 `text-pink-400 hover:text-pink-300` → `text-cq-amber hover:text-cq-gold`。
  - 分隔线 `bg-gray-700` → `bg-cq-line`;用户 pill `bg-gray-800 hover:bg-gray-700 border-gray-700` → `bg-cq-panel hover:bg-cq-panel/70 border-cq-line`,`text-gray-400/200` → `text-cq-sub/ink`。
  - 登出按钮 `text-gray-400 hover:text-red-400` 保留。
  - 未登录:登录 `text-gray-300 hover:text-white` → `text-cq-sub hover:text-cq-ink`;`免费注册` 按钮
    `bg-indigo-600 hover:bg-indigo-500 text-white ... shadow-indigo-600/30`
    → `bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent hover:brightness-110`(保留 `hover:-translate-y-0.5` 等)。

- [ ] **Step 3: `ProtectedRoute.jsx`** — 把 loading spinner 的 `text-indigo-*` / `border-indigo-*` 改为 `text-cq-amber` / `border-cq-amber`(若使用 border spinner 则 `border-b-2 border-cq-amber`)。其余不动。

- [ ] **Step 4: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/Navbar.jsx src/components/ProtectedRoute.jsx
git commit -m "style: reskin app shell, navbar and protected route to Cloud Control

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 重建首页 Hero(`App.jsx` 的 `Home`)

**Files:**
- Modify: `Frontend/src/App.jsx`(替换 `Home` 组件)

**Interfaces:**
- Consumes: Task 1 token、`font-display`/`font-mono`、`animate-fade-in-up`/`animate-float`;lucide-react 图标 `ArrowRight, Check, Layers, MessageSquare, Target, BookmarkX`(按需从 `lucide-react` import,已是依赖)。
- Produces: 未登录着陆页视觉,链接 `/practice`。

- [ ] **Step 1: 在 `App.jsx` 顶部补图标 import**

```jsx
import { ArrowRight, Check, Layers, MessageSquare, Target, BookmarkX } from 'lucide-react';
import { Link } from 'react-router-dom';
```
（`Link` 若已从 react-router-dom 导入则合并;`Routes, Route` 保持。）

- [ ] **Step 2: 用下述实现替换整个 `Home` 组件**

```jsx
const Home = () => (
  <div className="max-w-6xl mx-auto animate-fade-in-up">
    {/* Hero */}
    <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-11 items-center pt-10 pb-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cq-amber/10 border border-cq-amber/25 text-cq-gold font-mono text-xs tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cq-amber shadow-[0_0_10px_#FF8A3D]" />
          AWS 认证 · 智能刷题系统
        </div>
        <h1 className="font-display font-bold text-5xl md:text-6xl leading-[1.05] tracking-tight mb-3">
          拿下 AWS 认证<br />一次
          <span className="bg-gradient-to-r from-cq-coral to-cq-amber bg-clip-text text-transparent">通过</span>
          考试
        </h1>
        <p className="text-cq-sub text-lg leading-relaxed max-w-xl mb-8">
          全网最新真题、逐题深度解析,以及与考场 1:1 的全真模拟。为你量身定制的 AWS 架构师备考路径。
          <span className="block mt-1.5 text-[15px] text-cq-faint">
            Freshest real questions, deep explanations, and a true-to-exam mock. Your tailored path to AWS certified.
          </span>
        </p>
        <div className="flex flex-wrap gap-3.5 mb-9">
          <Link to="/practice" className="inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-xl bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent hover:brightness-110 transition">
            立即开始刷题 Start now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/practice" className="inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-xl border border-cq-line bg-white/[.03] text-cq-ink hover:bg-white/[.06] transition">
            查看题库 Browse bank
          </Link>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="font-mono font-bold text-2xl text-cq-ink">1,200<span className="text-cq-amber">+</span></div>
            <div className="text-xs font-semibold text-cq-faint">真题 Questions</div>
          </div>
          <div className="w-px bg-cq-line" />
          <div>
            <div className="font-mono font-bold text-2xl text-cq-ink">65<span className="text-cq-amber"> 题</span></div>
            <div className="text-xs font-semibold text-cq-faint">全真模考 Mock</div>
          </div>
        </div>
      </div>

      {/* 真题预览卡 */}
      <div className="relative animate-float">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cq-coral/50 via-cq-amber/35 to-transparent blur-[1px]" />
        <div className="relative bg-cq-surface/90 backdrop-blur border border-cq-line rounded-[22px] p-6 shadow-cq-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold tracking-wide px-2.5 py-1 rounded-full bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent">单选题 · SINGLE</span>
            <span className="font-mono text-[11px] text-cq-faint">真题预览 · SAMPLE</span>
          </div>
          <p className="font-semibold text-cq-ink leading-relaxed mb-4">
            某公司需将极少访问的数据长期归档,并要求成本最低。应选择哪种 S3 存储类别?
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { k: 'A', t: 'S3 Standard', correct: false },
              { k: 'B', t: 'S3 Glacier Deep Archive', correct: true },
              { k: 'C', t: 'S3 Standard-IA', correct: false },
              { k: 'D', t: 'S3 Intelligent-Tiering', correct: false },
            ].map((o) => (
              <div key={o.k} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm ${
                o.correct
                  ? 'bg-cq-amber/12 border-cq-amber text-cq-ink font-semibold'
                  : 'bg-white/[.04] border-cq-line text-cq-sub'
              }`}>
                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-mono text-xs ${
                  o.correct
                    ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent'
                    : 'border border-cq-line text-cq-sub'
                }`}>
                  {o.correct ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : o.k}
                </span>
                {o.t}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3.5 border-t border-cq-line flex items-center gap-2 text-xs text-cq-sub font-semibold">
            <BookmarkX className="w-4 h-4 text-cq-amber" />
            答题后即可查看逐题深度解析 · Deep explanation after you answer
          </div>
        </div>
      </div>
    </div>

    {/* 特性 tiles */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 pb-4">
      {[
        { Icon: Layers, t: '真题题库', d: 'Question Bank · 紧跟考纲' },
        { Icon: MessageSquare, t: '深度解析', d: 'Markdown 逐题详解' },
        { Icon: Target, t: '全真模考', d: '65 题 · 60 分 · 70% 过' },
        { Icon: BookmarkX, t: '错题本', d: '自动收集 · 反复攻克' },
      ].map(({ Icon, t, d }) => (
        <div key={t} className="bg-cq-surface/90 border border-cq-line rounded-2xl p-5">
          <Icon className="w-6 h-6 text-cq-amber" strokeWidth={1.9} />
          <div className="font-display font-bold text-base mt-3 mb-1">{t}</div>
          <div className="text-xs font-semibold text-cq-faint">{d}</div>
        </div>
      ))}
    </div>
  </div>
);
```

- [ ] **Step 3: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错(确认所有引用图标都已 import)。

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rebuild landing hero as Cloud Control (1a) direction

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Login + Register

**Files:**
- Modify: `Frontend/src/pages/Login.jsx`
- Modify: `Frontend/src/pages/Register.jsx`

**Interfaces:**
- Consumes: Task 1 token、`animate-blob`、`animation-delay-*`。
- Produces: 统一橙 accent 的认证页。

- [ ] **Step 1: `Login.jsx` 映射**
  - 三个光斑 `bg-indigo-500 / bg-purple-500 / bg-pink-500` → `bg-cq-coral / bg-cq-amber / bg-cq-gold`(保留 `animate-blob` + `animation-delay-*`,现在会真正动)。
  - 卡片 `bg-gray-900/60 border-gray-800` → `bg-cq-surface/90 border-cq-line`。
  - 标题 `text-white` → `text-cq-ink` + `font-display`;副标题 `text-gray-400` → `text-cq-sub`。
  - 输入框 `bg-gray-950/50 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500` → `bg-cq-panel border-cq-line text-cq-ink placeholder-cq-faint focus:ring-cq-amber`;label `text-gray-300` → `text-cq-sub`;左侧图标 `text-gray-500` → `text-cq-faint`。
  - 主按钮 `bg-indigo-600 hover:bg-indigo-500 ... focus:ring-indigo-500 ... hover:shadow-indigo-500/30` → `bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent focus:ring-cq-amber shadow-cq-accent hover:brightness-110`。
  - 底部链接 `text-indigo-400 hover:text-indigo-300` → `text-cq-amber hover:text-cq-gold`。
  - error 框 `bg-red-500/10 border-red-500/50 text-red-400` 保留。

- [ ] **Step 2: `Register.jsx` 映射** — 与 Login 相同;另外把绿色系(`bg-emerald-500 / bg-teal-500 / bg-cyan-500` 光斑、`focus:ring-emerald-500`、注册按钮 `bg-emerald-600 ... shadow-emerald-600/30`、底部 `text-emerald-400`)统一改为橙 accent(与 Login 一致,品牌统一)。error 红框保留。

- [ ] **Step 3: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/pages/Register.jsx
git commit -m "style: reskin login and register to Cloud Control

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Dashboard

**Files:**
- Modify: `Frontend/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: Task 1 token、`animate-fade-in-up`、`font-display`/`font-mono`。

- [ ] **Step 1: 映射**
  - 头部横幅 `bg-gray-900/50 ... border-gray-800` → `bg-cq-surface/90 border-cq-line`;`text-white` 标题 → `text-cq-ink font-display`;副文案 `text-gray-400` → `text-cq-sub`。
  - `继续练习` 按钮 `bg-emerald-600 hover:bg-emerald-500 ... shadow-emerald-600/20` → 橙渐变主按钮(spec:继续=前进,统一橙);`开始刷题` 次按钮 `bg-gray-800 ... border-gray-700` → `bg-cq-panel border-cq-line`,内部图标 `text-indigo-400` → `text-cq-amber`;`全真模拟` 按钮 `bg-indigo-600 ...` → 橙渐变。
  - 统计卡 `bg-gray-900/50 border-gray-800` → `bg-cq-surface/90 border-cq-line`;数字 `text-white` → `text-cq-ink font-mono`;标签 `text-gray-400` → `text-cq-sub`。四张卡图标底色:模考次数 `bg-indigo-500/10`→`bg-cq-amber/12` 且 `text-indigo-400`→`text-cq-amber`;最高分保留 emerald;错题本保留 red;账号状态 `bg-orange-500/10 text-orange-400`→`bg-cq-gold/12 text-cq-gold`;各卡 `hover:border-indigo-500/50`→`hover:border-cq-amber/50`(错题本卡 hover 保留 red)。
  - 进度横幅(emerald 系)保留绿(继续/正向语义)。
  - 历史表 `bg-gray-900/50 border-gray-800` → `bg-cq-surface/90 border-cq-line`;标题 `text-white`→`text-cq-ink font-display`;`divide-gray-800`→`divide-cq-line`;表头 `text-gray-400`→`text-cq-sub`;行 hover `hover:bg-gray-800/50`→`hover:bg-white/5`;分数 pill `bg-indigo-500/10 text-indigo-400`→`bg-cq-amber/12 text-cq-amber font-mono`;loading spinner `border-indigo-500`→`border-cq-amber`;空状态图标底 `bg-gray-800`→`bg-cq-panel`,`text-gray-500`→`text-cq-faint`。

- [ ] **Step 2: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "style: reskin dashboard to Cloud Control

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: PracticeMode(最复杂,含状态色函数)

**Files:**
- Modify: `Frontend/src/pages/PracticeMode.jsx`

**Interfaces:**
- Consumes: Task 1 token。**关键:** `getOptionStyle` / `getCheckboxStyle` 返回的 class 字符串需按下方精确替换(pending→橙,correct→绿,wrong→红)。

- [ ] **Step 1: 替换 `getOptionStyle` 的返回值**（`PracticeMode.jsx:254-268` 附近）

```jsx
    if (!isSubmitted) {
      return isPending
        ? 'bg-cq-amber/15 border-cq-amber text-cq-ink'
        : 'bg-cq-panel/60 border-cq-line text-cq-sub hover:bg-cq-panel hover:border-cq-faint cursor-pointer';
    }
    if (isCorrectOpt) return 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
    if (isUserSelected && !isCorrectOpt) return 'bg-red-500/15 border-red-500 text-red-200';
    return 'bg-cq-panel/30 border-cq-line text-cq-faint';
```

- [ ] **Step 2: 替换 `getCheckboxStyle` 的返回值**（`PracticeMode.jsx:270-280` 附近）

```jsx
    if (!isSubmitted) return isPending ? 'border-cq-amber bg-cq-amber' : 'border-cq-faint';
    if (isCorrectOpt) return 'border-emerald-500 bg-emerald-500';
    if (isUserSelected) return 'border-red-500 bg-red-500';
    return 'border-cq-faint';
```

- [ ] **Step 3: StartModal 与其余映射**
  - modal 遮罩保留;卡片 `bg-gray-900 border-gray-700` → `bg-cq-surface border-cq-line`;标题 `text-white`→`text-cq-ink font-display`;图标底 `bg-indigo-500/20 text-indigo-400`→`bg-cq-amber/12 text-cq-amber`。
  - `继续上次练习` 块保留 emerald(正向)。
  - `重新开始` 块 `border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300/400 group-hover:text-indigo-400` → 对应 `cq-amber` 系(`border-cq-amber/30 bg-cq-amber/10 hover:bg-cq-amber/20 text-cq-amber`)。
  - 顶部标题 `text-white`→`text-cq-ink font-display`;题号 pill `bg-indigo-500/20 text-indigo-400`→`bg-cq-amber/12 text-cq-amber font-mono`;`已自动保存` `text-emerald-400` 保留。
  - 上/下/刷新按钮 `bg-gray-800 hover:bg-gray-700 text-gray-400/white`→`bg-cq-panel hover:bg-cq-panel/70 text-cq-sub`。
  - 题目卡 `bg-gray-900/60 border-gray-800`→`bg-cq-surface/90 border-cq-line`;右上角类型标 `bg-indigo-600 text-white`→`bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-mono`;题干 `text-gray-200`→`text-cq-ink`。
  - 提交按钮 `bg-indigo-600 ... shadow-indigo-600/20` → 橙渐变主按钮。
  - 对错反馈卡:保留 emerald/red;其中 `text-emerald-300`/`text-red-300` 的答案用 `font-mono` 已有。
  - 解析框 `bg-indigo-900/20 border-indigo-500/30` → `bg-cq-surface border-cq-line`;标题 `text-indigo-400`→`text-cq-amber`;prose 的 `prose-strong:text-indigo-300`→`prose-strong:text-cq-amber`、`prose-blockquote:border-indigo-500`→`prose-blockquote:border-cq-amber`、`prose-a:text-indigo-400`→`prose-a:text-cq-amber`;`prose-code:text-amber-300` 保留;`prose-pre:bg-gray-800/80 border-gray-700`→`prose-pre:bg-cq-panel border-cq-line`。
  - 操作按钮 `重做此题`/`下一题` 的 `bg-gray-800/700` → `bg-cq-panel`;完成态 `text-emerald-400` 保留。
  - 底部进度条:`current bg-indigo-500`→`bg-cq-amber`;未答 `bg-gray-800 hover:bg-gray-700`→`bg-cq-panel`;对=emerald、错=red 保留。
  - 底部统计圆点:对=emerald、错=red 保留;未答 `bg-gray-600`→`bg-cq-faint`,文本 `text-gray-500`→`text-cq-faint`。
  - loading spinner `text-indigo-500`→`text-cq-amber`;空题库 `AlertCircle text-yellow-500` 保留,标题 `text-white`→`text-cq-ink`,副 `text-gray-400`→`text-cq-sub`。

- [ ] **Step 4: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 5: Commit**

```bash
git add src/pages/PracticeMode.jsx
git commit -m "style: reskin practice mode to Cloud Control (accent=pending, keep green/red feedback)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: MockExam

**Files:**
- Modify: `Frontend/src/pages/MockExam.jsx`

**Interfaces:**
- Consumes: Task 1 token、`font-mono`(计时器)。

- [ ] **Step 1: 映射**
  - loading spinner `border-indigo-500`→`border-cq-amber`;error `text-red-400` 保留。
  - sticky 计时条 `bg-gray-900/80 border-gray-800`→`bg-cq-surface/90 border-cq-line`;时钟图标底 `bg-indigo-500/20 text-indigo-400`→`bg-cq-amber/12 text-cq-amber`;标签 `text-gray-400`→`text-cq-sub`;计时数字保留 `font-mono`,`<300s` 保留 `text-red-400 animate-pulse`,否则 `text-white`→`text-cq-ink`。
  - `提交考卷` 按钮 `bg-emerald-600 ... shadow-emerald-600/20` → 橙渐变主按钮(spec:统一品牌橙)。
  - 成绩卡:通过=emerald 渐变 / 未通过=red 渐变,**保留**(含 `from-emerald-400 to-cyan-400` 分数渐变、PASSED/FAILED 徽标);仅把中性 `border-gray-800`、`bg-gray-900/40`→`border-cq-line`、`bg-cq-surface/60`;`返回面板` 按钮 `bg-indigo-600 ... shadow-indigo-500/30`→橙渐变;`去练习复习` `bg-gray-800`→`bg-cq-panel`。
  - 题卡 `bg-gray-900/40 border-gray-800`→`bg-cq-surface/90 border-cq-line`;序号块 `bg-gray-800 text-gray-400 border-gray-700`→`bg-cq-panel text-cq-sub border-cq-line font-mono`;题干 `text-gray-200`→`text-cq-ink`。
  - 选项 selected `bg-indigo-600/20 border-indigo-500 text-indigo-100`→`bg-cq-amber/15 border-cq-amber text-cq-ink`,未选 `bg-gray-800/50 border-gray-700 text-gray-300 hover:...`→`bg-cq-panel/60 border-cq-line text-cq-sub hover:bg-cq-panel hover:border-cq-faint`;checkbox selected `border-indigo-500 bg-indigo-500`→`border-cq-amber bg-cq-amber`,未选 `border-gray-600`→`border-cq-faint`。
  - 提交后答案框 `bg-emerald-900/20 border-emerald-500/30 text-emerald-400` 保留;prose `prose-strong:text-indigo-300`→`text-cq-amber`、`prose-blockquote:border-indigo-500`→`border-cq-amber`、`prose-code:text-amber-300` 保留。

- [ ] **Step 2: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 3: Commit**

```bash
git add src/pages/MockExam.jsx
git commit -m "style: reskin mock exam to Cloud Control (keep pass/fail green/red)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: WrongAnswers

**Files:**
- Modify: `Frontend/src/pages/WrongAnswers.jsx`

**Interfaces:**
- Consumes: Task 1 token。

- [ ] **Step 1: 映射**
  - loading spinner `text-indigo-500`→`text-cq-amber`。
  - 标题 `text-white`→`text-cq-ink font-display`;计数 `text-red-400` 保留;副 `text-gray-400`→`text-cq-sub`;刷新按钮 `bg-gray-800 ... text-gray-300`→`bg-cq-panel text-cq-sub`。
  - error 红框保留。
  - 空状态:绿勾图标块 `bg-emerald-500/10 text-emerald-400` 保留;标题 `text-white`→`text-cq-ink`;`去练习` 按钮 `bg-indigo-600 ...`→橙渐变。
  - 错题卡 `bg-gray-900/60 border-red-500/20 hover:border-red-500/40` 保留红描边(错题语义);头部图标块 `bg-red-500/20 text-red-400` 保留;类型 pill `bg-gray-800 text-gray-400`→`bg-cq-panel text-cq-sub`;`#idx` `text-gray-600`→`text-cq-faint`;题干 `text-gray-200`→`text-cq-ink`;展开箭头 `text-gray-500`→`text-cq-faint`;分隔线 `border-gray-800`→`border-cq-line`。
  - 选项:correct=emerald、userSelected=red 保留;未选 `bg-gray-800/30 border-gray-700/50 text-gray-500`→`bg-cq-panel/30 border-cq-line text-cq-faint`。
  - 答案对比:我的=red、正确=emerald(均 `font-mono`)保留;label `text-gray-400`→`text-cq-sub`。
  - 解析框 `bg-indigo-900/20 border-indigo-500/30 text-gray-300`→`bg-cq-surface border-cq-line text-cq-sub`,标题 `text-indigo-400`→`text-cq-amber`。
  - 移除按钮 `bg-red-500/10 hover:bg-red-500/20 text-red-400` 保留。

- [ ] **Step 2: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 3: Commit**

```bash
git add src/pages/WrongAnswers.jsx
git commit -m "style: reskin wrong-answers to Cloud Control (keep red = wrong)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Admin

**Files:**
- Modify: `Frontend/src/pages/Admin.jsx`

**Interfaces:**
- Consumes: Task 1 token。

- [ ] **Step 1: UploadSection 映射**
  - 容器 `bg-gray-900/60 border-gray-800`→`bg-cq-surface/90 border-cq-line`;两处装饰光斑 `bg-pink-500/10`、`bg-indigo-500/10`→`bg-cq-coral/10`、`bg-cq-amber/10`。
  - `UploadCloud` `text-indigo-400`→`text-cq-amber`;标题 `text-white`→`text-cq-ink font-display`;副 `text-gray-400`→`text-cq-sub`;内联 code `text-indigo-300 bg-indigo-900/40`→`text-cq-amber bg-cq-amber/10 font-mono`。
  - 拖拽区 `bg-gray-800/50 border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/5`→`bg-cq-panel/50 border-cq-line hover:border-cq-amber hover:bg-cq-amber/5`;文字 `text-gray-300 group-hover:text-indigo-300`→`text-cq-sub group-hover:text-cq-amber`。
  - `开始导入` 按钮 `bg-indigo-600 ... shadow-indigo-600/30`→橙渐变主按钮。
  - status 成功=emerald、失败=red 保留。

- [ ] **Step 2: AnalysisManager 映射**
  - loading `Loader text-indigo-400`→`text-cq-amber`;空态 `FileText`/`text-gray-500` → `text-cq-faint`。
  - 统计栏 `text-gray-400`→`text-cq-sub`;`已有解析` emerald 保留;`待补充` `text-gray-600/300`→`text-cq-faint/sub`;分页按钮 `bg-gray-800 ... text-gray-300`→`bg-cq-panel text-cq-sub`。
  - 题卡:editing `border-indigo-500/60 bg-indigo-900/10`→`border-cq-amber/60 bg-cq-amber/5`;非 editing `border-gray-800 bg-gray-900/40 hover:border-gray-700`→`border-cq-line bg-cq-surface/60 hover:border-cq-faint`。
  - `#id` `text-gray-500 font-mono` 保留;状态点 `bg-emerald-400`/`bg-gray-600`→保留 emerald / `bg-cq-faint`;题干 `text-gray-300`→`text-cq-sub`;类型 pill `bg-gray-800 text-gray-500`→`bg-cq-panel text-cq-faint`;答案 `text-gray-400 font-mono` 保留;`已有解析` emerald 保留。
  - `编辑解析` 按钮 `bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-600/30`→`bg-cq-amber/15 hover:bg-cq-amber/25 text-cq-amber border-cq-amber/30`;`取消` 按钮 `bg-gray-700/50 text-gray-400`→`bg-cq-panel text-cq-sub`。
  - 编辑区 `border-gray-800`→`border-cq-line`;`预览` 按钮 `bg-gray-800 text-gray-400`→`bg-cq-panel text-cq-sub`;textarea `bg-gray-800/60 border-gray-700 text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500/50`→`bg-cq-panel border-cq-line text-cq-ink placeholder-cq-faint focus:border-cq-amber focus:ring-cq-amber/50`;预览容器 `bg-gray-800/40 border-gray-700`→`bg-cq-panel/40 border-cq-line`;prose `prose-strong:text-indigo-300`→`text-cq-amber`、`prose-blockquote:border-indigo-500`→`border-cq-amber`、`prose-code:text-amber-300` 保留;`保存解析` 按钮 `bg-indigo-600 ... shadow-indigo-600/20`→橙渐变。
  - 底部分页按钮同上映射;`saveStatus` 成功=emerald、失败=red 保留。

- [ ] **Step 3: Admin 主页面映射**
  - 标题 `text-white`→`text-cq-ink font-display`;副 `text-gray-500`→`text-cq-faint`。
  - tab 容器 `bg-gray-900/60 border-gray-800`→`bg-cq-surface/90 border-cq-line`;激活 tab `bg-indigo-600 text-white shadow-indigo-600/20`→`bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent`;非激活 `text-gray-400 hover:text-gray-200 hover:bg-gray-800/60`→`text-cq-sub hover:text-cq-ink hover:bg-cq-panel/60`。
  - analysis 容器卡 `bg-gray-900/60 border-gray-800`→`bg-cq-surface/90 border-cq-line`;图标块 `bg-indigo-500/20 text-indigo-400`→`bg-cq-amber/12 text-cq-amber`;标题 `text-white`→`text-cq-ink font-display`;副 `text-gray-500`→`text-cq-faint`。

- [ ] **Step 4: 验证 build 通过**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin.jsx
git commit -m "style: reskin admin panel to Cloud Control

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: 全量验证 + 视觉截图

**Files:** 无(仅验证)

- [ ] **Step 1: 残留品牌色扫描** — 确认 9 个文件不再把 indigo/purple/pink 作为品牌/主色:

Run: `grep -rnE 'indigo|purple|pink|fuchsia|violet' src` (在 `Frontend/` 下)
Expected: 无输出(0 处)。若有,回到对应任务修正。

- [ ] **Step 2: 生产 build**

Run: `npm run build`
Expected: `✓ built` 无报错。

- [ ] **Step 3: lint(可选,不作硬门槛)**

Run: `npm run lint`
Expected: 无「新增」错误(既有告警可忽略)。

- [ ] **Step 4: 启动 dev server 并截图验证**

Run: `npm run dev`(后台),用浏览器打开 `http://localhost:5173/`,截图:首页 `/`、`/login`、`/register`。若有测试账号,登录后再截 `/dashboard`、`/practice`、`/exam`、`/wrong-answers`(以及管理员 `/admin`)。逐张对照 spec §7 验收标准:标题为 Space Grotesk、数字为 JetBrains Mono、橙 accent、绿/红仍表对错、动画生效。

- [ ] **Step 5: 收尾** — 截图确认无误后,汇报改动清单与验收结果(本任务无 commit;若截图暴露问题,回到相关任务修正并重新 build)。

---

## Self-Review 记录

- **Spec 覆盖:** §1 现状→无需任务;§2 token→Task 1;§2.5 动画→Task 1;§3 Hero→Task 3;§4 逐页(Navbar/ProtectedRoute→Task 2,Login/Register→Task 4,Dashboard→Task 5,Practice→Task 6,Mock→Task 7,Wrong→Task 8,Admin→Task 9);§5 全局→Task 1/2;§7 验收→Task 10。全部有对应任务。
- **Placeholder 扫描:** 无 TBD/TODO;新代码(Task 1/3)给了完整源码;逐页任务给了精确 class 映射与关键函数完整返回值。
- **类型/命名一致:** 全程使用同一套 `cq.*` token 与 `on-accent`(class `cq-on-accent`);`getOptionStyle`/`getCheckboxStyle` 名称与源文件一致。
