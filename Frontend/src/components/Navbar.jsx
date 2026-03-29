import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, LogOut, CheckSquare, Crown } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
              <BookOpen className="h-7 w-7" />
              <span className="font-bold text-xl tracking-wide hidden sm:block">CloudQuest</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/practice" className="text-gray-300 hover:text-white transition flex items-center gap-1 text-sm font-medium">
                  <CheckSquare className="h-4 w-4" /> 刷题
                </Link>
                <Link to="/exam" className="text-gray-300 hover:text-white transition flex items-center gap-1 text-sm font-medium">
                  <BookOpen className="h-4 w-4" /> 模考
                </Link>
                {user.role === 'Admin' && (
                  <Link to="/admin" className="text-pink-400 hover:text-pink-300 transition flex items-center gap-1 text-sm font-medium">
                    <Crown className="h-4 w-4" /> 管理面板
                  </Link>
                )}
                <div className="h-6 w-px bg-gray-700 mx-2"></div>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-200">{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition">登录</Link>
                <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:-translate-y-0.5">免费注册</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
