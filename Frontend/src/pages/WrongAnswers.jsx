import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';
import { hasRealAnalysis } from '../utils/analysis';
import { Trash2, RefreshCw, AlertCircle, Loader2, BookOpen, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WrongAnswers = () => {
  const { t, tr } = useI18n();
  const [wrongList, setWrongList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [removing, setRemoving] = useState({});
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState(''); // '' = all exams

  useEffect(() => {
    api.get('/Categories').then(({ data }) => setExams(data)).catch(() => {});
  }, []);

  const fetchWrongAnswers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = examFilter ? { categoryId: examFilter } : {};
      const { data } = await api.get('/WrongAnswers', { params });
      const parsed = data.map(w => ({
        ...w,
        options: JSON.parse(w.optionsJson || '[]'),
        userAnswer: JSON.parse(w.userAnswerJson || '[]')
      }));
      setWrongList(parsed);
    } catch {
      setError('wrong.loadFailed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWrongAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examFilter]);

  const changeFilter = (id) => {
    setExamFilter(id);
    try { if (id) localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRemove = async (questionId) => {
    setRemoving(prev => ({ ...prev, [questionId]: true }));
    try {
      await api.delete(`/WrongAnswers/${questionId}`);
      setWrongList(prev => prev.filter(w => w.questionId !== questionId));
    } catch {
      alert(t('wrong.removeFailed'));
    } finally {
      setRemoving(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="animate-spin w-12 h-12 text-cq-acc" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
      {/* Title bar */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cq-ink tracking-tight">{t('wrong.title')}</h1>
          <p className="text-cq-sub mt-1">
            {tr('wrong.total', { n: <span className="text-cq-bad font-semibold">{wrongList.length}</span> })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {exams.length > 0 && (
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
          )}
          <button
            onClick={fetchWrongAnswers}
            className="flex items-center gap-2 px-4 py-2 bg-cq-panel hover:bg-cq-panel2 text-cq-sub rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-cq-bad bg-cq-bad-soft p-4 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5" />
          {t(error)}
        </div>
      )}

      {wrongList.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-cq-ok-soft flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-cq-ok" />
          </div>
          <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">{t('wrong.emptyTitle')}</h2>
          <p className="text-cq-sub mb-6">{t('wrong.emptyDesc')}</p>
          <Link
            to="/practice"
            className="px-6 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition font-semibold flex items-center gap-2 shadow-cq-accent hover:brightness-110"
          >
            <BookOpen className="w-4 h-4" />
            {t('wrong.goPractice')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wrongList.map((item, idx) => {
            const isExpanded = expanded[item.id];
            return (
              <div
                key={item.id}
                className="bg-cq-surface backdrop-blur-xl border border-cq-bad rounded-2xl overflow-hidden shadow-cq-card transition hover:border-cq-bad"
              >
                {/* Question header (collapsible) */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-start gap-4 p-5 text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cq-bad-soft flex items-center justify-center mt-0.5">
                    <XCircle className="w-4 h-4 text-cq-bad" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-cq-panel text-cq-sub rounded-full font-mono">
                        {item.questionType}
                      </span>
                      <span className="text-xs text-cq-faint font-mono">#{idx + 1}</span>
                    </div>
                    <p className="text-cq-ink text-sm leading-relaxed line-clamp-2 whitespace-pre-wrap">
                      {item.questionContent}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2 mt-1 text-cq-faint">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-cq-line pt-4">
                    {/* Options */}
                    <div className="space-y-2">
                      {item.options.map((opt, oidx) => {
                        const isCorrect = item.answer.includes(opt.substring(0, 1));
                        const isUserSelected = item.userAnswer.includes(opt);
                        return (
                          <div
                            key={oidx}
                            className={`p-3 rounded-xl text-sm border flex items-center gap-3 ${
                              isCorrect
                                ? 'bg-cq-ok-soft border-cq-ok text-cq-ok'
                                : isUserSelected
                                  ? 'bg-cq-bad-soft border-cq-bad text-cq-bad'
                                  : 'bg-cq-panel border-cq-line text-cq-faint'
                            }`}
                          >
                            <span className="flex-shrink-0">
                              {isCorrect ? '✅' : isUserSelected ? '❌' : '　'}
                            </span>
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    {/* Answer comparison */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-cq-sub">{t('wrong.myAnswer')}</span>
                        <span className="font-mono text-cq-bad">{item.userAnswer.map(a => a.substring(0, 1)).join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cq-sub">{t('wrong.correctAnswer')}</span>
                        <span className="font-mono text-cq-ok">{item.answer}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {hasRealAnalysis(item.analysis) && (
                      <div className="p-4 bg-cq-surface border border-cq-line rounded-xl text-cq-sub text-sm leading-relaxed">
                        <h4 className="font-bold text-cq-acc mb-1">{t('wrong.explanation')}</h4>
                        {item.analysis}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRemove(item.questionId)}
                        disabled={removing[item.questionId]}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-cq-bad-soft hover:bg-cq-bad-soft text-cq-bad rounded-xl transition disabled:opacity-50"
                      >
                        {removing[item.questionId]
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                        {t('wrong.remove')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
