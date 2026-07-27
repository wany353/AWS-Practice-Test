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
    <div className="bg-cq-surface/90 backdrop-blur-md border border-cq-line rounded-3xl p-8 sm:p-10 shadow-cq-card relative overflow-hidden text-center">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cq-coral/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cq-amber/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative z-10">
        <UploadCloud className="w-16 h-16 text-cq-amber mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">上传题库</h2>
        <p className="text-cq-sub mb-8 max-w-xl mx-auto text-sm">
          请上传结构化 <code className="text-cq-amber bg-cq-amber/10 px-1.5 py-0.5 rounded font-mono">aws_questions.json</code> 题库文件。原有题库将被清空并替换。
        </p>
        <div className="bg-cq-panel/50 border-2 border-dashed border-cq-line rounded-2xl p-8 transition-all hover:border-cq-amber hover:bg-cq-amber/5 group relative cursor-pointer mb-6">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div className="pointer-events-none">
            <p className="text-base font-medium text-cq-sub group-hover:text-cq-amber">
              {fileName ? fileName : '点击或拖拽上传 JSON 文件'}
            </p>
            {!fileName && <p className="text-sm text-cq-faint mt-1">支持 .json 格式</p>}
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={!fileContent || loading}
          className="px-10 py-3.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-bold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-cq-accent hover:brightness-110 flex items-center justify-center gap-2 mx-auto"
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
        <Loader className="animate-spin w-8 h-8 text-cq-amber" />
        <span className="ml-3 text-cq-sub">加载题目列表...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-cq-faint">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>暂无题目，请先上传题库文件。</p>
      </div>
    );
  }

  return (
    <div>
      {/* 统计栏 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4 text-sm text-cq-sub">
          <span>共 <span className="text-cq-ink font-semibold font-mono">{questions.length}</span> 题</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            已有解析 <span className="text-emerald-400 font-semibold">{questions.filter(q => hasRealAnalysis(q.analysis)).length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-cq-faint" />
            待补充 <span className="text-cq-ink font-semibold">{questions.filter(q => !hasRealAnalysis(q.analysis)).length}</span>
          </span>
        </div>
        {/* 分页 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg bg-cq-panel hover:bg-cq-panel/70 disabled:opacity-30 disabled:cursor-not-allowed text-cq-sub transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-cq-sub px-1">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg bg-cq-panel hover:bg-cq-panel/70 disabled:opacity-30 disabled:cursor-not-allowed text-cq-sub transition"
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
                  ? 'border-cq-amber/60 bg-cq-amber/5'
                  : 'border-cq-line bg-cq-surface/60 hover:border-cq-faint'
              }`}
            >
              {/* 题目头 */}
              <div className="flex items-start gap-3 p-4">
                {/* 序号 + 状态点 */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-xs font-mono text-cq-faint leading-none">#{q.id}</span>
                  <div className={`w-2 h-2 rounded-full mt-1 ${hasAnalysis ? 'bg-emerald-400' : 'bg-cq-faint'}`}
                    title={hasAnalysis ? '已有解析' : '暂无解析'} />
                </div>

                {/* 题目内容摘要 */}
                <div className="flex-1 min-w-0">
                  <p className="text-cq-sub text-sm leading-snug line-clamp-2">{q.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-cq-panel text-cq-faint font-mono">{q.type}</span>
                    <span className="text-xs text-cq-faint">答案：<span className="font-mono text-cq-sub">{q.answer}</span></span>
                    {hasAnalysis
                      ? <span className="text-xs text-emerald-500 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> 已有解析</span>
                      : <span className="text-xs text-cq-faint">暂无解析</span>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cq-amber/15 hover:bg-cq-amber/25 text-cq-amber border border-cq-amber/30 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {hasAnalysis ? '编辑解析' : '添加解析'}
                    </button>
                  ) : (
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cq-panel hover:bg-cq-panel/70 text-cq-sub transition"
                    >
                      <X className="w-3.5 h-3.5" /> 取消
                    </button>
                  )}
                </div>
              </div>

              {/* 展开的编辑区 */}
              {isEditing && (
                <div className="border-t border-cq-line p-4 space-y-3 animate-fade-in">
                  {/* 切换编辑/预览 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cq-sub uppercase tracking-wider">
                      解析内容（支持 Markdown）
                    </span>
                    <button
                      onClick={() => setPreview(v => !v)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cq-panel hover:bg-cq-panel/70 text-cq-sub transition"
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
                      className="w-full bg-cq-panel border border-cq-line rounded-xl px-4 py-3 text-sm text-cq-ink placeholder-cq-faint focus:outline-none focus:border-cq-amber focus:ring-1 focus:ring-cq-amber/50 resize-none font-mono leading-relaxed transition"
                    />
                  ) : (
                    <div className="bg-cq-panel/40 border border-cq-line rounded-xl px-5 py-4 min-h-[200px]">
                      {editContent ? (
                        <div className="prose prose-sm prose-invert max-w-none
                          prose-p:text-cq-sub prose-p:leading-relaxed prose-p:my-1
                          prose-strong:text-cq-amber prose-strong:font-semibold
                          prose-code:text-amber-300 prose-code:bg-cq-bg prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                          prose-pre:bg-cq-bg prose-pre:border prose-pre:border-cq-line prose-pre:rounded-lg
                          prose-ul:text-cq-sub prose-li:my-0.5
                          prose-ol:text-cq-sub
                          prose-h2:text-cq-ink prose-h3:text-cq-ink
                          prose-blockquote:border-cq-amber prose-blockquote:text-cq-sub">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {editContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-cq-faint text-sm italic">（内容为空）</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => saveAnalysis(q.id)}
                      disabled={savingId === q.id}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent transition disabled:opacity-50 disabled:cursor-not-allowed shadow-cq-accent hover:brightness-110"
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
        <div className="flex justify-center items-center gap-3 mt-6 pt-6 border-t border-cq-line">
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); setEditingId(null); }}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-cq-panel hover:bg-cq-panel/70 disabled:opacity-30 text-cq-sub transition"
          >
            <ChevronLeft className="w-4 h-4" /> 上一页
          </button>
          <span className="text-sm text-cq-faint">第 {page + 1} 页 / 共 {totalPages} 页</span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setEditingId(null); }}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-cq-panel hover:bg-cq-panel/70 disabled:opacity-30 text-cq-sub transition"
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
        <h1 className="font-display text-3xl font-bold text-cq-ink mb-1">管理员面板</h1>
        <p className="text-cq-faint text-sm">题库管理 · 解析编辑</p>
      </div>

      {/* 标签页导航 */}
      <div className="flex gap-2 mb-6 bg-cq-surface/90 border border-cq-line rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'analysis'
              ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent'
              : 'text-cq-sub hover:text-cq-ink hover:bg-cq-panel/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          解析管理
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent'
              : 'text-cq-sub hover:text-cq-ink hover:bg-cq-panel/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          上传题库
        </button>
      </div>

      {/* 内容区 */}
      {activeTab === 'upload' && <UploadSection />}
      {activeTab === 'analysis' && (
        <div className="bg-cq-surface/90 backdrop-blur-md border border-cq-line rounded-3xl p-6 sm:p-8 shadow-cq-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cq-amber/12 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-cq-amber" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-cq-ink">题目解析管理</h2>
              <p className="text-cq-faint text-xs mt-0.5">为每道题目编写 Markdown 格式解析，绿色圆点表示已有解析</p>
            </div>
          </div>
          <AnalysisManager />
        </div>
      )}
    </div>
  );
};
