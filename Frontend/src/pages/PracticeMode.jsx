import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  AlertCircle, BookOpen, ArrowRight, Loader2, PlayCircle,
  RefreshCw, RotateCcw
} from 'lucide-react';

// 防抖 Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// 答案比较（忽略顺序）
function isAnswerCorrect(userAnswerArr, correctAnswer) {
  if (!correctAnswer) return false;
  const userLetters = userAnswerArr.map(opt => opt.substring(0, 1)).sort().join('');
  const correctLetters = correctAnswer.replace(/[^A-Z]/g, '').split('').sort().join('');
  return userLetters === correctLetters;
}


// ====== 开始选择弹窗 ======
const StartModal = ({ progress, onContinue, onRestart }) => {
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
            <h2 className="font-display text-xl font-bold text-cq-ink">欢迎回来</h2>
            <p className="text-cq-sub text-sm">请选择练习方式</p>
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
                <p className="font-semibold text-cq-ok">继续上次练习</p>
                <p className="text-sm text-cq-sub mt-0.5">
                  从第 <span className="text-cq-ok font-bold">{progress.currentIndex + 1}</span> 题继续
                  &nbsp;·&nbsp;已完成 <span className="text-cq-ok font-bold">{answeredCount}</span> 题
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-cq-faint group-hover:text-cq-ok ml-auto transition" />
            </button>
          ) : (
            <div className="w-full flex items-center gap-4 p-4 rounded-xl border border-cq-line bg-cq-panel text-left opacity-60 cursor-not-allowed">
              <PlayCircle className="w-8 h-8 text-cq-faint flex-shrink-0" />
              <div>
                <p className="font-semibold text-cq-sub">继续上次练习</p>
                <p className="text-sm text-cq-faint mt-0.5">暂无练习记录</p>
              </div>
            </div>
          )}

          <button
            onClick={onRestart}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-cq-acc bg-cq-acc-soft hover:bg-cq-acc-soft text-left transition group"
          >
            <RefreshCw className="w-8 h-8 text-cq-acc flex-shrink-0" />
            <div>
              <p className="font-semibold text-cq-acc">重新开始</p>
              <p className="text-sm text-cq-sub mt-0.5">从第 1 题重新刷题，清空所有进度</p>
            </div>
            <ArrowRight className="w-5 h-5 text-cq-faint group-hover:text-cq-acc ml-auto transition" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== 主组件 ======
