import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock, AlertTriangle, UserCheck } from 'lucide-react';

export const MockExam = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour test
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/Questions');
        // Shuffle and take max 65 questions (standard AWS test) if available
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 65).map(q => ({
          ...q,
          options: JSON.parse(q.optionsJson)
        }));
        setQuestions(selected);
      } catch (err) {
        setError('无法加载考题。');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (loading || submitted || error) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted, answers]);

  const handleOptionSelect = (qIndex, opt) => {
    if (submitted) return;
    const q = questions[qIndex];
    const isMulti = q.type.includes('Multiple');
    const existing = answers[q.id] || [];
    
    let userAns;
    if (isMulti) {
      if (existing.includes(opt)) {
        userAns = existing.filter(a => a !== opt);
      } else {
        userAns = [...existing, opt];
      }
    } else {
      userAns = [opt];
    }
    setAnswers({ ...answers, [q.id]: userAns });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    
    // Formatting answers for API
    const submissionData = {
      Answers: Object.keys(answers).map(questionId => ({
        QuestionId: parseInt(questionId),
        UserAnswer: answers[questionId].join(', ')
      }))
    };

    try {
      const { data } = await api.post('/Questions/submit-test', submissionData);
      setScoreResult(data);
    } catch (err) {
      alert("交卷失败：" + (err.response?.data || '请检查网络'));
      setSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mt-20"></div>;
  if (error || questions.length === 0) return <div className="text-center mt-20 text-red-400">{error || '暂无题目'}</div>;

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Sticky Top Bar for Timer & Submit button */}
      <div className="sticky top-20 z-40 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-4 flex justify-between items-center mb-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-wide">剩余时间</p>
            <p className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">
            已答: {Object.keys(answers).length} / {questions.length}
          </span>
          {!submitted && (
            <button 
              onClick={() => {
                if(window.confirm('确定要提交试卷吗？未答完的题目将记为0分。')) handleSubmit();
              }}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition duration-300 shadow-lg shadow-emerald-600/20"
            >
              提交考卷
            </button>
          )}
        </div>
      </div>

      {scoreResult && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 rounded-2xl shadow-2xl animate-fade-in-up text-center">
          <UserCheck className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">考试完成！</h2>
          <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mt-4 mb-6">
            得分: {scoreResult.score} / {scoreResult.totalQuestions}
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/practice')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition">去练习模式复习</button>
            <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-500/30">返回面板</button>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-12">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-lg scroll-mt-32" id={`question-${idx}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-gray-400 border border-gray-700">
                {idx + 1}
              </div>
              <p className="text-lg text-gray-200 mt-1 leading-relaxed font-medium">
                {q.content}
              </p>
            </div>
            
            <div className="space-y-3 pl-12">
              {q.options.map((opt, oIdx) => {
                const isSelected = (answers[q.id] || []).includes(opt);
                return (
                  <button
                    key={oIdx}
                    disabled={submitted}
                    onClick={() => handleOptionSelect(idx, opt)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-500'
                    } ${submitted ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div className={`mt-0.5 min-w-[20px] h-[20px] rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                    } ${q.type.includes('Multiple') ? 'rounded-md' : 'rounded-full'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Show answer after submit */}
            {submitted && (
              <div className="mt-6 pl-12">
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                  <span className="text-emerald-400 font-bold mb-1 block">正确答案: {q.answer}</span>
                  <span className="text-gray-400 text-sm mt-2 block">{q.analysis}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
