import { useState, useEffect } from 'react';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  UploadCloud, CheckCircle, AlertCircle, Loader, FileText,
  ChevronLeft, ChevronRight, Edit3, Save, X, BookOpen,
  CheckCircle2, Circle
} from 'lucide-react';

const PAGE_SIZE = 20;

// ========== 上传题库区域 ==========
const UploadSection = () => {
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
        let rawText = event.target.result;
        rawText = rawText.replace(/\u0000/g, 'fi');
        const json = JSON.parse(rawText);
        setFileContent(json);
      } catch {
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
      const payload = fileContent.map((item) => {
        let type = 'Single';
        const cleanAnswer = item.answer ? item.answer.replace(/[^A-Z]/g, '') : '';
        if (cleanAnswer.length > 1) type = 'Multiple';
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
    <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center">
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative z-10">
        <UploadCloud className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold text-white mb-2">上传题库</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto text-sm">
          请上传结构化 <code className="text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded">aws_questions.json</code> 题库文件。原有题库将被清空并替换。
        </p>
        <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl p-8 transition-all hover:border-indigo-500 hover:bg-indigo-500/5 group relative cursor-pointer mb-6">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div className="pointer-events-none">
            <p className="text-base font-medium text-gray-300 group-hover:text-indigo-300">
              {fileName ? fileName : '点击或拖拽上传 JSON 文件'}
            </p>
            {!fileName && <p className="text-sm text-gray-500 mt-1">支持 .json 格式</p>}
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={!fileContent || loading}
          className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 mx-auto"
        >
          {loading ? <Loader className="animate-spin w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
          {loading ? '导入中...' : '开始导入到数据库'}
        </button>
        {status && (
          <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 text-left ${
            status.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <h4 className="font-bold text-sm">{status.type === 'success' ? '操作成功' : '操作失败'}</h4>
              <p className="opacity-90 mt-0.5 text-sm">{status.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 解析管理区域 ==========
const AnalysisManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({}); // { [id]: 'success' | 'error' }
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/Questions');
        setQuestions(data);
      } catch (err) {
        console.error('加载题目失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const pageQuestions = questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditContent(q.analysis || '');
    setPreview(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setPreview(false);
  };

  const saveAnalysis = async (id) => {
    setSavingId(id);
    try {
      await api.patch(`/Questions/${id}/analysis`, { analysis: editContent });
      // 本地同步更新
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, analysis: editContent } : q));
      setSaveStatus(prev => ({ ...prev, [id]: 'success' }));
      setEditingId(null);
      setTimeout(() => setSaveStatus(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    } catch {
      setSaveStatus(prev => ({ ...prev, [id]: 'error' }));
      setTimeout(() => setSaveStatus(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    } finally {
      setSavingId(null);
    }
  };

  const hasRealAnalysis = (analysis) =>
    analysis && !analysis.includes('该题目暂未提供详细的思路解析');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin w-8 h-8 text-indigo-400" />
        <span className="ml-3 text-gray-400">加载题目列表...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>暂无题目，请先上传题库文件。</p>
      </div>
    );
  }

  return (
    <div>
      {/* 统计栏 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>共 <span className="text-white font-semibold">{questions.length}</span> 题</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            已有解析 <span className="text-emerald-400 font-semibold">{questions.filter(q => hasRealAnalysis(q.analysis)).length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-gray-600" />
            待补充 <span className="text-gray-300 font-semibold">{questions.filter(q => !hasRealAnalysis(q.analysis)).length}</span>
          </span>
        </div>
        {/* 分页 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400 px-1">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-3">
        {pageQuestions.map((q) => {
          const isEditing = editingId === q.id;
          const hasAnalysis = hasRealAnalysis(q.analysis);
          const status = saveStatus[q.id];

          return (
            <div
              key={q.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isEditing
                  ? 'border-indigo-500/60 bg-indigo-900/10'
                  : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
              }`}
            >
              {/* 题目头 */}
              <div className="flex items-start gap-3 p-4">
                {/* 序号 + 状态点 */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-xs font-mono text-gray-500 leading-none">#{q.id}</span>
                  <div className={`w-2 h-2 rounded-full mt-1 ${hasAnalysis ? 'bg-emerald-400' : 'bg-gray-600'}`}
                    title={hasAnalysis ? '已有解析' : '暂无解析'} />
                </div>

                {/* 题目内容摘要 */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm leading-snug line-clamp-2">{q.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500">{q.type}</span>
                    <span className="text-xs text-gray-600">答案：<span className="font-mono text-gray-400">{q.answer}</span></span>
                    {hasAnalysis
                      ? <span className="text-xs text-emerald-500 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> 已有解析</span>
                      : <span className="text-xs text-gray-600">暂无解析</span>
                    }
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {status === 'success' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in">
                      <CheckCircle className="w-3.5 h-3.5" /> 已保存
                    </span>
                  )}
                  {status === 'error' && (
                    <span className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" /> 保存失败
                    </span>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-600/30 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {hasAnalysis ? '编辑解析' : '添加解析'}
                    </button>
                  ) : (
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 hover:bg-gray-700 text-gray-400 transition"
                    >
                      <X className="w-3.5 h-3.5" /> 取消
                    </button>
                  )}
                </div>
              </div>

              {/* 展开的编辑区 */}
              {isEditing && (
                <div className="border-t border-gray-800 p-4 space-y-3 animate-fade-in">
                  {/* 切换编辑/预览 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      解析内容（支持 Markdown）
                    </span>
                    <button
                      onClick={() => setPreview(v => !v)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {preview ? '返回编辑' : '预览'}
                    </button>
                  </div>

                  {!preview ? (
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={10}
                      placeholder={`在此输入 Markdown 格式的解析内容...\n\n例如：\n## 解析思路\n\n正确答案是 **A**，原因如下：\n\n- AWS S3 是对象存储服务\n- 适合存储静态文件\n\n> 参考：AWS 官方文档`}
                      className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none font-mono leading-relaxed transition"
                    />
                  ) : (
                    <div className="bg-gray-800/40 border border-gray-700 rounded-xl px-5 py-4 min-h-[200px]">
                      {editContent ? (
                        <div className="prose prose-sm prose-invert max-w-none
                          prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1
                          prose-strong:text-indigo-300 prose-strong:font-semibold
                          prose-code:text-amber-300 prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg
                          prose-ul:text-gray-300 prose-li:my-0.5
                          prose-ol:text-gray-300
                          prose-h2:text-white prose-h3:text-gray-200
                          prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {editContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm italic">（内容为空）</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => saveAnalysis(q.id)}
                      disabled={savingId === q.id}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                      {savingId === q.id
                        ? <><Loader className="animate-spin w-4 h-4" /> 保存中...</>
                        : <><Save className="w-4 h-4" /> 保存解析</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6 pt-6 border-t border-gray-800">
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); setEditingId(null); }}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" /> 上一页
          </button>
          <span className="text-sm text-gray-500">第 {page + 1} 页 / 共 {totalPages} 页</span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setEditingId(null); }}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 transition"
          >
            下一页 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ========== 主页面 ==========
export const Admin = () => {
  const [activeTab, setActiveTab] = useState('analysis');

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">管理员面板</h1>
        <p className="text-gray-500 text-sm">题库管理 · 解析编辑</p>
      </div>

      {/* 标签页导航 */}
      <div className="flex gap-2 mb-6 bg-gray-900/60 border border-gray-800 rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'analysis'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          解析管理
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          上传题库
        </button>
      </div>

      {/* 内容区 */}
      {activeTab === 'upload' && <UploadSection />}
      {activeTab === 'analysis' && (
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">题目解析管理</h2>
              <p className="text-gray-500 text-xs mt-0.5">为每道题目编写 Markdown 格式解析，绿色圆点表示已有解析</p>
            </div>
          </div>
          <AnalysisManager />
        </div>
      )}
    </div>
  );
};
