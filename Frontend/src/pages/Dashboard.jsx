import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Target, TrendingUp, Clock, AlertCircle, BookOpen, ArrowRight, XCircle, PlayCircle, CheckCircle, Percent } from 'lucide-react';
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

  const totalTests = history.length;
  const highestScore = totalTests > 0 ? Math.max(...history.map(h => h.score)) : 0;
  // 只用记录了总题数的模考来算正确率（老数据 total 为 0，跳过）
  const accRecords = history.filter(h => h.total > 0);
  const acc = (h) => Math.round((h.score / h.total) * 100);
  const bestAccuracy = accRecords.length ? Math.max(...accRecords.map(acc)) : 0;
  const avgAccuracy = accRecords.length ? Math.round(accRecords.reduce((s, h) => s + acc(h), 0) / accRecords.length) : 0;
  const latestAccuracy = accRecords.length ? acc(accRecords[0]) : 0;
  const passCount = accRecords.filter(h => acc(h) >= 70).length;
  const ringDash = ((bestAccuracy / 100) * 364.4).toFixed(1);
  const currentExamName = examFilter
    ? (exams.find(e => String(e.id) === String(examFilter))?.name || '所选考试')
    : '全部考试';

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

      {/* 学习概览：正确率圆环 + 真实指标 */}
      <div className="bg-cq-surface border border-cq-line rounded-2xl p-6 md:p-7 shadow-cq-card">
        <div className="flex items-center justify-between mb-5">
          <span className="font-display font-bold text-cq-ink">学习概览 · Overview</span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cq-acc-soft text-cq-acc">{currentExamName}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 items-center">
          {/* 正确率圆环 */}
          <div className="relative w-[104px] h-[104px] flex-none mx-auto md:mx-0">
            <svg width="104" height="104" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r="58" fill="none" stroke="var(--cq-line2)" strokeWidth="13" />
              <circle cx="66" cy="66" r="58" fill="none" stroke="var(--cq-acc)" strokeWidth="13" strokeLinecap="round"
                strokeDasharray={`${ringDash} 400`} transform="rotate(-90 66 66)" style={{ transition: 'stroke-dasharray .6s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-2xl font-bold text-cq-ink">{bestAccuracy}%</div>
              <div className="text-[10.5px] text-cq-faint font-semibold">最高正确率</div>
            </div>
          </div>
          {/* 指标 chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { Icon: Percent, val: `${avgAccuracy}%`, label: '平均正确率 Avg', color: 'text-cq-acc' },
              { Icon: CheckCircle, val: passCount, label: '通过次数 ≥70%', color: 'text-cq-ok' },
              { Icon: TrendingUp, val: `${latestAccuracy}%`, label: '最近一次 Latest', color: 'text-cq-gold' },
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">得分</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">正确率</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cq-sub uppercase tracking-wider">评级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cq-line">
                  {history.map((record) => {
                    const a = record.total > 0 ? Math.round((record.score / record.total) * 100) : null;
                    const rating = a == null ? '—' : a >= 80 ? '优秀' : a >= 60 ? '良好' : '需努力';
                    return (
                      <tr key={record.id} className="hover:bg-cq-panel2 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-cq-sub">
                          {new Date(record.createdAt).toLocaleString()}
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
