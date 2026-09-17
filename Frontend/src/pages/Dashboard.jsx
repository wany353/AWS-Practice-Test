import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import api from '../utils/api';
import { Target, TrendingUp, Clock, AlertCircle, BookOpen, ArrowRight, XCircle, PlayCircle, CheckCircle, Percent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const { t, tr, locale } = useI18n();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState(''); // '' = all exams
  // Practice progress of the "current exam" shown in the ring
  const [progressInfo, setProgressInfo] = useState({ answered: 0, total: 0, currentIndex: 0, hasProgress: false, examName: '' });

  // Exam list for the filter dropdown
  useEffect(() => {
    api.get('/Categories').then(({ data }) => setExams(data)).catch(() => {});
  }, []);

  // Stats (by filter) + practice progress of the current exam (for the ring)
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      const params = examFilter ? { categoryId: examFilter } : {};
      // Ring exam: the filter first; otherwise the last studied exam (cq-exam); otherwise the first exam
      let activeExamId = examFilter;
      if (!activeExamId) {
        const saved = localStorage.getItem('cq-exam');
        activeExamId = exams.some(e => String(e.id) === saved) ? saved : (exams[0] ? String(exams[0].id) : '');
      }
      try {
        const [historyRes, wrongRes, progRes] = await Promise.allSettled([
          api.get('/Questions/test-history', { params }),
          api.get('/WrongAnswers/count', { params }),
          activeExamId ? api.get('/PracticeProgress', { params: { categoryId: activeExamId } }) : Promise.resolve(null)
        ]);
        if (cancelled) return;

        if (historyRes.status === 'fulfilled') { setHistory(historyRes.value.data); setError(''); }
        else setError('dashboard.loadHistoryFailed');
        if (wrongRes.status === 'fulfilled') setWrongCount(wrongRes.value.data.count || 0);

        const exam = exams.find(e => String(e.id) === String(activeExamId));
        const total = exam?.questionCount || 0;
        let answered = 0, currentIndex = 0, hasProgress = false;
        if (progRes && progRes.status === 'fulfilled' && progRes.value) {
          const p = progRes.value.data;
          const ans = JSON.parse(p.answersJson || '{}');
          answered = Object.keys(ans).length;
          currentIndex = p.currentIndex || 0;
          hasProgress = currentIndex > 0 || answered > 0;
        }
        setProgressInfo({ answered, total, currentIndex, hasProgress, examName: exam?.name || '' });
        // Make "Continue / Start practice" open the exam shown in the ring
        try { if (activeExamId) localStorage.setItem('cq-exam', String(activeExamId)); } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [examFilter, exams]);

  const changeFilter = (id) => {
    setExamFilter(id);
    try { if (id) localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  const totalTests = history.length;
  const highestScore = totalTests > 0 ? Math.max(...history.map(h => h.score)) : 0;
  // Accuracy only uses records that stored a total (legacy rows have total = 0)
  const accRecords = history.filter(h => h.total > 0);
  const acc = (h) => Math.round((h.score / h.total) * 100);
  const avgAccuracy = accRecords.length ? Math.round(accRecords.reduce((s, h) => s + acc(h), 0) / accRecords.length) : 0;
  const latestAccuracy = accRecords.length ? acc(accRecords[0]) : 0;
  const passCount = accRecords.filter(h => acc(h) >= 70).length;
  // Ring: practice progress for the current exam
  const progressPercent = progressInfo.total > 0 ? Math.round((progressInfo.answered / progressInfo.total) * 100) : 0;
  const ringDash = ((progressPercent / 100) * 364.4).toFixed(1);
  const currentExamName = examFilter
    ? (exams.find(e => String(e.id) === String(examFilter))?.name || t('dashboard.selectedExam'))
    : t('common.allExams');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header banner */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 bg-cq-surface backdrop-blur-md rounded-2xl p-8 border border-cq-line shadow-cq-card">
        <div>
          <h1 className="font-display text-3xl font-bold text-cq-ink mb-2 tracking-tight">{t('dashboard.greeting', { name: user?.username })}</h1>
          <p className="text-cq-sub">{t('dashboard.tagline')}</p>
          {exams.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-cq-faint font-semibold">{t('dashboard.viewByExam')}</span>
              <select
                value={examFilter}
                onChange={(e) => changeFilter(e.target.value)}
                className="cq-select"
              >
                <option value="">{t('common.allExams')}</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 flex-wrap">
          {progressInfo.hasProgress ? (
            <Link
              to="/practice"
              className="px-6 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition duration-300 font-semibold flex items-center gap-2 shadow-cq-accent hover:brightness-110"
            >
              <PlayCircle className="w-4 h-4" />
              {t('dashboard.continuePractice', { n: progressInfo.currentIndex + 1 })}
            </Link>
          ) : (
            <Link to="/practice" className="px-6 py-2.5 bg-cq-panel hover:bg-cq-panel2 text-cq-ink rounded-xl transition duration-300 font-medium flex items-center gap-2 border border-cq-line">
              <BookOpen className="w-4 h-4 text-cq-acc" />
              {t('dashboard.startPractice')}
            </Link>
          )}
          <Link to="/exam" className="px-6 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition duration-300 font-semibold flex items-center gap-2 shadow-cq-accent hover:brightness-110">
            <Target className="w-4 h-4" />
            {t('dashboard.mockExam')}
          </Link>
        </div>
      </header>

      {/* Overview: progress ring + real metrics */}
      <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 md:p-7 shadow-cq-card">
        <div className="flex items-center justify-between mb-5">
          <span className="font-display font-bold text-cq-ink">{t('dashboard.overview')}</span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cq-acc-soft text-cq-acc">{currentExamName}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 items-center">
          {/* Practice progress ring (current exam) */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="relative w-[104px] h-[104px] flex-none mx-auto md:mx-0">
              <svg width="104" height="104" viewBox="0 0 132 132">
                <circle cx="66" cy="66" r="58" fill="none" stroke="var(--cq-line2)" strokeWidth="13" />
                <circle cx="66" cy="66" r="58" fill="none" stroke="var(--cq-acc)" strokeWidth="13" strokeLinecap="round"
                  strokeDasharray={`${ringDash} 400`} transform="rotate(-90 66 66)" style={{ transition: 'stroke-dasharray .6s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display text-2xl font-bold text-cq-ink">{progressPercent}%</div>
                <div className="text-[10.5px] text-cq-faint font-semibold">{t('dashboard.practiceProgress')}</div>
              </div>
            </div>
            <div className="text-xs text-cq-sub font-medium text-center md:text-left max-w-[160px]">
              {progressInfo.examName ? `${progressInfo.examName} · ` : ''}
              {tr('dashboard.answered', { count: <span className="font-mono text-cq-ink">{progressInfo.answered}/{progressInfo.total}</span> })}
            </div>
          </div>
          {/* Metric chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { Icon: Percent, val: `${avgAccuracy}%`, label: t('dashboard.avgAccuracy'), color: 'text-cq-acc' },
              { Icon: CheckCircle, val: passCount, label: t('dashboard.passCount'), color: 'text-cq-ok' },
              { Icon: TrendingUp, val: `${latestAccuracy}%`, label: t('dashboard.latest'), color: 'text-cq-gold' },
            ].map(({ Icon, val, label, color }) => (
              <div key={label} className="flex items-center gap-3 bg-cq-panel border border-cq-line rounded-xl px-4 py-3.5">
                <Icon className={`w-6 h-6 flex-none ${color}`} />
                <div>
                  <div className="font-display text-xl font-bold text-cq-ink leading-none">{val}</div>
                  <div className="text-xs text-cq-faint font-semibold mt-1">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4 hover:border-cq-acc transition duration-300">
          <div className="w-14 h-14 flex-none rounded-full bg-cq-acc-soft flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-cq-acc" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">{t('dashboard.testsTaken')}</p>
            <p className="font-mono text-2xl font-bold text-cq-ink">{totalTests}</p>
          </div>
        </div>
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4 hover:border-cq-ok transition duration-300">
          <div className="w-14 h-14 flex-none rounded-full bg-cq-ok-soft flex items-center justify-center">
            <Target className="w-7 h-7 text-cq-ok" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">{t('dashboard.bestScore')}</p>
            <p className="font-mono text-2xl font-bold text-cq-ink">{highestScore}</p>
          </div>
        </div>
        {/* Wrong-answer book shortcut */}
        <Link
          to="/wrong-answers"
          className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4 hover:border-cq-bad transition duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 flex-none rounded-full bg-cq-bad-soft flex items-center justify-center">
            <XCircle className="w-7 h-7 text-cq-bad" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">{t('dashboard.wrongBook')}</p>
            <p className="text-sm text-cq-sub font-medium">{tr('dashboard.wrongCount', { n: <span className="font-mono text-2xl font-bold text-cq-ink">{wrongCount}</span> })}</p>
          </div>
        </Link>
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4">
          <div className="w-14 h-14 flex-none rounded-full bg-cq-gold-soft flex items-center justify-center">
            <Clock className="w-7 h-7 text-cq-gold" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">{t('dashboard.accountStatus')}</p>
            <p className="text-lg font-bold text-cq-ink">{user?.role === 'Admin' ? t('dashboard.roleAdmin') : t('dashboard.roleMember')}</p>
          </div>
        </div>
      </div>

      {/* Unfinished-practice banner (shown when there is progress) */}
      {progressInfo.hasProgress && (
        <div className="bg-cq-ok-soft border border-cq-ok rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-cq-ok flex-shrink-0" />
            <div>
              <p className="text-cq-ok font-semibold">{progressInfo.examName ? t('dashboard.unfinishedWithExam', { exam: progressInfo.examName }) : t('dashboard.unfinished')}</p>
              <p className="text-cq-sub text-sm">{t('dashboard.stoppedAt', { n: progressInfo.currentIndex + 1 })}</p>
            </div>
          </div>
          <Link
            to="/practice"
            className="flex items-center gap-2 px-4 py-2 bg-cq-ok hover:bg-cq-ok text-white rounded-xl transition font-medium text-sm"
          >
            {t('common.continue')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Mock exam history */}
      <div className="bg-cq-surface border border-cq-line rounded-2xl shadow-cq-card overflow-hidden">
        <div className="px-6 py-5 border-b border-cq-line">
          <h3 className="font-display text-lg font-semibold text-cq-ink">{t('dashboard.historyTitle')}</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cq-acc mb-4"></div>
              <p className="text-cq-sub">{t('dashboard.loadingHistory')}</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-cq-bad bg-cq-bad-soft p-4 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              {t(error)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cq-panel rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-cq-faint" />
              </div>
              <h4 className="text-lg font-medium text-cq-ink mb-2">{t('dashboard.noHistoryTitle')}</h4>
              <p className="text-cq-faint mb-6">{t('dashboard.noHistoryDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cq-line">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">{t('dashboard.colTime')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">{t('dashboard.colScore')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">{t('dashboard.colAccuracy')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">{t('dashboard.colRating')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cq-line">
                  {history.map((record) => {
                    const a = record.total > 0 ? Math.round((record.score / record.total) * 100) : null;
                    const rating = a == null ? '—' : a >= 80 ? t('dashboard.ratingExcellent') : a >= 60 ? t('dashboard.ratingGood') : t('dashboard.ratingKeepGoing');
                    return (
                      <tr key={record.id} className="hover:bg-cq-panel2 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cq-sub">
                          {new Date(record.createdAt).toLocaleString(locale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-cq-acc-soft text-cq-acc font-mono">
                            {record.score}{record.total ? ` / ${record.total}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-cq-ink">
                          {a == null ? '—' : `${a}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cq-sub">
                          {rating}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
