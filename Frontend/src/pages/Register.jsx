import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/Auth/register', { username: formData.username, password: formData.password });
      alert('注册成功，请重新登录！');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data || '注册失败，用户名可能已存在');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="relative w-full max-w-md">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cq-coral rounded-full mix-blend-screen filter blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cq-acc rounded-full mix-blend-screen filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cq-gold rounded-full mix-blend-screen filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative bg-cq-surface backdrop-blur-xl border border-cq-line rounded-2xl p-8 shadow-cq-card">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-cq-ink tracking-tight">创建账号</h1>
            <p className="text-sm text-cq-sub mt-2">开启您的 AWS 备考之旅</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-cq-bad-soft border border-cq-bad rounded-lg text-cq-bad text-sm flex gap-2 items-center">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cq-sub mb-2">用户名</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-cq-faint" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cq-panel border border-cq-line rounded-xl text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition-all duration-300"
                  placeholder="选择一个好记的用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cq-sub mb-2">密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cq-faint" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cq-panel border border-cq-line rounded-xl text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition-all duration-300"
                  placeholder="至少6位密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cq-sub mb-2">确认密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cq-faint" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cq-panel border border-cq-line rounded-xl text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition-all duration-300"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-cq-on-accent bg-gradient-to-br from-cq-coral to-cq-amber focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cq-acc focus:ring-offset-cq-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-cq-accent hover:brightness-110"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                '立即注册'
              )}
            </button>

            <p className="text-center text-sm text-cq-sub">
              已经有账号了？{' '}
              <Link to="/login" className="font-medium text-cq-acc hover:text-cq-gold transition-colors">
                直接登录
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
