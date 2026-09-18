import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';
import { hasRealAnalysis } from '../utils/analysis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Clock, AlertTriangle, UserCheck, XOctagon, Trophy, Target, BarChart3, BookOpen, Play, Pause, Flag } from 'lucide-react';

export const MockExam = () => {
  const { t } = useI18n();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Exams (question bank categories)
  const [exams, setExams] = useState([]);
  const [categoryId, setCategoryId] = useState('');

  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour test
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'running' | 'paused'
  const navigate = useNavigate();

  // Load exams; default to the last used exam (cq-exam), otherwise the first
  useEffect(() => {
    api.get('/Categories')
      .then(({ data }) => {
        setExams(data);
        if (data.length > 0) {
          const saved = localStorage.getItem('cq-exam');
          const valid = data.some(e => String(e.id) === saved);
          setCategoryId(valid ? saved : String(data[0].id));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const selectExam = (id) => {
    setCategoryId(id);
    try { localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  // Draw up to 65 questions from the selected exam; switching exams resets to a fresh attempt
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/Questions', { params: { categoryId } });
        if (cancelled) return;
        // Shuffle and take max 65 questions (standard AWS test) if available
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 65).map(q => ({
          ...q,
          options: JSON.parse(q.optionsJson)
        }));
        setQuestions(selected);
        setAnswers({});
        setSubmitted(false);
        setScoreResult(null);
        setTimeLeft(60 * 60);
        setPhase('idle'); // Back to the start screen after switching exams; never auto-start
      } catch {
        if (!cancelled) setError('exam.loadFailed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchQuestions();
    return () => { cancelled = true; };
  }, [categoryId]);

  useEffect(() => {
    if (phase !== 'running' || submitted || error) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, submitted, error, answers]);

  const handleOptionSelect = (qIndex, opt) => {
    if (submitted || phase !== 'running') return;
    const q = questions[qIndex];
    const isMulti = q.type.includes('Multiple');
    const existing = answers[q.id] || [];
    
    let userAns;
    if (isMulti) {
      if (existing.includes(opt)) {
        userAns = existing.filter(a => a !== opt);
      } else {
        userAns = [...existing, opt];
      }
    } else {
      userAns = [opt];
    }
    setAnswers({ ...answers, [q.id]: userAns });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    
    // Formatting answers for API
    const submissionData = {
      CategoryId: categoryId ? Number(categoryId) : null,
      Answers: Object.keys(answers).map(questionId => ({
        QuestionId: parseInt(questionId),
        UserAnswer: answers[questionId].join(', ')
      }))
    };

    try {
      const { data } = await api.post('/Questions/submit-test', submissionData);
      setScoreResult(data);
    } catch {
      alert(t('exam.submitFailed'));
      setSubmitted(false);
    }
  };

  const startExam = () => setPhase('running');
  const pauseExam = () => setPhase('paused');
  const resumeExam = () => setPhase('running');
  const giveUp = () => {
    if (!window.confirm(t('exam.confirmGiveUp'))) return;
    setAnswers({});
    setSubmitted(false);
    setScoreResult(null);
    setTimeLeft(60 * 60);
    setPhase('idle');
    try { window.scrollTo(0, 0); } catch { /* ignore */ }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cq-acc mx-auto mt-20"></div>;
  if (error || questions.length === 0) return <div className="text-center mt-20 text-cq-bad">{error ? t(error) : t('exam.noQuestions')}</div>;

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {phase === 'idle' && !scoreResult ? (
        /* ===== Start screen (the exam never auto-starts) ===== */
        <div className="max-w-xl mx-auto mt-6 bg-cq-surface border border-cq-line rounded-2xl p-8 md:p-10 shadow-cq-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-cq-acc-soft flex items-center justify-center mx-auto mb-5">
            <Target className="w-8 h-8 text-cq-acc" />
          </div>
          <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">{t('exam.startTitle')}</h2>
          <p className="text-cq-sub text-sm mb-6">{t('exam.startDesc')}</p>
          {exams.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-sm text-cq-faint">{t('common.exam')}</span>
              <select value={categoryId} onChange={(e) => selectExam(e.target.value)} className="cq-select">
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mb-7">
            <div className="bg-cq-panel border border-cq-line rounded-xl py-3">
              <div className="font-display text-xl font-bold text-cq-ink">{questions.length}</div>
              <div className="text-xs text-cq-faint mt-0.5">{t('exam.questions')}</div>
            </div>
            <div className="bg-cq-panel border border-cq-line rounded-xl py-3">
              <div className="font-display text-xl font-bold text-cq-ink">60</div>
              <div className="text-xs text-cq-faint mt-0.5">{t('exam.minutes')}</div>
            </div>
            <div className="bg-cq-panel border border-cq-line rounded-xl py-3">
              <div className="font-display text-xl font-bold text-cq-ink">70%</div>
              <div className="text-xs text-cq-faint mt-0.5">{t('exam.passMark')}</div>
            </div>
          </div>
          <button onClick={startExam} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-bold shadow-cq-accent hover:brightness-110 transition">
            <Play className="w-5 h-5" /> {t('exam.start')}
          </button>
        </div>
      ) : (
      <>
      {!scoreResult && (
      /* Sticky Top Bar for Timer & controls */
      <div className="sticky top-20 z-40 bg-cq-surface backdrop-blur-md border border-cq-line rounded-2xl p-4 flex justify-between items-center mb-8 shadow-cq-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cq-acc-soft rounded-lg">
            <Clock className="w-6 h-6 text-cq-acc" />
          </div>
          <div>
            <p className="text-xs text-cq-sub font-medium tracking-wide">{phase === 'paused' ? t('exam.paused') : t('exam.timeLeft')}</p>
            <p className={`text-xl font-mono font-bold ${phase === 'paused' ? 'text-cq-faint' : timeLeft < 300 ? 'text-cq-bad animate-pulse' : 'text-cq-ink'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm text-cq-sub hidden sm:block">
            {t('exam.answeredCount', { done: Object.keys(answers).length, total: questions.length })}
          </span>
          {phase === 'running' ? (
            <button onClick={pauseExam} title={t('exam.pause')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cq-panel hover:bg-cq-panel2 border border-cq-line text-cq-ink text-sm font-medium transition">
              <Pause className="w-4 h-4" /> {t('exam.pause')}
            </button>
          ) : (
            <button onClick={resumeExam} title={t('exam.resume')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cq-panel hover:bg-cq-panel2 border border-cq-line text-cq-ink text-sm font-medium transition">
              <Play className="w-4 h-4" /> {t('exam.resume')}
            </button>
          )}
          <button onClick={giveUp} title={t('exam.giveUpTitle')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cq-bad-soft border border-cq-bad text-cq-bad text-sm font-medium transition">
            <Flag className="w-4 h-4" /> {t('exam.giveUp')}
          </button>
          <button
            onClick={() => {
              if(window.confirm(t('exam.confirmSubmit'))) handleSubmit();
            }}
            className="px-5 py-2 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-semibold rounded-xl transition duration-300 shadow-cq-accent hover:brightness-110"
          >
            {t('exam.submit')}
          </button>
        </div>
      </div>
      )}

      {scoreResult && (() => {
        const score = scoreResult.score;
        const total = scoreResult.totalQuestions;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const passed = percentage >= 70;

        return (
          <div className={`mb-8 border rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden ${
            passed
              ? 'bg-cq-ok-soft border-cq-ok'
              : 'bg-cq-bad-soft border-cq-bad'
          }`}>
            {/* Result header */}
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
                passed ? 'bg-cq-ok-soft' : 'bg-cq-bad-soft'
              }`}>
                {passed
                  ? <Trophy className="w-10 h-10 text-cq-ok" />
                  : <XOctagon className="w-10 h-10 text-cq-bad" />
                }
              </div>

              <h2 className="font-display text-2xl font-bold text-cq-ink mb-1">{t('exam.complete')}</h2>
              <p className={`text-lg font-semibold mb-6 ${
                passed ? 'text-cq-ok' : 'text-cq-bad'
              }`}>
                {passed ? t('exam.passed') : t('exam.failed')}
              </p>

              {/* Score */}
              <div className={`inline-block font-display text-6xl font-extrabold ${passed ? 'text-cq-ok' : 'text-cq-bad'}`}>
                {percentage}%
              </div>
              <p className="text-cq-sub text-sm mt-2">{t('exam.accuracy')}</p>
            </div>

            {/* Stats bar */}
            <div className="border-t border-cq-line bg-cq-panel px-8 py-5 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cq-sub text-xs mb-1">
                  <Target className="w-3.5 h-3.5" /> {t('exam.total')}
                </div>
                <p className="font-mono text-xl font-bold text-cq-ink">{total}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cq-ok text-xs mb-1">
                  <UserCheck className="w-3.5 h-3.5" /> {t('exam.correct')}
                </div>
                <p className="text-xl font-bold text-cq-ok">{score}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cq-bad text-xs mb-1">
                  <BarChart3 className="w-3.5 h-3.5" /> {t('exam.wrong')}
                </div>
                <p className="text-xl font-bold text-cq-bad">{total - score}</p>
              </div>
            </div>

            {/* Pass mark + actions */}
            <div className="border-t border-cq-line px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-cq-faint">
                {t('exam.passStandard')}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  passed
                    ? 'bg-cq-ok-soft text-cq-ok'
                    : 'bg-cq-bad-soft text-cq-bad'
                }`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/practice')} className="px-5 py-2.5 bg-cq-panel hover:bg-cq-panel2 text-cq-ink rounded-xl transition text-sm">{t('exam.reviewInPractice')}</button>
                <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition shadow-cq-accent hover:brightness-110 text-sm">{t('exam.backToDashboard')}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* While paused, hide questions behind an overlay */}
      {phase === 'paused' && !scoreResult ? (
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-12 text-center shadow-cq-card">
          <div className="w-16 h-16 rounded-2xl bg-cq-acc-soft flex items-center justify-center mx-auto mb-4">
            <Pause className="w-8 h-8 text-cq-acc" />
          </div>
          <h3 className="font-display text-xl font-bold text-cq-ink mb-2">{t('exam.pausedTitle')}</h3>
          <p className="text-cq-sub text-sm mb-6">{t('exam.pausedDesc')}</p>
          <button onClick={resumeExam} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-bold shadow-cq-accent hover:brightness-110 transition">
            <Play className="w-5 h-5" /> {t('exam.resumeExam')}
          </button>
        </div>
      ) : (
      <div className="space-y-12">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-cq-surface border border-cq-line rounded-2xl p-6 md:p-8 shadow-cq-card scroll-mt-32" id={`question-${idx}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-cq-panel flex items-center justify-center font-mono font-bold text-cq-sub border border-cq-line">
                {idx + 1}
              </div>
              <p className="text-lg text-cq-ink mt-1 leading-relaxed font-medium">
                {q.content}
              </p>
            </div>
            
            <div className="space-y-3 pl-12">
              {q.options.map((opt, oIdx) => {
                const isSelected = (answers[q.id] || []).includes(opt);
                return (
                  <button
                    key={oIdx}
                    disabled={submitted}
                    onClick={() => handleOptionSelect(idx, opt)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 ${
                      isSelected
                        ? 'bg-cq-acc-soft border-cq-acc text-cq-ink'
                        : 'bg-cq-panel border-cq-line text-cq-sub hover:bg-cq-panel hover:border-cq-faint'
                    } ${submitted ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div className={`mt-0.5 min-w-[20px] h-[20px] rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-cq-acc bg-cq-acc' : 'border-cq-faint'
                    } ${q.type.includes('Multiple') ? 'rounded-md' : 'rounded-full'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Show answer after submit */}
            {submitted && (
              <div className="mt-6 pl-12">
                <div className="p-4 bg-cq-ok-soft border border-cq-ok rounded-xl">
                  <span className="text-cq-ok font-bold mb-2 block">{t('common.correctAnswerIs', { answer: q.answer })}</span>
                  {hasRealAnalysis(q.analysis) && (
                    <div className="mt-2 prose prose-sm prose-invert max-w-none
                      prose-p:text-cq-sub prose-p:leading-relaxed prose-p:my-1
                      prose-strong:text-cq-acc
                      prose-code:text-cq-gold prose-code:bg-cq-panel prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                      prose-ul:text-cq-sub prose-li:my-0.5
                      prose-h2:text-cq-ink prose-h2:text-base prose-h3:text-cq-sub prose-h3:text-sm
                      prose-blockquote:border-cq-acc prose-blockquote:text-cq-faint">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {q.analysis}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
      </>
      )}
    </div>
  );
};
