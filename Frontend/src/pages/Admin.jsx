import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useI18n } from '../context/I18nContext';
import { hasRealAnalysis } from '../utils/analysis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  UploadCloud, CheckCircle, AlertCircle, Loader, FileText,
  ChevronLeft, ChevronRight, Edit3, Save, X, BookOpen,
  CheckCircle2, Circle
} from 'lucide-react';

const PAGE_SIZE = 20;

// ========== Upload question bank ==========
const UploadSection = () => {
  const { t, tr } = useI18n();
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Exam (question bank category) selection
  const [exams, setExams] = useState([]);
  const [examMode, setExamMode] = useState('existing'); // 'existing' | 'new'
  const [selectedExamId, setSelectedExamId] = useState('');
  const [newExamName, setNewExamName] = useState('');

  const loadExams = async () => {
    try {
      const { data } = await api.get('/Categories');
      setExams(data);
      if (data.length > 0) {
        setSelectedExamId((prev) => prev || String(data[0].id));
        setExamMode((prev) => (prev === 'new' ? prev : 'existing'));
      } else {
        setExamMode('new');
      }
      return data;
    } catch {
      setExamMode('new');
      return [];
    }
  };

  useEffect(() => { loadExams(); }, []);

  const resolvedExamName = examMode === 'new'
    ? newExamName.trim()
    : (exams.find((e) => String(e.id) === String(selectedExamId))?.name || '');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let rawText = event.target.result;
        // Some exported banks contain NUL bytes where a "fi" ligature was.
        // eslint-disable-next-line no-control-regex
        rawText = rawText.replace(/\u0000/g, 'fi');
        const json = JSON.parse(rawText);
        setFileContent(json);
      } catch {
        setStatus({ type: 'error', key: 'admin.upload.invalidJson' });
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!fileContent) return;
    if (!resolvedExamName) {
      setStatus({ type: 'error', key: 'admin.upload.selectExamFirst' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const questions = fileContent.map((item) => {
        let type = 'Single';
        // Accept correct_answer (array ["A","C"]) or answer (string "A" / "A, C")
        const rawAns = item.correct_answer ?? item.answer ?? '';
        const cleanAnswer = (Array.isArray(rawAns) ? rawAns.join('') : String(rawAns))
          .toUpperCase().replace(/[^A-Z]/g, '');
        if (cleanAnswer.length > 1) type = 'Multiple';
        let optionsList = [];
        if (item.options) {
          for (const [key, value] of Object.entries(item.options)) {
            optionsList.push(`${key}. ${value}`);
          }
        }
        return {
          content: item.question || t('admin.upload.noContent'),
          answer: cleanAnswer,
          type: type,
          optionsJson: JSON.stringify(optionsList),
          analysis: '', // no placeholder text: an empty explanation reads as "no explanation" in every language
        };
      });
      const { data } = await api.post('/Questions/import', { examName: resolvedExamName, questions });
      setStatus({ type: 'success', key: 'admin.upload.success', vars: { count: questions.length, exam: resolvedExamName } });
      setFileContent(null);
      setFileName('');
      setNewExamName('');
      await loadExams();
      if (data.examId) { setSelectedExamId(String(data.examId)); setExamMode('existing'); }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', key: 'admin.upload.failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cq-surface backdrop-blur-md border border-cq-line rounded-3xl p-8 sm:p-10 shadow-cq-card relative overflow-hidden text-center">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cq-acc-soft rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cq-acc-soft rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative z-10">
        <UploadCloud className="w-16 h-16 text-cq-acc mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-cq-ink mb-2">{t('admin.upload.title')}</h2>
        <p className="text-cq-sub mb-8 max-w-xl mx-auto text-sm">
          {tr('admin.upload.desc', { file: <code className="text-cq-acc bg-cq-acc-soft px-1.5 py-0.5 rounded font-mono">aws_questions.json</code> })}{' '}<span className="text-cq-faint">{t('admin.upload.replaceNote')}</span>
        </p>

        {/* Exam selection */}
        <div className="max-w-md mx-auto text-left mb-6">
          <label className="block text-sm font-semibold text-cq-sub mb-2">{t('admin.upload.examLabel')}</label>
          <select
            value={examMode === 'new' ? '__new__' : selectedExamId}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__new__') { setExamMode('new'); }
              else { setExamMode('existing'); setSelectedExamId(v); }
            }}
            className="cq-select w-full"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{t('admin.upload.examOption', { name: ex.name, count: ex.questionCount })}</option>
            ))}
            <option value="__new__">{t('admin.upload.newExam')}</option>
          </select>
          {examMode === 'new' && (
            <input
              type="text"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              placeholder={t('admin.upload.newExamPlaceholder')}
              className="w-full mt-3 px-4 py-3 rounded-xl bg-cq-panel border border-cq-line text-cq-ink placeholder-cq-faint focus:outline-none focus:ring-2 focus:ring-cq-acc focus:border-transparent transition"
            />
          )}
        </div>

        <div className="bg-cq-panel border-2 border-dashed border-cq-line rounded-2xl p-8 transition-all hover:border-cq-acc hover:bg-cq-acc-soft group relative cursor-pointer mb-6">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div className="pointer-events-none">
            <p className="text-base font-medium text-cq-sub group-hover:text-cq-acc">
              {fileName ? fileName : t('admin.upload.dropHint')}
            </p>
            {!fileName && <p className="text-sm text-cq-faint mt-1">{t('admin.upload.jsonOnly')}</p>}
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={!fileContent || loading}
          className="px-10 py-3.5 bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent font-bold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-cq-accent hover:brightness-110 flex items-center justify-center gap-2 mx-auto"
        >
          {loading ? <Loader className="animate-spin w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
          {loading ? t('admin.upload.importing') : t('admin.upload.importInto', { exam: resolvedExamName || '…' })}
        </button>
        {status && (
          <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 text-left ${
            status.type === 'success'
              ? 'bg-cq-ok-soft border-cq-ok text-cq-ok'
              : 'bg-cq-bad-soft border-cq-bad text-cq-bad'
          }`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <h4 className="font-bold text-sm">{status.type === 'success' ? t('admin.upload.opSuccess') : t('admin.upload.opFailed')}</h4>
              <p className="opacity-90 mt-0.5 text-sm">{t(status.key, status.vars)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== Explanation manager ==========
const AnalysisManager = () => {
  const { t, tr } = useI18n();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({}); // { [id]: 'success' | 'error' }
  const [preview, setPreview] = useState(false);
  // Exam filter (consistent with upload/practice)
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState(''); // '' = all exams
  const [examsLoaded, setExamsLoaded] = useState(false);

  // Load exams; default to the last used exam (cq-exam) or the first
  useEffect(() => {
    api.get('/Categories')
      .then(({ data }) => {
        setExams(data);
        if (data.length > 0) {
          const saved = localStorage.getItem('cq-exam');
          setExamFilter(data.some(e => String(e.id) === saved) ? saved : String(data[0].id));
        }
      })
      .catch(() => {})
      .finally(() => setExamsLoaded(true));
  }, []);

  // Load questions for the selected exam
  useEffect(() => {
    if (!examsLoaded) return;
    let cancelled = false;
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const params = examFilter ? { categoryId: examFilter } : {};
        const { data } = await api.get('/Questions', { params });
        if (!cancelled) { setQuestions(data); setPage(0); }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchQuestions();
    return () => { cancelled = true; };
  }, [examFilter, examsLoaded]);

  const changeFilter = (id) => {
    setExamFilter(id);
    try { if (id) localStorage.setItem('cq-exam', String(id)); } catch { /* ignore */ }
  };

  // ===== Bulk-import explanations =====
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImportAnalysis = (e) => {
    const file = e.target.files[0];
    e.target.value = '';           // allow re-selecting the same file
    if (!file) return;
    if (!examFilter) {
      setImportResult({ type: 'error', key: 'admin.analysis.selectSpecificExam' });
      return;
    }
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      let raw;
      try {
        raw = JSON.parse(ev.target.result);
        if (!Array.isArray(raw)) throw new Error('not array');
      } catch {
        setImportResult({ type: 'error', key: 'admin.analysis.invalidJsonArray' });
        return;
      }
      // Accept correct_answer / correctAnswer and explanation / analysis
      const items = raw.map((it) => ({
        number: Number(it.number ?? it.index ?? 0),
        correctAnswer: String(it.correct_answer ?? it.correctAnswer ?? it.answer ?? ''),
        explanation: String(it.explanation ?? it.analysis ?? ''),
      })).filter((it) => it.number > 0 && it.explanation);

      if (items.length === 0) {
        setImportResult({ type: 'error', key: 'admin.analysis.noUsableItems' });
        return;
      }

      setImporting(true);
      try {
        const { data } = await api.post('/Questions/import-analysis', {
          categoryId: Number(examFilter),
          skipMismatch: true,
          items,
        });
        setImportResult({
          type: 'success',
          key: data.mismatch > 0 ? 'admin.analysis.importSummaryMismatch' : 'admin.analysis.importSummary',
          vars: { updated: data.updated, mismatch: data.mismatch },
          detail: data,
        });
        // Reload the list to refresh the "has explanation" counts
        const params = examFilter ? { categoryId: examFilter } : {};
        const res = await api.get('/Questions', { params });
        setQuestions(res.data);
      } catch (err) {
        // The only 400 the client can still trigger (empty items are rejected above) is an exam with no questions.
        setImportResult({ type: 'error', key: err.response?.status === 400 ? 'admin.analysis.noQuestionsInExam' : 'admin.analysis.importFailed' });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

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
      // Update local state to match
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin w-8 h-8 text-cq-acc" />
        <span className="ml-3 text-cq-sub">{t('admin.analysis.loading')}</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-cq-faint">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>{t('admin.analysis.empty')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4 text-sm text-cq-sub">
          {exams.length > 0 && (
            <select value={examFilter} onChange={(e) => changeFilter(e.target.value)} className="cq-select">
              <option value="">{t('common.allExams')}</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          )}
          <span>{tr('admin.analysis.total', { n: <span className="text-cq-ink font-semibold font-mono">{questions.length}</span> })}</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cq-ok" />
            {t('admin.analysis.hasAnalysis')} <span className="text-cq-ok font-semibold">{questions.filter(q => hasRealAnalysis(q.analysis)).length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-cq-faint" />
            {t('admin.analysis.missing')} <span className="text-cq-ink font-semibold">{questions.filter(q => !hasRealAnalysis(q.analysis)).length}</span>
          </span>
          <label className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            importing || !examFilter
              ? 'border-cq-line bg-cq-panel text-cq-faint cursor-not-allowed'
              : 'border-cq-acc bg-cq-acc-soft text-cq-acc cursor-pointer hover:brightness-110'
          }`} title={examFilter ? t('admin.analysis.bulkImportTitle') : t('admin.analysis.selectExamFirstShort')}>
            {importing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            {importing ? t('admin.analysis.importing') : t('admin.analysis.bulkImport')}
            <input
              type="file"
              accept=".json"
              disabled={importing || !examFilter}
              onChange={handleImportAnalysis}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </label>
        </div>
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg bg-cq-panel hover:bg-cq-panel2 disabled:opacity-30 disabled:cursor-not-allowed text-cq-sub transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-cq-sub px-1">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg bg-cq-panel hover:bg-cq-panel2 disabled:opacity-30 disabled:cursor-not-allowed text-cq-sub transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk-import result */}
      {importResult && (
        <div className={`mb-5 p-4 rounded-xl border flex items-start gap-3 ${
          importResult.type === 'success'
            ? 'bg-cq-ok-soft border-cq-ok text-cq-ok'
            : 'bg-cq-bad-soft border-cq-bad text-cq-bad'
        }`}>
          {importResult.type === 'success'
            ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">{importResult.type === 'success' ? t('admin.analysis.importDone') : t('admin.analysis.importFailedTitle')}</h4>
            <p className="opacity-90 mt-0.5 text-sm">{t(importResult.key, importResult.vars)}</p>
            {importResult.detail && (
              <div className="mt-2 text-xs text-cq-sub flex flex-wrap gap-x-4 gap-y-1 font-mono">
                <span>{t('admin.analysis.statFile', { n: importResult.detail.total })}</span>
                <span>{t('admin.analysis.statBank', { n: importResult.detail.dbCount })}</span>
                <span className="text-cq-ok">{t('admin.analysis.statUpdated', { n: importResult.detail.updated })}</span>
                {importResult.detail.mismatch > 0 && <span className="text-cq-bad">{t('admin.analysis.statMismatch', { n: importResult.detail.mismatch })}</span>}
                {importResult.detail.outOfRange > 0 && <span className="text-cq-faint">{t('admin.analysis.statOutOfRange', { n: importResult.detail.outOfRange })}</span>}
              </div>
            )}
            {importResult.detail?.mismatchSample?.length > 0 && (
              <p className="mt-1.5 text-xs text-cq-faint">
                {t('admin.analysis.mismatchSample', { list: importResult.detail.mismatchSample.join(', ') })}
                {importResult.detail.mismatch > importResult.detail.mismatchSample.length ? ' …' : ''}
              </p>
            )}
          </div>
          <button onClick={() => setImportResult(null)} className="shrink-0 text-cq-faint hover:text-cq-ink"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Question list */}
      <div className="space-y-3">
        {pageQuestions.map((q, localIdx) => {
          const isEditing = editingId === q.id;
          const hasAnalysis = hasRealAnalysis(q.analysis);
          const status = saveStatus[q.id];
          const seq = page * PAGE_SIZE + localIdx + 1; // Position within the exam (not the database ID)

          return (
            <div
              key={q.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isEditing
                  ? 'border-cq-acc bg-cq-acc-soft'
                  : 'border-cq-line bg-cq-panel hover:border-cq-faint'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start gap-3 p-4">
                {/* Number + status dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-xs font-mono text-cq-faint leading-none" title={t('admin.analysis.dbId', { id: q.id })}>#{seq}</span>
                  <div className={`w-2 h-2 rounded-full mt-1 ${hasAnalysis ? 'bg-cq-ok' : 'bg-cq-faint'}`}
                    title={hasAnalysis ? t('admin.analysis.hasAnalysis') : t('admin.analysis.noAnalysis')} />
                </div>

                {/* Question summary */}
                <div className="flex-1 min-w-0">
                  <p className="text-cq-sub text-sm leading-snug line-clamp-2">{q.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-cq-panel text-cq-faint font-mono">{q.type}</span>
                    <span className="text-xs text-cq-faint">{tr('admin.analysis.answer', { answer: <span className="font-mono text-cq-sub">{q.answer}</span> })}</span>
                    {hasAnalysis
                      ? <span className="text-xs text-cq-ok flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> {t('admin.analysis.hasAnalysis')}</span>
                      : <span className="text-xs text-cq-faint">{t('admin.analysis.noAnalysis')}</span>
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {status === 'success' && (
                    <span className="text-xs text-cq-ok flex items-center gap-1 animate-fade-in">
                      <CheckCircle className="w-3.5 h-3.5" /> {t('admin.analysis.saved')}
                    </span>
                  )}
                  {status === 'error' && (
                    <span className="text-xs text-cq-bad flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" /> {t('admin.analysis.saveFailed')}
                    </span>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cq-acc-soft hover:bg-cq-acc-soft text-cq-acc border border-cq-acc transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {hasAnalysis ? t('admin.analysis.editAnalysis') : t('admin.analysis.addAnalysis')}
                    </button>
                  ) : (
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cq-panel hover:bg-cq-panel2 text-cq-sub transition"
                    >
                      <X className="w-3.5 h-3.5" /> {t('common.cancel')}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded editor */}
              {isEditing && (
                <div className="border-t border-cq-line p-4 space-y-3 animate-fade-in">
                  {/* Edit / preview toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cq-sub uppercase tracking-wider">
                      {t('admin.analysis.contentLabel')}
                    </span>
                    <button
                      onClick={() => setPreview(v => !v)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cq-panel hover:bg-cq-panel2 text-cq-sub transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {preview ? t('admin.analysis.backToEdit') : t('admin.analysis.preview')}
                    </button>
                  </div>

                  {!preview ? (
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={10}
                      placeholder={t('admin.analysis.placeholder')}
                      className="w-full bg-cq-panel border border-cq-line rounded-xl px-4 py-3 text-sm text-cq-ink placeholder-cq-faint focus:outline-none focus:border-cq-acc focus:ring-1 focus:ring-cq-acc resize-none font-mono leading-relaxed transition"
                    />
                  ) : (
                    <div className="bg-cq-panel border border-cq-line rounded-xl px-5 py-4 min-h-[200px]">
                      {editContent ? (
                        <div className="prose prose-sm prose-invert max-w-none
                          prose-p:text-cq-sub prose-p:leading-relaxed prose-p:my-1
                          prose-strong:text-cq-acc prose-strong:font-semibold
                          prose-code:text-cq-gold prose-code:bg-cq-bg prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                          prose-pre:bg-cq-bg prose-pre:border prose-pre:border-cq-line prose-pre:rounded-lg
                          prose-ul:text-cq-sub prose-li:my-0.5
                          prose-ol:text-cq-sub
                          prose-h2:text-cq-ink prose-h3:text-cq-ink
                          prose-blockquote:border-cq-acc prose-blockquote:text-cq-sub">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {editContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-cq-faint text-sm italic">{t('admin.analysis.emptyContent')}</p>
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
                        ? <><Loader className="animate-spin w-4 h-4" /> {t('admin.analysis.saving')}</>
                        : <><Save className="w-4 h-4" /> {t('admin.analysis.saveAnalysis')}</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6 pt-6 border-t border-cq-line">
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); setEditingId(null); }}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-cq-panel hover:bg-cq-panel2 disabled:opacity-30 text-cq-sub transition"
          >
            <ChevronLeft className="w-4 h-4" /> {t('admin.analysis.prevPage')}
          </button>
          <span className="text-sm text-cq-faint">{t('admin.analysis.pageOf', { page: page + 1, total: totalPages })}</span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setEditingId(null); }}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-cq-panel hover:bg-cq-panel2 disabled:opacity-30 text-cq-sub transition"
          >
            {t('admin.analysis.nextPage')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ========== Main page ==========
export const Admin = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('analysis');

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cq-ink mb-1">{t('admin.title')}</h1>
        <p className="text-cq-faint text-sm">{t('admin.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-cq-surface border border-cq-line rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'analysis'
              ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent'
              : 'text-cq-sub hover:text-cq-ink hover:bg-cq-panel'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t('admin.tabAnalysis')}
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-gradient-to-br from-cq-coral to-cq-amber text-cq-on-accent shadow-cq-accent'
              : 'text-cq-sub hover:text-cq-ink hover:bg-cq-panel'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          {t('admin.tabUpload')}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'upload' && <UploadSection />}
      {activeTab === 'analysis' && (
        <div className="bg-cq-surface backdrop-blur-md border border-cq-line rounded-3xl p-6 sm:p-8 shadow-cq-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cq-acc-soft flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-cq-acc" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-cq-ink">{t('admin.analysisTitle')}</h2>
              <p className="text-cq-faint text-xs mt-0.5">{t('admin.analysisDesc')}</p>
            </div>
          </div>
          <AnalysisManager />
        </div>
      )}
    </div>
  );
};
