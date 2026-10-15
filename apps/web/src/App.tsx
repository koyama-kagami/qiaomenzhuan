import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Download, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api, type Bootstrap } from './api';
import Resumes from './views/Resumes';
import { Modal, Field } from './components';
export default function App() {
  const [tab, setTab] = useState<'resumes' | 'search'>('resumes');
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedResume, setSelectedResume] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportId, setExportId] = useState('');
  const [dirty, setDirty] = useState(false);
  const navigate = (next: 'resumes' | 'search') => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const refresh = useCallback(async () => setData(await api<Bootstrap>('/bootstrap')), []);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setError('');
    setBusy(true);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败，请重试。');
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void run(refresh);
  }, [run, refresh]);
  const exportPdf = (id: string) =>
    run(async () => {
      if (dirty) throw new Error('请先保存简历修改，再导出 PDF。');
      const resume = data?.resumes.find((item) => item.id === id);
      if (!resume) throw new Error('请选择要导出的简历。');
      const result = await api<{ url: string }>(`/resumes/${id}/build`, {});
      const response = await fetch(result.url);
      if (!response.ok) throw new Error('PDF 下载失败，请重试。');
      if (!response.headers.get('content-type')?.includes('application/pdf'))
        throw new Error('未获得有效 PDF，请重新编译。');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.title.replace(/[<>:"/\\|?*]/g, '_') + '.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setExporting(false);
    });
  const destination = tab === 'resumes' ? 'search' : 'resumes';
  return (
    <div className="folio-app">
      <header className="folio-topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('resumes');
          }}
        >
          <img src="/brick.svg" width={28} height={28} alt="" />
          敲门砖
        </a>
        <div className="topbar-actions">
          <button
            className={`icon-button toolbar-action ${tab === 'search' ? 'is-refresh' : 'is-download'}`}
            aria-label={tab === 'search' ? '刷新求职页' : '导出简历'}
            title={tab === 'search' ? '刷新求职页' : '导出简历'}
            disabled={busy || (tab === 'resumes' && !data?.resumes.length)}
            onClick={() => {
              if (tab === 'search') {
                void run(async () => {
                  const latest = await api<Bootstrap>('/bootstrap');
                  setData((previous) =>
                    dirty && previous ? { ...latest, resumes: previous.resumes } : latest,
                  );
                });
                return;
              }
              if (dirty) {
                setError('请先保存简历修改，再导出 PDF。');
                return;
              }
              const id = selectedResume || (data?.resumes.length === 1 ? data.resumes[0].id : '');
              if (id) void exportPdf(id);
              else {
                setExportId(data?.resumes[0]?.id || '');
                setExporting(true);
              }
            }}
          >
            <span className="toolbar-symbol download-symbol" aria-hidden="true">
              <Download size={18} />
            </span>
            <span className="toolbar-symbol refresh-symbol" aria-hidden="true">
              <RefreshCw size={18} className={busy && tab === 'search' ? 'spinning' : ''} />
            </span>
          </button>
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="icon-button" onClick={() => setError('')} aria-label="关闭错误">
            <X size={18} />
          </button>
        </div>
      )}
      {exporting && data && (
        <Modal title="导出简历" onClose={() => setExporting(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void exportPdf(exportId);
            }}
          >
            <Field label="选择简历">
              <select value={exportId} onChange={(e) => setExportId(e.target.value)}>
                {data.resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </Field>
            <div className="modal-actions">
              <button className="primary" disabled={busy}>
                {busy ? '导出中…' : '下载 PDF'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <main className="folio-viewport">
        <div className={`folio-track ${tab === 'search' ? 'show-search' : ''}`}>
          <section
            className="folio-pane"
            data-page="resumes"
            aria-label="简历页"
            aria-hidden={tab !== 'resumes'}
            inert={tab !== 'resumes'}
          >
            {data ? (
              <Resumes
                {...{ data, refresh, run, busy, dirty }}
                onDirtyChange={setDirty}
                onSelectionChange={setSelectedResume}
              />
            ) : (
              <div className="empty">
                {busy ? '加载中…' : <button onClick={() => void run(refresh)}>重新加载</button>}
              </div>
            )}
          </section>
          <section
            className="folio-pane blank-job-page"
            data-page="search"
            aria-label="求职页"
            aria-hidden={tab !== 'search'}
            inert={tab !== 'search'}
          />
        </div>
      </main>
      <button
        key={destination}
        className={`page-edge ${tab === 'resumes' ? 'edge-right' : 'edge-left'}`}
        aria-label={tab === 'resumes' ? '去求职' : '菜就多练'}
        onClick={() => navigate(destination)}
      >
        {tab === 'resumes' ? <ChevronsRight size={23} /> : <ChevronsLeft size={23} />}
        <span>{tab === 'resumes' ? '去求职' : '菜就多练'}</span>
      </button>
    </div>
  );
}
