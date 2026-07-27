import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, LogOut, CheckSquare, Crown, XCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-cq-bg/80 backdrop-blur-md border-b border-cq-line sticky top-0 z-50">
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
            {user ? (
              <>
                <Link to="/practice" className="text-cq-sub hover:text-cq-ink transition flex items-center gap-1 text-sm font-medium">
                  <CheckSquare className="h-4 w-4" /> 刷题
                </Link>
                <Link to="/exam" className="text-cq-sub hover:text-cq-ink transition flex items-center gap-1 text-sm font-medium">
                  <BookOpen className="h-4 w-4" /> 模考
                </Link>
                <Link to="/wrong-answers" className="text-red-400 hover:text-red-300 transition flex items-center gap-1 text-sm font-medium">
                  <XCircle className="h-4 w-4" /> 错题本
                </Link>
                {user.role === 'Admin' && (
                  <Link to="/admin" className="text-cq-amber hover:text-cq-gold transition flex items-center gap-1 text-sm font-medium">
                    <Crown className="h-4 w-4" /> 管理面板
                  </Link>
                )}
                <div className="h-6 w-px bg-cq-line mx-2"></div>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cq-panel hover:bg-cq-panel/70 border border-cq-line transition">
                  <User className="h-4 w-4 text-cq-sub" />
                  <span className="text-sm text-cq-ink">{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-cq-sub hover:text-red-400 transition" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-cq-sub hover:text-cq-ink text-sm font-medium transition">登录</Link>
                <Link to="/register" className="bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent px-4 py-2 rounded-lg text-sm font-semibold shadow-cq-accent transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110">免费注册</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
