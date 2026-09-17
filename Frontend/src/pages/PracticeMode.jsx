import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';
import { hasRealAnalysis } from '../utils/analysis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  AlertCircle, BookOpen, ArrowRight, Loader2, PlayCircle,
  RefreshCw, RotateCcw
} from 'lucide-react';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Compare answers (order-insensitive)
function isAnswerCorrect(userAnswerArr, correctAnswer) {
  if (!correctAnswer) return false;
  const userLetters = userAnswerArr.map(opt => opt.substring(0, 1)).sort().join('');
  const correctLetters = correctAnswer.replace(/[^A-Z]/g, '').split('').sort().join('');
  return userLetters === correctLetters;
}


// ====== Start-mode modal ======
const StartModal = ({ progress, onContinue, onRestart }) => {
  const { t, tr } = useI18n();
  const hasProgress = progress &&
    (progress.currentIndex > 0 || (progress.answersJson && progress.answersJson !== '{}'));

  const answeredCount = hasProgress
    ? Object.keys(JSON.parse(progress.answersJson || '{}')).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-cq-surface border border-cq-line rounded-2xl shadow-cq-card max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-cq-acc-soft flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-cq-acc" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-cq-ink">{t('practice.welcomeBack')}</h2>
            <p className="text-cq-sub text-sm">{t('practice.chooseMode')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {hasProgress ? (
            <button
              onClick={onContinue}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-cq-ok bg-cq-ok-soft hover:bg-cq-ok-soft text-left transition group"
            >
              <PlayCircle className="w-8 h-8 text-cq-ok flex-shrink-0" />
              <div>
                <p className="font-semibold text-cq-ok">{t('practice.continueLast')}</p>
                <p className="text-sm text-cq-sub mt-0.5">
                  {tr('practice.continueDetail', {
                    n: <span className="text-cq-ok font-bold">{progress.currentIndex + 1}</span>,
                    count: <span className="text-cq-ok font-bold">{answeredCount}</span>,
                  })}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-cq-faint group-hover:text-cq-ok ml-auto transition" />
            </button>
          ) : (
            <div className="w-full flex items-center gap-4 p-4 rounded-xl border border-cq-line bg-cq-panel text-left opacity-60 cursor-not-allowed">
              <PlayCircle className="w-8 h-8 text-cq-faint flex-shrink-0" />
              <div>
                <p className="font-semibold text-cq-sub">{t('practice.continueLast')}</p>
                <p className="text-sm text-cq-faint mt-0.5">{t('practice.noProgress')}</p>
              </div>
            </div>
          )}

          <button
            onClick={onRestart}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-cq-acc bg-cq-acc-soft hover:bg-cq-acc-soft text-left transition group"
          >
            <RefreshCw className="w-8 h-8 text-cq-acc flex-shrink-0" />
            <div>
              <p className="font-semibold text-cq-acc">{t('practice.restart')}</p>
              <p className="text-sm text-cq-sub mt-0.5">{t('practice.restartDesc')}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-cq-faint group-hover:text-cq-acc ml-auto transition" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== Main component ======
export const PracticeMode = () => {
  const { t, tr } = useI18n();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Exams (question bank categories)
  const [exams, setExams] = useState([]);
  const [categoryId, setCategoryId] = useState('');

  // Submitted answers { [questionIndex]: string[] }
  const [answers, setAnswers] = useState({});
  // Options currently selected (not yet submitted) for this question
  const [pendingSelection, setPendingSelection] = useState([]);
  // Set of submitted questions { [questionIndex]: true }
  const [submitted, setSubmitted] = useState({});
  // Auto-save status (translation key)
  const [saveStatus, setSaveStatus] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  // Prevents empty state from overwriting server progress on remount
  const readyToSave = useRef(false);

  // Debounce
  const debouncedIndex = useDebounce(currentIndex, 1500);
  const debouncedAnswers = useDebounce(answers, 1500);

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

  // Switch exam and remember the choice
  const selectExam = (id) => {
    setCategoryId(id);
    try { localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  // Load the selected exam's questions + its own progress, then show the continue/restart modal
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    readyToSave.current = false; // Pause auto-save while loading
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [questionsRes, progressRes] = await Promise.all([
          api.get('/Questions', { params: { categoryId } }),
          api.get('/PracticeProgress', { params: { categoryId } }).catch(() => null)
        ]);
        if (cancelled) return;

        const parsed = questionsRes.data.map(q => ({
          ...q,
          options: JSON.parse(q.optionsJson)
        }));
        setQuestions(parsed);
        // After loading/switching exams, clear local answer state until the user picks continue or restart
        setCurrentIndex(0);
        setAnswers({});
        setSubmitted({});
        setPendingSelection([]);
        setSavedProgress(progressRes?.data || null);
        setShowModal(true);
      } catch (err) {
        if (!cancelled) setError('practice.loadFailed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [categoryId]);

  // Auto-save progress (only after the user has chosen; saved per exam)
  useEffect(() => {
    if (questions.length === 0 || !readyToSave.current || !categoryId) return;
    const save = async () => {
      try {
        await api.post('/PracticeProgress', {
          categoryId: Number(categoryId),
          currentIndex: debouncedIndex,
          answersJson: JSON.stringify(debouncedAnswers)
        });
        setSaveStatus('practice.autoSaved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch { /* fail silently */ }
    };
    save();
  }, [debouncedIndex, debouncedAnswers]);

  // Reset pending selection when the question changes
  useEffect(() => {
    setPendingSelection([]);
  }, [currentIndex]);

  // ===== Modal callbacks =====
  const handleContinue = () => {
    if (savedProgress) {
      const idx = savedProgress.currentIndex || 0;
      const savedAnswers = JSON.parse(savedProgress.answersJson || '{}');
      setCurrentIndex(idx);
      setAnswers(savedAnswers);
      const submittedMap = {};
      Object.keys(savedAnswers).forEach(k => { submittedMap[k] = true; });
      setSubmitted(submittedMap);
    }
    setShowModal(false);
    // Wait for debounced values to settle before enabling auto-save (1.5s debounce + 0.5s buffer)
    setTimeout(() => { readyToSave.current = true; }, 2000);
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted({});
    setPendingSelection([]);
    setShowModal(false);
    // Restart can save immediately (empty state is correct)
    readyToSave.current = true;
    // Clear this exam's progress on the server
    try {
      await api.post('/PracticeProgress', { categoryId: Number(categoryId), currentIndex: 0, answersJson: '{}' });
    } catch { /* fail silently */ }
  };

  const currentQ = questions[currentIndex];
  const isSubmitted = submitted[currentIndex];
  const isMulti = currentQ?.type?.includes('Multiple');

  const handleOptionSelect = (opt) => {
    if (isSubmitted) return;
    if (isMulti) {
      setPendingSelection(prev =>
        prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt]
      );
    } else {
      setPendingSelection([opt]);
    }
  };

  const handleSubmit = async () => {
    if (!currentQ || pendingSelection.length === 0) return;
    const correct = isAnswerCorrect(pendingSelection, currentQ.answer);

    const newAnswers = { ...answers, [currentIndex]: pendingSelection };
    setAnswers(newAnswers);
    setSubmitted(prev => ({ ...prev, [currentIndex]: true }));

    if (!correct) {
      try {
        await api.post('/WrongAnswers', {
          questionId: currentQ.id,
          userAnswerJson: JSON.stringify(pendingSelection)
        });
      } catch { /* fail silently */ }
    }
  };

  // Redo the current question
  const handleRedo = () => {
    setPendingSelection([]);
    setSubmitted(prev => {
      const n = { ...prev };
      delete n[currentIndex];
      return n;
    });
    setAnswers(prev => {
      const n = { ...prev };
      delete n[currentIndex];
      return n;
    });
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const getOptionStyle = (opt) => {
    const isPending = pendingSelection.includes(opt);
    const isCorrectOpt = currentQ?.answer?.includes(opt.substring(0, 1));
    const userAns = answers[currentIndex] || [];
    const isUserSelected = userAns.includes(opt);

    if (!isSubmitted) {
      return isPending
        ? 'bg-cq-acc-soft border-cq-acc text-cq-ink'
        : 'bg-cq-panel border-cq-line text-cq-sub hover:bg-cq-panel hover:border-cq-faint cursor-pointer';
    }
    if (isCorrectOpt) return 'bg-cq-ok-soft border-cq-ok text-cq-ok';
    if (isUserSelected && !isCorrectOpt) return 'bg-cq-bad-soft border-cq-bad text-cq-bad';
    return 'bg-cq-panel border-cq-line text-cq-faint';
  };

  const getCheckboxStyle = (opt) => {
    const isPending = pendingSelection.includes(opt);
    const isCorrectOpt = currentQ?.answer?.includes(opt.substring(0, 1));
    const userAns = answers[currentIndex] || [];
    const isUserSelected = userAns.includes(opt);

    if (!isSubmitted) return isPending ? 'border-cq-acc bg-cq-acc' : 'border-cq-faint';
    if (isCorrectOpt) return 'border-cq-ok bg-cq-ok';
    if (isUserSelected) return 'border-cq-bad bg-cq-bad';
    return 'border-cq-faint';
  };

  // ===== Render =====
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="animate-spin w-12 h-12 text-cq-acc" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-cq-gold mb-4" />
        <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">{error ? t(error) : t('practice.emptyBank')}</h2>
        <p className="text-cq-sub">{t('practice.emptyBankDesc')}</p>
      </div>
    );
  }

  const correctResult = isSubmitted
    ? isAnswerCorrect(answers[currentIndex] || [], currentQ.answer)
    : null;

  return (
    <>
      {/* Start-mode modal */}
      {showModal && (
        <StartModal
          progress={savedProgress}
          onContinue={handleContinue}
          onRestart={handleRestart}
        />
      )}

      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        {/* Top progress */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-cq-ink flex items-center gap-2">
              {t('practice.title')}
              <span className="font-mono text-sm px-3 py-1 bg-cq-acc-soft text-cq-acc rounded-full">
                {currentIndex + 1} / {questions.length}
              </span>
            </h1>
            {exams.length > 0 && (
              <select
                value={categoryId}
                onChange={(e) => selectExam(e.target.value)}
                title={t('common.switchExam')}
                className="cq-select"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            )}
            {saveStatus && (
              <span className="text-xs text-cq-ok animate-fade-in">{t(saveStatus)}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              title={t('practice.backToModes')}
              className="p-2 bg-cq-panel hover:bg-cq-panel2 text-cq-sub hover:text-cq-ink rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-2 bg-cq-panel hover:bg-cq-panel2 disabled:opacity-50 text-cq-ink rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
              className="p-2 bg-cq-panel hover:bg-cq-panel2 disabled:opacity-50 text-cq-ink rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-cq-surface backdrop-blur-xl border border-cq-line rounded-2xl p-6 md:p-8 shadow-cq-card relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-mono text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">
            {currentQ.type}
          </div>

          <div className="text-lg text-cq-ink leading-relaxed mb-8 mt-4 whitespace-pre-wrap font-medium">
            {currentQ.content}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(opt)}
                disabled={isSubmitted}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 ${getOptionStyle(opt)}`}
              >
                <div className={`mt-0.5 min-w-[20px] h-[20px] rounded flex items-center justify-center transition-colors flex-shrink-0 ${getCheckboxStyle(opt)} ${isMulti ? 'rounded-md' : 'rounded-full'}`}>
                  {isSubmitted ? (
                    currentQ.answer.includes(opt.substring(0, 1))
                      ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                      : (answers[currentIndex] || []).includes(opt)
                        ? <XCircle className="w-3.5 h-3.5 text-white" />
                        : null
                  ) : (
                    pendingSelection.includes(opt) && <div className="w-2 h-2 bg-white rounded-sm" />
                  )}
                </div>
                <span className="leading-snug">{opt}</span>
              </button>
            ))}
          </div>

          {/* Submit area */}
          <div className="mt-8 pt-6 border-t border-cq-line">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={pendingSelection.length === 0}
                className="w-full py-3 rounded-xl font-semibold text-cq-on-accent transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-cq-coral to-cq-amber hover:brightness-110 shadow-cq-accent flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                {t('practice.submit')}
              </button>
            ) : (
              <div className="space-y-4">
                {/* Correct/incorrect feedback */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${correctResult ? 'bg-cq-ok-soft border-cq-ok' : 'bg-cq-bad-soft border-cq-bad'}`}>
                  {correctResult ? (
                    <>
                      <CheckCircle className="w-7 h-7 text-cq-ok flex-shrink-0" />
                      <div>
                        <p className="font-bold text-cq-ok">{t('practice.correct')}</p>
                        <p className="text-sm text-cq-sub">{tr('common.correctAnswerIs', { answer: <span className="text-cq-ok font-mono">{currentQ.answer}</span> })}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-7 h-7 text-cq-bad flex-shrink-0" />
                      <div>
                        <p className="font-bold text-cq-bad">{t('practice.wrong')}</p>
                        <p className="text-sm text-cq-sub">
                          {tr('practice.yourAnswerIs', { answer: <span className="text-cq-bad font-mono">{(answers[currentIndex] || []).map(a => a.substring(0, 1)).sort().join(', ')}</span> })}
                          {' '}
                          {tr('common.correctAnswerIs', { answer: <span className="text-cq-ok font-mono">{currentQ.answer}</span> })}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Explanation */}
                {hasRealAnalysis(currentQ.analysis) && (
                  <div className="p-5 bg-cq-surface border border-cq-line rounded-xl text-sm">
                    <h4 className="font-bold text-cq-acc mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {t('practice.detailedExplanation')}
                    </h4>
                    <div className="prose prose-sm prose-invert max-w-none
                      prose-p:text-cq-sub prose-p:leading-relaxed prose-p:my-1
                      prose-strong:text-cq-acc prose-strong:font-semibold
                      prose-code:text-cq-gold prose-code:bg-cq-panel prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                      prose-pre:bg-cq-panel prose-pre:border prose-pre:border-cq-line prose-pre:rounded-lg
                      prose-ul:text-cq-sub prose-ul:my-1 prose-li:my-0.5
                      prose-ol:text-cq-sub prose-ol:my-1
                      prose-h1:text-cq-ink prose-h2:text-cq-ink prose-h3:text-cq-ink
                      prose-blockquote:border-cq-acc prose-blockquote:text-cq-sub
                      prose-a:text-cq-acc prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {currentQ.analysis}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Redo */}
                  <button
                    onClick={handleRedo}
                    className="flex-1 py-3 rounded-xl font-semibold text-cq-sub transition-all duration-300 bg-cq-panel hover:bg-cq-panel2 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('practice.redo')}
                  </button>

                  {/* Next question */}
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={goNext}
                      className="flex-1 py-3 rounded-xl font-semibold text-cq-ink transition-all duration-300 bg-cq-panel hover:bg-cq-panel2 flex items-center justify-center gap-2"
                    >
                      {t('practice.next')}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-3 text-cq-ok font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {t('practice.allDone', { n: questions.length })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colored progress bar */}
        <div className="mt-8 flex gap-1 h-2">
          {questions.map((_, idx) => {
            const isDone = submitted[idx];
            const isRight = isDone && isAnswerCorrect(answers[idx] || [], questions[idx].answer);
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-colors cursor-pointer ${idx === currentIndex
                    ? 'bg-cq-acc'
                    : !isDone
                      ? 'bg-cq-panel hover:bg-cq-panel2'
                      : isRight
                        ? 'bg-cq-ok-soft hover:bg-cq-ok'
                        : 'bg-cq-bad-soft hover:bg-cq-bad'
                  }`}
                onClick={() => setCurrentIndex(idx)}
                title={t('common.questionN', { n: idx + 1 })}
              />
            );
          })}
        </div>

        {/* Bottom stats */}
        <div className="mt-4 flex justify-center gap-6 text-sm text-cq-faint">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cq-ok inline-block" />
            {t('practice.countCorrect', { n: Object.keys(submitted).filter(k => isAnswerCorrect(answers[k] || [], questions[k]?.answer)).length })}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cq-bad inline-block" />
            {t('practice.countWrong', { n: Object.keys(submitted).filter(k => !isAnswerCorrect(answers[k] || [], questions[k]?.answer)).length })}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cq-faint inline-block" />
            {t('practice.countUnanswered', { n: questions.length - Object.keys(submitted).length })}
          </span>
        </div>
      </div>
    </>
  );
};
