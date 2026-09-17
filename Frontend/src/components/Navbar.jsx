import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { BookOpen, User, LogOut, CheckSquare, Crown, XCircle, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLang } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-cq-nav backdrop-blur-md border-b border-cq-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cq-coral to-cq-amber flex items-center justify-center shadow-cq-accent">
                <BookOpen className="h-5 w-5 text-cq-on-accent" />
              </span>
              <span className="font-display font-bold text-xl tracking-tight text-cq-ink hidden sm:block">CloudQuest</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLang}
              title={t('nav.toggleLang')}
              aria-label={t('nav.toggleLang')}
              className="h-9 min-w-9 px-2 rounded-lg border border-cq-line bg-cq-panel text-cq-sub hover:text-cq-ink text-sm font-semibold flex items-center justify-center transition"
            >
              {t('nav.langButton')}
            </button>
            <button
              onClick={toggleTheme}
              title={t('nav.toggleTheme')}
              aria-label={t('nav.toggleTheme')}
              className="w-9 h-9 rounded-lg border border-cq-line bg-cq-panel text-cq-sub hover:text-cq-ink flex items-center justify-center transition"
            >
              {theme === 'dark' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            </button>
            {user ? (
              <>
                <Link to="/practice" className="text-cq-sub hover:text-cq-ink transition flex items-center gap-1 text-sm font-medium">
                  <CheckSquare className="h-4 w-4" /> {t('nav.practice')}
                </Link>
                <Link to="/exam" className="text-cq-sub hover:text-cq-ink transition flex items-center gap-1 text-sm font-medium">
                  <BookOpen className="h-4 w-4" /> {t('nav.exam')}
                </Link>
                <Link to="/wrong-answers" className="text-cq-bad hover:text-cq-bad transition flex items-center gap-1 text-sm font-medium">
                  <XCircle className="h-4 w-4" /> {t('nav.wrongBook')}
                </Link>
                {user.role === 'Admin' && (
                  <Link to="/admin" className="text-cq-acc hover:text-cq-gold transition flex items-center gap-1 text-sm font-medium">
                    <Crown className="h-4 w-4" /> {t('nav.admin')}
                  </Link>
                )}
                <div className="h-6 w-px bg-cq-line mx-2"></div>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cq-panel hover:bg-cq-panel2 border border-cq-line transition">
                  <User className="h-4 w-4 text-cq-sub" />
                  <span className="text-sm text-cq-ink">{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-cq-sub hover:text-cq-bad transition" title={t('nav.logout')}>
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-cq-sub hover:text-cq-ink text-sm font-medium transition">{t('nav.login')}</Link>
                <Link to="/register" className="bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent px-4 py-2 rounded-lg text-sm font-semibold shadow-cq-accent transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110">{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
