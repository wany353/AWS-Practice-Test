import { Routes, Route, Link } from 'react-router-dom';
import { ArrowRight, Check, Layers, MessageSquare, Target, BookmarkX } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { Dashboard } from './pages/Dashboard';
import { PracticeMode } from './pages/PracticeMode';
import { MockExam } from './pages/MockExam';
import { Admin } from './pages/Admin';
import { WrongAnswers } from './pages/WrongAnswers';

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
          全网最新真题、逐题深度解析，以及与考场 1:1 的全真模拟。为你量身定制的 AWS 架构师备考路径。
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
            某公司需将极少访问的数据长期归档，并要求成本最低。应选择哪种 S3 存储类别？
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

function App() {
  return (
    <div className="min-h-screen text-cq-ink font-sans selection:bg-cq-amber/30">
      <div className="cq-backdrop" />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Area (Requires Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<PracticeMode />} />
            <Route path="/exam" element={<MockExam />} />
            <Route path="/wrong-answers" element={<WrongAnswers />} />
          </Route>

          {/* Admin Area */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
