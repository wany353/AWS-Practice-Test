import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trash2, RefreshCw, AlertCircle, Loader2, BookOpen, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WrongAnswers = () => {
  const [wrongList, setWrongList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [removing, setRemoving] = useState({});

  const fetchWrongAnswers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/WrongAnswers');
      const parsed = data.map(w => ({
        ...w,
        options: JSON.parse(w.optionsJson || '[]'),
        userAnswer: JSON.parse(w.userAnswerJson || '[]')
      }));
      setWrongList(parsed);
    } catch {
      setError('无法加载错题本，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWrongAnswers();
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRemove = async (questionId) => {
    setRemoving(prev => ({ ...prev, [questionId]: true }));
    try {
      await api.delete(`/WrongAnswers/${questionId}`);
      setWrongList(prev => prev.filter(w => w.questionId !== questionId));
    } catch {
      alert('移除失败，请重试');
    } finally {
      setRemoving(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="animate-spin w-12 h-12 text-cq-amber" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cq-ink tracking-tight">错题本</h1>
          <p className="text-cq-sub mt-1">
            共 <span className="text-red-400 font-semibold">{wrongList.length}</span> 道错题
          </p>
        </div>
        <button
          onClick={fetchWrongAnswers}
          className="flex items-center gap-2 px-4 py-2 bg-cq-panel hover:bg-cq-panel/70 text-cq-sub rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {wrongList.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">错题本是空的！</h2>
          <p className="text-cq-sub mb-6">你目前没有做错的题目，继续保持！</p>
          <Link
            to="/practice"
            className="px-6 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition font-semibold flex items-center gap-2 shadow-cq-accent hover:brightness-110"
          >
            <BookOpen className="w-4 h-4" />
            去练习
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wrongList.map((item, idx) => {
            const isExpanded = expanded[item.id];
            return (
              <div
                key={item.id}
                className="bg-cq-surface/90 backdrop-blur-xl border border-red-500/20 rounded-2xl overflow-hidden shadow-cq-card transition hover:border-red-500/40"
              >
                {/* 题目头部：可折叠 */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-start gap-4 p-5 text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                    <XCircle className="w-4 h-4 text-red-400" />
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

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-cq-line pt-4">
                    {/* 选项列表 */}
                    <div className="space-y-2">
                      {item.options.map((opt, oidx) => {
                        const isCorrect = item.answer.includes(opt.substring(0, 1));
                        const isUserSelected = item.userAnswer.includes(opt);
                        return (
                          <div
                            key={oidx}
                            className={`p-3 rounded-xl text-sm border flex items-center gap-3 ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                : isUserSelected
                                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                                  : 'bg-cq-panel/30 border-cq-line text-cq-faint'
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

                    {/* 答案对比 */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-cq-sub">我的答案：</span>
                        <span className="font-mono text-red-400">{item.userAnswer.map(a => a.substring(0, 1)).join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cq-sub">正确答案：</span>
                        <span className="font-mono text-emerald-400">{item.answer}</span>
                      </div>
                    </div>

                    {/* 解析 */}
                    {item.analysis && (
                      <div className="p-4 bg-cq-surface border border-cq-line rounded-xl text-cq-sub text-sm leading-relaxed">
                        <h4 className="font-bold text-cq-amber mb-1">解析：</h4>
                        {item.analysis}
                      </div>
                    )}

                    {/* 操作 */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleRemove(item.questionId)}
                        disabled={removing[item.questionId]}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition disabled:opacity-50"
                      >
                        {removing[item.questionId]
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                        从错题本移除
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
