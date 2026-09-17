import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('register.mismatch');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/Auth/register', { username: formData.username, password: formData.password });
      alert(t('register.success'));
      navigate('/login');
    } catch (err) {
      // Error holds a translation key so it follows the language toggle.
      setError(err.response?.status === 400 ? 'register.exists' : 'register.failed');
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
            <h1 className="font-display text-3xl font-bold text-cq-ink tracking-tight">{t('register.title')}</h1>
            <p className="text-sm text-cq-sub mt-2">{t('register.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-cq-bad-soft border border-cq-bad rounded-lg text-cq-bad text-sm flex gap-2 items-center">
              <span className="block sm:inline">{t(error)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cq-sub mb-2">{t('common.username')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-cq-faint" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cq-panel border border-cq-line rounded-xl text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition-all duration-300"
                  placeholder={t('register.usernamePlaceholder')}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cq-sub mb-2">{t('common.password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cq-faint" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cq-panel border border-cq-line rounded-xl text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition-all duration-300"
                  placeholder={t('register.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cq-sub mb-2">{t('register.confirmPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cq-faint" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cq-panel border border-cq-line rounded-xl text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition-all duration-300"
                  placeholder={t('register.confirmPlaceholder')}
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
                t('register.submit')
              )}
            </button>

            <p className="text-center text-sm text-cq-sub">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="font-medium text-cq-acc hover:text-cq-gold transition-colors">
                {t('register.loginLink')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
