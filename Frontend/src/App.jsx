import { Routes, Route, Link } from 'react-router-dom';
import { ArrowRight, Check, Layers, MessageSquare, Target, BookmarkX } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { useI18n } from './context/I18nContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { Dashboard } from './pages/Dashboard';
import { PracticeMode } from './pages/PracticeMode';
import { MockExam } from './pages/MockExam';
import { Admin } from './pages/Admin';
import { WrongAnswers } from './pages/WrongAnswers';

const Home = () => {
  const { t } = useI18n();
  return (
  <div className="max-w-6xl mx-auto animate-fade-in-up">
    {/* Hero */}
    <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-11 items-center pt-10 pb-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cq-acc-soft border border-cq-acc text-cq-gold font-mono text-xs tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cq-acc shadow-[0_0_10px_#FF8A3D]" />
          {t('home.badge')}
        </div>
        <h1 className="font-display font-bold text-5xl md:text-6xl leading-[1.05] tracking-tight mb-3">
          {t('home.titleLine1')}<br />{t('home.titlePre')}
          <span className="bg-gradient-to-r from-cq-coral to-cq-amber bg-clip-text text-transparent">{t('home.titleHighlight')}</span>
          {t('home.titlePost')}
        </h1>
        <p className="text-cq-sub text-lg leading-relaxed max-w-xl mb-8">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-wrap gap-3.5 mb-9">
          <Link to="/practice" className="inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-xl bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent hover:brightness-110 transition">
            {t('home.ctaStart')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/practice" className="inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-xl border border-cq-line bg-cq-panel text-cq-ink hover:bg-cq-panel2 transition">
            {t('home.ctaBrowse')}
          </Link>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="font-mono font-bold text-2xl text-cq-ink">1,200<span className="text-cq-acc">+</span></div>
            <div className="text-xs font-semibold text-cq-faint">{t('home.statQuestions')}</div>
          </div>
          <div className="w-px bg-cq-line" />
          <div>
            <div className="font-mono font-bold text-2xl text-cq-ink">65<span className="text-cq-acc">{t('home.statMockUnit')}</span></div>
            <div className="text-xs font-semibold text-cq-faint">{t('home.statMock')}</div>
          </div>
        </div>
      </div>

      {/* Sample question card */}
      <div className="relative animate-float">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cq-coral via-cq-amber to-transparent opacity-50 blur-[1px]" />
        <div className="relative bg-cq-surface backdrop-blur border border-cq-line rounded-[22px] p-6 shadow-cq-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold tracking-wide px-2.5 py-1 rounded-full bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent">{t('home.sampleType')}</span>
            <span className="font-mono text-[11px] text-cq-faint">{t('home.sampleLabel')}</span>
          </div>
          <p className="font-semibold text-cq-ink leading-relaxed mb-4">
            {t('home.sampleQuestion')}
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { k: 'A', text: 'S3 Standard', correct: false },
              { k: 'B', text: 'S3 Glacier Deep Archive', correct: true },
              { k: 'C', text: 'S3 Standard-IA', correct: false },
              { k: 'D', text: 'S3 Intelligent-Tiering', correct: false },
            ].map((o) => (
              <div key={o.k} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm ${
                o.correct
                  ? 'bg-cq-acc-soft border-cq-acc text-cq-ink font-semibold'
                  : 'bg-cq-panel border-cq-line text-cq-sub'
              }`}>
                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-mono text-xs ${
                  o.correct
                    ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent'
                    : 'border border-cq-line text-cq-sub'
                }`}>
                  {o.correct ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : o.k}
                </span>
                {o.text}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3.5 border-t border-cq-line flex items-center gap-2 text-xs text-cq-sub font-semibold">
            <BookmarkX className="w-4 h-4 text-cq-acc" />
            {t('home.sampleFooter')}
          </div>
        </div>
      </div>
    </div>

    {/* Feature tiles */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 pb-4">
      {[
        { Icon: Layers, title: t('home.featureBankTitle'), desc: t('home.featureBankDesc') },
        { Icon: MessageSquare, title: t('home.featureExplainTitle'), desc: t('home.featureExplainDesc') },
        { Icon: Target, title: t('home.featureMockTitle'), desc: t('home.featureMockDesc') },
        { Icon: BookmarkX, title: t('home.featureWrongTitle'), desc: t('home.featureWrongDesc') },
      ].map(({ Icon, title, desc }) => (
        <div key={title} className="bg-cq-surface border border-cq-line rounded-2xl p-5">
          <Icon className="w-6 h-6 text-cq-acc" strokeWidth={1.9} />
          <div className="font-display font-bold text-base mt-3 mb-1">{title}</div>
          <div className="text-xs font-semibold text-cq-faint">{desc}</div>
        </div>
      ))}
    </div>
  </div>
  );
};

function App() {
  return (
    <div className="min-h-screen text-cq-ink font-sans selection:bg-cq-acc-soft">
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
