import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Layers, Clock, Lock, FileText, ArrowRight, PlayCircle, Loader2, AlertCircle } from 'lucide-react';

const DAY = 24 * 60 * 60 * 1000;

// Days since the last practice session, or null when never practised. Computed
// when the data arrives: reading the clock during render is impure.
const daysSince = (iso) => {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((Date.now() - at) / DAY));
};

export const BrowseBanks = () => {
  const { user } = useAuth();
  const { t, tr, locale } = useI18n();
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    api.get('/Categories/overview')
      .then(({ data }) => setBanks(data.map((bank) => ({ ...bank, daysSincePractice: daysSince(bank.lastPracticedAt) }))))
      .catch(() => setError('banks.loadFailed'))
      .finally(() => setLoading(false));
  }, []);

  // Separate keys for 1 day / 1 week keep English from reading "1 days ago"
  const lastText = (days) => {
    if (days === null) return t('banks.lastNever');
    if (days === 0) return t('banks.lastToday');
    if (days === 1) return t('banks.lastYesterday');
    if (days < 7) return t('banks.lastDays', { n: days });
    const weeks = Math.round(days / 7);
    if (weeks === 1) return t('banks.lastWeek');
    return t('banks.lastWeeks', { n: weeks });
  };

  const sorted = useMemo(() => {
    const list = [...banks];
    if (sortBy === 'size') list.sort((a, b) => b.questionCount - a.questionCount);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => {
      // Most recently practised first; never-practised banks go last
      const at = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : -Infinity;
      const bt = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : -Infinity;
      return bt - at;
    });
    return list;
  }, [banks, sortBy]);

  const totalQuestions = banks.reduce((sum, b) => sum + b.questionCount, 0);

  // The practice page opens whichever exam was used last
  const startPractice = (id) => {
    try { localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
    navigate('/practice');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="animate-spin w-12 h-12 text-cq-acc" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-20">
      {/* Title bar */}
      <div className="flex flex-wrap gap-4 items-end justify-between mb-7">
        <div>
          <h1 className="font-display text-3xl font-bold text-cq-ink tracking-tight mb-1.5">{t('banks.title')}</h1>
          <p className="text-sm text-cq-faint">{t('banks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-cq-acc-soft text-cq-acc">
            {t('banks.summary', { banks: banks.length, questions: totalQuestions.toLocaleString(locale) })}
          </span>
          {banks.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t('banks.sortLabel')}
              className="cq-select"
            >
              <option value="recent">{t('banks.sortRecent')}</option>
              <option value="name">{t('banks.sortName')}</option>
              <option value="size">{t('banks.sortSize')}</option>
            </select>
          )}
        </div>
      </div>

      {/* Guests may browse, but practice needs an account */}
      {!user && !error && (
        <div className="flex items-center gap-3 px-[18px] py-3.5 rounded-2xl border border-cq-line bg-cq-panel mb-5">
          <Lock className="w-[18px] h-[18px] text-cq-gold flex-none" />
          <p className="text-sm text-cq-sub">
            {tr('banks.guestNotice', {
              login: <Link to="/login" className="text-cq-acc font-semibold hover:text-cq-gold transition">{t('banks.guestLogin')}</Link>
            })}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-cq-bad bg-cq-bad-soft p-4 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5" />
          {t(error)}
        </div>
      )}

      {banks.length === 0 && !error ? (
        <div className="bg-cq-surface border border-cq-line rounded-3xl shadow-cq-card px-8 py-[72px] text-center">
          <div className="w-16 h-16 mx-auto mb-[18px] rounded-full bg-cq-panel flex items-center justify-center text-cq-faint">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="font-display text-[22px] font-bold text-cq-ink mb-2">{t('banks.emptyTitle')}</h2>
          <p className="text-sm text-cq-faint max-w-md mx-auto leading-[1.7]">{t('banks.emptyDesc')}</p>
        </div>
      ) : (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(288px,1fr))]">
          {sorted.map((bank) => {
            const percent = bank.questionCount ? Math.round((bank.answered / bank.questionCount) * 100) : 0;
            // "Completed" is per user, so it never shows to a signed-out visitor
            const done = !!user && bank.questionCount > 0 && bank.answered >= bank.questionCount;
            const notStarted = bank.answered === 0;
            const highlighted = !!user && !done;

            return (
              <div
                key={bank.id}
                className="bg-cq-surface border border-cq-line rounded-2xl p-[22px] shadow-cq-card flex flex-col gap-[18px] transition duration-300 hover:border-cq-faint hover:-translate-y-0.5"
              >
                {/* Name, code and completion badge */}
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 flex-none rounded-xl bg-cq-acc-soft flex items-center justify-center text-cq-acc">
                    <Layers className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base font-bold text-cq-ink leading-[1.3]">{bank.name}</div>
                    {bank.description && (
                      <div className="font-mono text-[11px] text-cq-faint mt-1">{bank.description}</div>
                    )}
                  </div>
                  {done && (
                    <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-cq-ok-soft text-cq-ok flex-none">
                      {t('banks.done')}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[26px] font-bold text-cq-ink leading-none">
                    {bank.questionCount.toLocaleString(locale)}
                  </span>
                  <span className="text-xs font-semibold text-cq-faint">{t('banks.questionsUnit')}</span>
                </div>

                {user && (
                  <div>
                    <div className="flex justify-between items-baseline mb-[7px]">
                      <span className="text-xs font-semibold text-cq-sub">{t('banks.progress')}</span>
                      <span className="font-mono text-xs text-cq-ink">
                        {t('banks.progressValue', { answered: bank.answered, total: bank.questionCount, percent })}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-cq-panel2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${done ? 'bg-cq-ok' : 'bg-gradient-to-br from-cq-coral to-cq-amber'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-cq-line flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cq-faint">
                    <Clock className="w-3.5 h-3.5" />
                    {user ? lastText(bank.daysSincePractice) : t('banks.lastNever')}
                  </span>
                  {user ? (
                    <button
                      onClick={() => startPractice(bank.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] text-[13px] font-bold transition hover:brightness-110 ${
                        highlighted
                          ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent border border-transparent'
                          : 'bg-cq-panel text-cq-sub border border-cq-line'
                      }`}
                    >
                      {done ? t('banks.ctaAgain') : notStarted ? t('banks.ctaStart') : t('banks.ctaContinue')}
                      {notStarted && !done ? <PlayCircle className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] text-[13px] font-bold bg-cq-panel text-cq-sub border border-cq-line transition hover:brightness-110"
                    >
                      {t('banks.ctaSignIn')}
                      <Lock className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
