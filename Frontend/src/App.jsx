import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { Dashboard } from './pages/Dashboard';
import { PracticeMode } from './pages/PracticeMode';
import { MockExam } from './pages/MockExam';
import { Admin } from './pages/Admin';
import { WrongAnswers } from './pages/WrongAnswers';

const Home = () => (
  <div className="text-center mt-32 animate-fade-in-up">
    <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6 drop-shadow-lg">
      AWS 云认证训练营
    </h1>
    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
      这是我们为您量身定制的 AWS 架构师备考指南。具备全网最新的真题、深度解析，以及完美的模拟考场体验。
    </p>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Area (Requires Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<PracticeMode />} />
            <Route path="/exam" element={<MockExam />} />
            <Route path="/wrong-answers" element={<WrongAnswers />} />
          </Route>

          {/* Admin Area */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
