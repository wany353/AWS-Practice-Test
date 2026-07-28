import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Target, TrendingUp, Clock, AlertCircle, BookOpen, ArrowRight, XCircle, PlayCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState(''); // '' = 全部考试

  // 考试列表（筛选下拉）
  useEffect(() => {
    api.get('/Categories').then(({ data }) => setExams(data)).catch(() => {});
  }, []);

  // 按考试筛选加载统计
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      const params = examFilter ? { categoryId: examFilter } : {};
      try {
        const [historyRes, progressRes, wrongRes] = await Promise.allSettled([
          api.get('/Questions/test-history', { params }),
          examFilter ? api.get('/PracticeProgress', { params }) : Promise.resolve(null),
          api.get('/WrongAnswers/count', { params })
        ]);
        if (cancelled) return;

        if (historyRes.status === 'fulfilled') { setHistory(historyRes.value.data); setError(''); }
        else setError('无法获取测试记录');

        // 「继续练习」只在选中某个具体考试时展示该考试的进度
        if (examFilter && progressRes.status === 'fulfilled' && progressRes.value) {
          const p = progressRes.value.data;
          const hasProgress = p.currentIndex > 0 ||
            (p.answersJson && p.answersJson !== '{}' && p.answersJson !== 'null');
          setProgress(hasProgress ? p : null);
        } else {
          setProgress(null);
        }

        if (wrongRes.status === 'fulfilled') setWrongCount(wrongRes.value.data.count || 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [examFilter]);

  const changeFilter = (id) => {
    setExamFilter(id);
    try { if (id) localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  const highestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0;
  const totalTests = history.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* 主横幅 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 bg-cq-surface backdrop-blur-md rounded-2xl p-8 border border-cq-line shadow-cq-card">
        <div>
          <h1 className="font-display text-3xl font-bold text-cq-ink mb-2 tracking-tight">你好, {user?.username}</h1>
          <p className="text-cq-sub">准备好继续你的 AWS 云认证学习之旅了吗？</p>
          {exams.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-cq-faint font-semibold">按考试查看</span>
              <select
                value={examFilter}
                onChange={(e) => changeFilter(e.target.value)}
                className="cq-select"
              >
                <option value="">全部考试</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 flex-wrap">
          {progress ? (
            <Link
              to="/practice"
              className="px-6 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition duration-300 font-semibold flex items-center gap-2 shadow-cq-accent hover:brightness-110"
            >
              <PlayCircle className="w-4 h-4" />
              继续练习（第 {progress.currentIndex + 1} 题）
            </Link>
          ) : (
            <Link to="/practice" className="px-6 py-2.5 bg-cq-panel hover:bg-cq-panel2 text-cq-ink rounded-xl transition duration-300 font-medium flex items-center gap-2 border border-cq-line">
              <BookOpen className="w-4 h-4 text-cq-acc" />
              开始刷题
            </Link>
          )}
          <Link to="/exam" className="px-6 py-2.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent rounded-xl transition duration-300 font-semibold flex items-center gap-2 shadow-cq-accent hover:brightness-110">
            <Target className="w-4 h-4" />
            全真模拟
          </Link>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4 hover:border-cq-acc transition duration-300">
          <div className="w-14 h-14 rounded-full bg-cq-acc-soft flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-cq-acc" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">参加模考次数</p>
            <p className="font-mono text-2xl font-bold text-cq-ink">{totalTests}</p>
          </div>
        </div>
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4 hover:border-cq-ok transition duration-300">
          <div className="w-14 h-14 rounded-full bg-cq-ok-soft flex items-center justify-center">
            <Target className="w-7 h-7 text-cq-ok" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">历史最高得分</p>
            <p className="font-mono text-2xl font-bold text-cq-ink">{highestScore}</p>
          </div>
        </div>
        {/* 错题本快捷入口 */}
        <Link
          to="/wrong-answers"
          className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4 hover:border-cq-bad transition duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-cq-bad-soft flex items-center justify-center">
            <XCircle className="w-7 h-7 text-cq-bad" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">错题本</p>
            <p className="font-mono text-2xl font-bold text-cq-ink">{wrongCount} 道</p>
          </div>
        </Link>
        <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 shadow-cq-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cq-gold-soft flex items-center justify-center">
            <Clock className="w-7 h-7 text-cq-gold" />
          </div>
          <div>
            <p className="text-sm text-cq-sub font-medium">账号状态</p>
            <p className="text-lg font-bold text-cq-ink">{user?.role === 'Admin' ? '管理员' : '正式学员'}</p>
          </div>
        </div>
      </div>

      {/* 练习进度横幅（有进度时显示） */}
      {progress && (
        <div className="bg-cq-ok-soft border border-cq-ok rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-cq-ok flex-shrink-0" />
            <div>
              <p className="text-cq-ok font-semibold">你有未完成的练习</p>
              <p className="text-cq-sub text-sm">上次停在第 {progress.currentIndex + 1} 题，点击继续上次的进度。</p>
            </div>
          </div>
          <Link
            to="/practice"
            className="flex items-center gap-2 px-4 py-2 bg-cq-ok hover:bg-cq-ok text-white rounded-xl transition font-medium text-sm"
          >
            继续
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 模考历史记录 */}
      <div className="bg-cq-surface border border-cq-line rounded-2xl shadow-cq-card overflow-hidden">
        <div className="px-6 py-5 border-b border-cq-line">
          <h3 className="font-display text-lg font-semibold text-cq-ink">答题历史记录</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cq-acc mb-4"></div>
              <p className="text-cq-sub">加载记录中...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-cq-bad bg-cq-bad-soft p-4 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cq-panel rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-cq-faint" />
              </div>
              <h4 className="text-lg font-medium text-cq-ink mb-2">暂无模考记录</h4>
              <p className="text-cq-faint mb-6">您还没有完成过任何模拟考试。现在就去验证一下所学知识吧！</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cq-line">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">模考时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">答对题数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">评级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cq-line">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-cq-panel2 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cq-sub">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-cq-acc-soft text-cq-acc font-mono">
                          {record.score} 分
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cq-sub">
                        {record.score > 40 ? '优秀' : record.score > 20 ? '良好' : '需努力'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
