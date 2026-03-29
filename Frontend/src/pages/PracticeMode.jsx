import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';

export const PracticeMode = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track selected answers per question index
  const [answers, setAnswers] = useState({});
  const [showAnalysis, setShowAnalysis] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/Questions');
        // Pre-parse the OptionsJson
        const parsed = data.map(q => ({
          ...q,
          options: JSON.parse(q.optionsJson)
        }));
        setQuestions(parsed);
      } catch (err) {
        setError('加载题库失败，请检查网络或联系管理员导入题目。');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (optLine) => {
    if (!currentQ) return;
    const isMulti = currentQ.type.includes('Multiple');
    const existing = answers[currentIndex] || [];
    
    let newAnswers;
    if (isMulti) {
      if (existing.includes(optLine)) {
        newAnswers = existing.filter(a => a !== optLine);
      } else {
        newAnswers = [...existing, optLine];
      }
    } else {
      newAnswers = [optLine];
    }
    
    setAnswers({ ...answers, [currentIndex]: newAnswers });
  };

  const toggleAnalysis = () => {
    setShowAnalysis({ ...showAnalysis, [currentIndex]: !showAnalysis[currentIndex] });
  };

  const isCorrect = () => {
    if (!currentQ || !answers[currentIndex]) return null;
    const userA = answers[currentIndex].join(', ');
    return userA === currentQ.answer; // Simple exact match for this demo
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{error || '题库为空'}</h2>
        <p className="text-gray-400">目前系统里还没有题目，请联系管理员上传题库。</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          练习模式 <span className="text-sm px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full">{currentIndex + 1} / {questions.length}</span>
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
            className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Type badge */}
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">
          {currentQ.type}
        </div>

        <div className="text-lg text-gray-200 leading-relaxed mb-8 mt-4 whitespace-pre-wrap font-medium">
          {currentQ.content}
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = (answers[currentIndex] || []).includes(opt);
            const isShowingAns = showAnalysis[currentIndex];
            const isCorrectOption = isShowingAns && currentQ.answer.includes(opt.substring(0, 1)); // assuming options start with "A. "
            
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(opt)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 ${
                  isSelected 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' 
                    : isCorrectOption 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className={`mt-0.5 min-w-[20px] h-[20px] rounded border flex items-center justify-center transition-colors ${
                  isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                } ${currentQ.type.includes('Multiple') ? 'rounded-md' : 'rounded-full'}`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
          <button 
            onClick={toggleAnalysis}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
            {showAnalysis[currentIndex] ? '隐藏答案解析' : '查看答案与解析'}
          </button>
          
          {showAnalysis[currentIndex] && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">正确答案:</span>
              <span className="font-bold text-emerald-400">{currentQ.answer}</span>
            </div>
          )}
        </div>

        {showAnalysis[currentIndex] && (
          <div className="mt-6 p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-xl animate-fade-in text-gray-300 leading-relaxed text-sm">
            <h4 className="font-bold text-indigo-400 mb-2">详细解析：</h4>
            {currentQ.analysis}
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mt-8 flex gap-1 h-2">
         {questions.map((_, idx) => (
           <div 
             key={idx} 
             className={`flex-1 rounded-full ${
               idx === currentIndex 
                 ? 'bg-indigo-500' 
                 : answers[idx] ? 'bg-indigo-500/40' : 'bg-gray-800'
             } transition-colors cursor-pointer hover:bg-indigo-400`}
             onClick={() => setCurrentIndex(idx)}
           />
         ))}
      </div>
    </div>
  );
};
