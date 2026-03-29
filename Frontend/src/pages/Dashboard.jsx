import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Target, TrendingUp, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/Questions/test-history');
        setHistory(data);
      } catch (err) {
        setError('无法获取测试记录');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const highestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0;
  const totalTests = history.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">你好, {user?.username}</h1>
          <p className="text-gray-400">准备好继续你的 AWS 云认证学习之旅了吗？</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link to="/practice" className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition duration-300 font-medium flex items-center gap-2 border border-gray-700">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            开始刷题
          </Link>
          <Link to="/exam" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition duration-300 font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20">
            <Target className="w-4 h-4" />
            全真模拟
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg flex items-center gap-4 hover:border-indigo-500/50 transition duration-300">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">参加模考次数</p>
            <p className="text-2xl font-bold text-white">{totalTests}</p>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg flex items-center gap-4 hover:border-emerald-500/50 transition duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Target className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">历史最高得分</p>
            <p className="text-2xl font-bold text-white">{highestScore}</p>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">账号状态</p>
            <p className="text-lg font-bold text-white">{user?.role === 'Admin' ? '管理员' : '正式学员'}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">答题历史记录</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-400">加载记录中...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">暂无模考记录</h4>
              <p className="text-gray-500 mb-6">您还没有完成过任何模拟考试。现在就去验证一下所学知识吧！</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">模考时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">答对题数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">评级</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-indigo-500/10 text-indigo-400">
                          {record.score} 分
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
