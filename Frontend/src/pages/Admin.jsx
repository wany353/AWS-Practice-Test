import { useState } from 'react';
import api from '../utils/api';
import { UploadCloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const Admin = () => {
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // PostgreSQL 不允许存入 \u0000 (Null) 字符。
        // Python 解析 PDF 时，英文的 'fi'/'ffi' 连体字母常常被错误解析为 \u0000（比如 files 变成 \u0000les，Config 变成 Con\u0000g）。
        // 我们在全局将其替换为 'fi' 以修复乱码并解决数据库报错
        let rawText = event.target.result;
        rawText = rawText.replace(/\u0000/g, 'fi');

        const json = JSON.parse(rawText);
        setFileContent(json);
      } catch (err) {
        setStatus({ type: 'error', message: '不是合法的 JSON 文件' });
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!fileContent) return;
    setLoading(true);
    setStatus(null);

    try {
      // 转换前端的原始 JSON 数据以匹配后端的 QuestionImportDto 以及 PracticeMode.jsx 期待的格式
      const payload = fileContent.map((item) => {
        // 判断题目类型
        let type = 'Single';
        const cleanAnswer = item.answer ? item.answer.replace(/[^A-Z]/g, '') : '';
        if (cleanAnswer.length > 1) {
          type = 'Multiple';
        }
        
        // 转换选项格式，变为类似 ["A. ...", "B. ..."] 的字符串数组然后序列化
        let optionsList = [];
        if (item.options) {
           for (const [key, value] of Object.entries(item.options)) {
               optionsList.push(`${key}. ${value}`);
           }
        }

        return {
          content: item.question || '无题目内容',
          answer: cleanAnswer,
          type: type,
          optionsJson: JSON.stringify(optionsList),
          analysis: `【相关主题】: ${item.topic || 'N/A'}\n该题目暂未提供详细的思路解析。`
        };
      });

      const { data } = await api.post('/Questions/import', payload);
      setStatus({ type: 'success', message: data.message || `上传成功！已成功导入 ${payload.length} 道题目。` });
      setFileContent(null);
      setFileName('');
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.title || err.response?.data || '导入失败，请检查数据格式与网络' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-fade-in-up">
      <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <UploadCloud className="w-20 h-20 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold text-white mb-4">上传题库</h1>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            仅限管理员使用。请上传由后台 Python 爬虫生成的结构化 `aws_questions.json` 题库文件。
            原有题库将被清空替换。
          </p>

          <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl p-8 transition-all hover:border-indigo-500 hover:bg-indigo-500/5 group relative cursor-pointer mb-8">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="pointer-events-none">
              <p className="text-lg font-medium text-gray-300 group-hover:text-indigo-300">
                {fileName ? fileName : '点击或拖拽上传 JSON 文件'}
              </p>
              {!fileName && <p className="text-sm text-gray-500 mt-2">支持 .json 格式，单次大小不超过 10MB</p>}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!fileContent || loading}
            className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/30 text-lg flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? <Loader className="animate-spin" /> : '开始导入到数据库'}
          </button>

          {status && (
            <div className={`mt-8 p-5 rounded-xl border flex items-start gap-3 text-left ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {status.type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <div>
                <h4 className="font-bold">{status.type === 'success' ? '操作成功' : '操作失败'}</h4>
                <p className="opacity-90 mt-1">{status.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
