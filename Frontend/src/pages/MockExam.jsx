import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Clock, AlertTriangle, UserCheck, XOctagon, Trophy, Target, BarChart3, BookOpen } from 'lucide-react';

export const MockExam = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour test
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/Questions');
        // Shuffle and take max 65 questions (standard AWS test) if available
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 65).map(q => ({
          ...q,
          options: JSON.parse(q.optionsJson)
        }));
        setQuestions(selected);
      } catch (err) {
        setError('无法加载考题。');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (loading || submitted || error) return;
    
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
  }, [loading, submitted, answers]);

  const handleOptionSelect = (qIndex, opt) => {
    if (submitted) return;
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
      Answers: Object.keys(answers).map(questionId => ({
        QuestionId: parseInt(questionId),
        UserAnswer: answers[questionId].join(', ')
      }))
    };

    try {
      const { data } = await api.post('/Questions/submit-test', submissionData);
      setScoreResult(data);
    } catch (err) {
      alert("交卷失败：" + (err.response?.data || '请检查网络'));
      setSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cq-amber mx-auto mt-20"></div>;
  if (error || questions.length === 0) return <div className="text-center mt-20 text-red-400">{error || '暂无题目'}</div>;

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Sticky Top Bar for Timer & Submit button */}
      <div className="sticky top-20 z-40 bg-cq-surface/90 backdrop-blur-md border border-cq-line rounded-2xl p-4 flex justify-between items-center mb-8 shadow-cq-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cq-amber/12 rounded-lg">
            <Clock className="w-6 h-6 text-cq-amber" />
          </div>
          <div>
            <p className="text-xs text-cq-sub font-medium tracking-wide">剩余时间</p>
            <p className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-cq-ink'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-cq-sub hidden sm:block">
            已答: {Object.keys(answers).length} / {questions.length}
          </span>
          {!submitted && (
            <button
              onClick={() => {
                if(window.confirm('确定要提交试卷吗？未答完的题目将记为0分。')) handleSubmit();
              }}
              className="px-6 py-2 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-semibold rounded-xl transition duration-300 shadow-cq-accent hover:brightness-110"
            >
              提交考卷
            </button>
          )}
        </div>
      </div>

      {scoreResult && (() => {
        const score = scoreResult.score;
        const total = scoreResult.totalQuestions;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const passed = percentage >= 70;

        return (
          <div className={`mb-8 border rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden ${
            passed
              ? 'bg-gradient-to-br from-emerald-900/40 via-cq-surface/70 to-cyan-900/30 border-emerald-500/30'
              : 'bg-gradient-to-br from-red-900/40 via-cq-surface/70 to-orange-900/30 border-red-500/30'
          }`}>
            {/* 顶部结果 */}
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
                passed ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                {passed
                  ? <Trophy className="w-10 h-10 text-emerald-400" />
                  : <XOctagon className="w-10 h-10 text-red-400" />
                }
              </div>

              <h2 className="font-display text-2xl font-bold text-cq-ink mb-1">考试完成</h2>
              <p className={`text-lg font-semibold mb-6 ${
                passed ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {passed ? '🎉 恭喜通过！' : '未能通过，继续加油！'}
              </p>

              {/* 分数展示 */}
              <div className={`inline-block text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${
                passed
                  ? 'from-emerald-400 to-cyan-400'
                  : 'from-red-400 to-orange-400'
              }`}>
                {percentage}%
              </div>
              <p className="text-cq-sub text-sm mt-2">正确率</p>
            </div>

            {/* 统计栏 */}
            <div className="border-t border-cq-line bg-cq-surface/60 px-8 py-5 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-cq-sub text-xs mb-1">
                  <Target className="w-3.5 h-3.5" /> 总题数
                </div>
                <p className="font-mono text-xl font-bold text-cq-ink">{total}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs mb-1">
                  <UserCheck className="w-3.5 h-3.5" /> 答对
                </div>
                <p className="text-xl font-bold text-emerald-400">{score}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs mb-1">
                  <BarChart3 className="w-3.5 h-3.5" /> 答错
                </div>
                <p className="text-xl font-bold text-red-400">{total - score}</p>
              </div>
            </div>

            {/* 通过标准提示 + 按钮 */}
            <div className="border-t border-cq-line px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-cq-faint">
                通过标准：正确率 ≥ 70%
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  passed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/practice')} className="px-5 py-2.5 bg-cq-panel hover:bg-cq-panel/70 text-cq-ink rounded-xl transition text-sm">去练习复习</button>
                <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition shadow-cq-accent hover:brightness-110 text-sm">返回面板</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Questions list */}
      <div className="space-y-12">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-cq-surface/90 border border-cq-line rounded-2xl p-6 md:p-8 shadow-cq-card scroll-mt-32" id={`question-${idx}`}>
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
                        ? 'bg-cq-amber/15 border-cq-amber text-cq-ink'
                        : 'bg-cq-panel/60 border-cq-line text-cq-sub hover:bg-cq-panel hover:border-cq-faint'
                    } ${submitted ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div className={`mt-0.5 min-w-[20px] h-[20px] rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-cq-amber bg-cq-amber' : 'border-cq-faint'
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
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                  <span className="text-emerald-400 font-bold mb-2 block">正确答案: {q.answer}</span>
                  {q.analysis && (
                    <div className="mt-2 prose prose-sm prose-invert max-w-none
                      prose-p:text-cq-sub prose-p:leading-relaxed prose-p:my-1
                      prose-strong:text-cq-amber
                      prose-code:text-amber-300 prose-code:bg-cq-panel prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                      prose-ul:text-cq-sub prose-li:my-0.5
                      prose-h2:text-cq-ink prose-h2:text-base prose-h3:text-cq-sub prose-h3:text-sm
                      prose-blockquote:border-cq-amber prose-blockquote:text-cq-faint">
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
    </div>
  );
};