export const PracticeMode = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 考试（题库分类）
  const [exams, setExams] = useState([]);
  const [categoryId, setCategoryId] = useState('');

  // 已提交的答案 { [questionIndex]: string[] }
  const [answers, setAnswers] = useState({});
  // 当前题目正在选择（未提交）的选项
  const [pendingSelection, setPendingSelection] = useState([]);
  // 已提交题目集合 { [questionIndex]: true }
  const [submitted, setSubmitted] = useState({});
  // 自动保存状态
  const [saveStatus, setSaveStatus] = useState('');

  // 弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  // 防止组件重挂载时空值覆盖服务器进度
  const readyToSave = useRef(false);

  // 防抖
  const debouncedIndex = useDebounce(currentIndex, 1500);
  const debouncedAnswers = useDebounce(answers, 1500);

  // 加载考试列表，默认选中上次的考试（cq-exam），否则第一个
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

  // 切换考试：记住选择
  const selectExam = (id) => {
    setCategoryId(id);
    try { localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  // 按所选考试加载题目 + 该考试自己的进度，并弹出“继续/重新开始”选择
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    readyToSave.current = false; // 加载期间暂停自动保存
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
        // 加载/切换考试后，先清空本地作答状态（等用户在弹窗里选择继续或重来）
        setCurrentIndex(0);
        setAnswers({});
        setSubmitted({});
        setPendingSelection([]);
        setSavedProgress(progressRes?.data || null);
        setShowModal(true);
      } catch (err) {
        if (!cancelled) setError('加载题库失败，请检查网络或联系管理员导入题目。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [categoryId]);

  // 自动保存进度（仅在用户做出选择后才激活，按考试分别保存）
  useEffect(() => {
    if (questions.length === 0 || !readyToSave.current || !categoryId) return;
    const save = async () => {
      try {
        await api.post('/PracticeProgress', {
          categoryId: Number(categoryId),
          currentIndex: debouncedIndex,
          answersJson: JSON.stringify(debouncedAnswers)
        });
        setSaveStatus('已自动保存');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch { /* 静默失败 */ }
    };
    save();
  }, [debouncedIndex, debouncedAnswers]);

  // 切换题目时重置 pending 选择
  useEffect(() => {
    setPendingSelection([]);
  }, [currentIndex]);

  // ===== 弹窗回调 =====
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
    // 等待防抖值更新完毕后再允许自动保存（防抖1.5s + 缓冲0.5s）
    setTimeout(() => { readyToSave.current = true; }, 2000);
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted({});
    setPendingSelection([]);
    setShowModal(false);
    // 重新开始直接允许保存（空值是正确的）
    readyToSave.current = true;
    // 清空该考试的服务器端进度
    try {
      await api.post('/PracticeProgress', { categoryId: Number(categoryId), currentIndex: 0, answersJson: '{}' });
    } catch { /* 静默失败 */ }
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
      } catch { /* 静默失败 */ }
    }
  };

  // 重做当前题目
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

  // ===== 渲染 =====
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
        <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">{error || '题库为空'}</h2>
        <p className="text-cq-sub">目前系统里还没有题目，请联系管理员上传题库。</p>
      </div>
    );
  }

  const correctResult = isSubmitted
    ? isAnswerCorrect(answers[currentIndex] || [], currentQ.answer)
    : null;

  return (
    <>
      {/* 开始选择弹窗 */}
      {showModal && (
        <StartModal
          progress={savedProgress}
          onContinue={handleContinue}
          onRestart={handleRestart}
        />
      )}

      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        {/* 顶部进度 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-cq-ink flex items-center gap-2">
              练习模式
              <span className="font-mono text-sm px-3 py-1 bg-cq-acc-soft text-cq-acc rounded-full">
                {currentIndex + 1} / {questions.length}
              </span>
            </h1>
            {exams.length > 0 && (
              <select
                value={categoryId}
                onChange={(e) => selectExam(e.target.value)}
                title="切换考试"
                className="px-3 py-1.5 rounded-lg bg-cq-panel border border-cq-line text-cq-ink text-sm focus:outline-none focus:ring-2 focus:ring-cq-acc transition"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            )}
            {saveStatus && (
              <span className="text-xs text-cq-ok animate-fade-in">{saveStatus}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              title="返回选择界面"
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

        {/* 题目卡片 */}
        <div className="bg-cq-surface backdrop-blur-xl border border-cq-line rounded-2xl p-6 md:p-8 shadow-cq-card relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-mono text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">
            {currentQ.type}
          </div>

          <div className="text-lg text-cq-ink leading-relaxed mb-8 mt-4 whitespace-pre-wrap font-medium">
            {currentQ.content}
          </div>

          {/* 选项列表 */}
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

          {/* 提交区域 */}
          <div className="mt-8 pt-6 border-t border-cq-line">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={pendingSelection.length === 0}
                className="w-full py-3 rounded-xl font-semibold text-cq-on-accent transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-cq-coral to-cq-amber hover:brightness-110 shadow-cq-accent flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                提交答案
              </button>
            ) : (
              <div className="space-y-4">
                {/* 对错反馈卡 */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${correctResult ? 'bg-cq-ok-soft border-cq-ok' : 'bg-cq-bad-soft border-cq-bad'}`}>
                  {correctResult ? (
                    <>
                      <CheckCircle className="w-7 h-7 text-cq-ok flex-shrink-0" />
                      <div>
                        <p className="font-bold text-cq-ok">回答正确！</p>
                        <p className="text-sm text-cq-sub">正确答案：<span className="text-cq-ok font-mono">{currentQ.answer}</span></p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-7 h-7 text-cq-bad flex-shrink-0" />
                      <div>
                        <p className="font-bold text-cq-bad">回答错误，已记入错题本</p>
                        <p className="text-sm text-cq-sub">
                          你的答案：<span className="text-cq-bad font-mono">{(answers[currentIndex] || []).map(a => a.substring(0, 1)).sort().join(', ')}</span>
                          正确答案：<span className="text-cq-ok font-mono">{currentQ.answer}</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* 解析 */}
                {currentQ.analysis && (
                  <div className="p-5 bg-cq-surface border border-cq-line rounded-xl text-sm">
                    <h4 className="font-bold text-cq-acc mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      详细解析
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

                {/* 操作按钮行 */}
                <div className="flex gap-3">
                  {/* 重做此题 */}
                  <button
                    onClick={handleRedo}
                    className="flex-1 py-3 rounded-xl font-semibold text-cq-sub transition-all duration-300 bg-cq-panel hover:bg-cq-panel2 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重做此题
                  </button>

                  {/* 下一题 */}
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={goNext}
                      className="flex-1 py-3 rounded-xl font-semibold text-cq-ink transition-all duration-300 bg-cq-panel hover:bg-cq-panel2 flex items-center justify-center gap-2"
                    >
                      下一题
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-3 text-cq-ok font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      已完成全部 {questions.length} 题！
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部颜色进度条 */}
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
                title={`第 ${idx + 1} 题`}
              />
            );
          })}
        </div>

        {/* 底部统计 */}
        <div className="mt-4 flex justify-center gap-6 text-sm text-cq-faint">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cq-ok inline-block" />
            答对 {Object.keys(submitted).filter(k => isAnswerCorrect(answers[k] || [], questions[k]?.answer)).length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cq-bad inline-block" />
            答错 {Object.keys(submitted).filter(k => !isAnswerCorrect(answers[k] || [], questions[k]?.answer)).length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cq-faint inline-block" />
            未答 {questions.length - Object.keys(submitted).length}
          </span>
        </div>
      </div>
    </>
  );
};
