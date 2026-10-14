import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  RefreshCw,
  Trash2,
  ArrowRight,
  Database,
  FileUp,
} from 'lucide-react';
import { WorkbookData, Language } from '../types';
import { translations } from '../translations';
import { parseExcelFile } from '../utils/excel';

interface FilesManagementProps {
  referenceWb: WorkbookData | null;
  comparisonWb: WorkbookData | null;
  onSetReferenceWb: (wb: WorkbookData | null) => void;
  onSetComparisonWb: (wb: WorkbookData | null) => void;
  onPreviewWb: (wb: WorkbookData, title: string) => void;
  onProceedToStep2: () => void;
  language: Language;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FilesManagement: React.FC<FilesManagementProps> = ({
  referenceWb,
  comparisonWb,
  onSetReferenceWb,
  onSetComparisonWb,
  onPreviewWb,
  onProceedToStep2,
  language,
  onShowToast,
}) => {
  const t = translations[language];
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const compFileInputRef = useRef<HTMLInputElement>(null);

  const [loadingRef, setLoadingRef] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [refProgress, setRefProgress] = useState<{ percent: number; text: string } | null>(null);
  const [compProgress, setCompProgress] = useState<{ percent: number; text: string } | null>(null);
  const [isDraggingRef, setIsDraggingRef] = useState(false);
  const [isDraggingComp, setIsDraggingComp] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefUpload = async (file: File) => {
    try {
      setLoadingRef(true);
      setRefProgress({ percent: 10, text: 'Opening file...' });
      await new Promise((r) => setTimeout(r, 40));

      const parsed = await parseExcelFile(file, (percent, text) => {
        setRefProgress({ percent, text });
      });

      setRefProgress({ percent: 95, text: 'Saving to secure storage...' });
      await new Promise((r) => setTimeout(r, 20));

      onSetReferenceWb(parsed);
      onShowToast(t.toastRefSaved, 'success');
    } catch (err: any) {
      console.error('File parsing error:', err);
      onShowToast(err.message || t.toastError, 'error');
    } finally {
      setLoadingRef(false);
      setRefProgress(null);
      if (refFileInputRef.current) refFileInputRef.current.value = '';
    }
  };

  const handleCompUpload = async (file: File) => {
    try {
      setLoadingComp(true);
      setCompProgress({ percent: 10, text: 'Opening file...' });
      await new Promise((r) => setTimeout(r, 40));

      const parsed = await parseExcelFile(file, (percent, text) => {
        setCompProgress({ percent, text });
      });

      onSetComparisonWb(parsed);
      onShowToast(`Loaded ${parsed.name} (${parsed.rows.length.toLocaleString()} rows)`, 'success');
    } catch (err: any) {
      console.error('File parsing error:', err);
      onShowToast(err.message || t.toastError, 'error');
    } finally {
      setLoadingComp(false);
      setCompProgress(null);
      if (compFileInputRef.current) compFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white tracking-tight">{t.step1Title}</h2>
        <p className="text-sm text-slate-400 mt-1">{t.step1Desc}</p>
      </div>

      {/* 2-Column Split: Reference File vs Incoming Comparison File */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Reference Workbook (Main File) */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t.referenceFile}</h3>
                <p className="text-xs text-slate-400">Master baseline dataset</p>
              </div>
            </div>

            {referenceWb && !loadingRef && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.savedLocally}
              </span>
            )}
          </div>

          {loadingRef ? (
            /* Progress State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-200">
                  {refProgress?.text || 'Processing spreadsheet...'}
                </div>
                <div className="w-52 bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden mx-auto">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-200"
                    style={{ width: `${refProgress?.percent || 20}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1.5">
                  {refProgress?.percent || 20}%
                </div>
              </div>
            </div>
          ) : referenceWb ? (
            /* Populated Reference Card */
            <div className="flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-100 truncate block">
                          {referenceWb.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          {t.totalRows}: <strong className="text-slate-200 font-mono tabular-nums">{referenceWb.rows.length.toLocaleString()}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>
                          {t.totalCols}: <strong className="text-slate-200 font-mono tabular-nums">{referenceWb.headers.length}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{formatFileSize(referenceWb.size)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {t.lastUpdated}: {formatDate(referenceWb.lastModified)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="font-medium text-slate-300">Columns Detected: </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {referenceWb.headers.slice(0, 5).join(', ')}
                    {referenceWb.headers.length > 5 ? ` +${referenceWb.headers.length - 5} more` : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onPreviewWb(referenceWb, t.referenceFile)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t.previewData}
                </button>

                <button
                  onClick={() => refFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  title={t.replaceFile}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.replaceFile}</span>
                </button>

                <button
                  onClick={() => setShowResetDialog(true)}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 rounded-lg border border-slate-700 hover:border-rose-900/50 transition-colors"
                  title={t.resetReference}
                  aria-label={t.resetReference}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone for Reference */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingRef(true);
              }}
              onDragLeave={() => setIsDraggingRef(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingRef(false);
                if (e.dataTransfer.files?.[0]) {
                  handleRefUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDraggingRef
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">{t.uploadRefPrompt}</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{t.dropFileHere}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t.supportedFormats}</p>

              <button
                onClick={() => refFileInputRef.current?.click()}
                disabled={loadingRef}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {t.browseFiles}
              </button>
            </div>
          )}

          <input
            type="file"
            ref={refFileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleRefUpload(e.target.files[0]);
              }
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>

        {/* Card 2: Incoming Workbook (Comparison File) */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t.incomingFile}</h3>
                <p className="text-xs text-slate-400">Dynamic file to inspect & classify</p>
              </div>
            </div>

            {comparisonWb && !loadingComp && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-950/80 text-sky-400 border border-sky-700/50">
                READY TO EVALUATE
              </span>
            )}
          </div>

          {loadingComp ? (
            /* Progress State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-200">
                  {compProgress?.text || 'Processing spreadsheet...'}
                </div>
                <div className="w-52 bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden mx-auto">
                  <div
                    className="bg-sky-500 h-full transition-all duration-200"
                    style={{ width: `${compProgress?.percent || 20}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1.5">
                  {compProgress?.percent || 20}%
                </div>
              </div>
            </div>
          ) : comparisonWb ? (
            /* Populated Comparison Card */
            <div className="flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-100 truncate block">
                          {comparisonWb.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          {t.totalRows}: <strong className="text-slate-200 font-mono tabular-nums">{comparisonWb.rows.length.toLocaleString()}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>
                          {t.totalCols}: <strong className="text-slate-200 font-mono tabular-nums">{comparisonWb.headers.length}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{formatFileSize(comparisonWb.size)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {t.lastUpdated}: {formatDate(comparisonWb.lastModified)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="font-medium text-slate-300">Columns Detected: </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {comparisonWb.headers.slice(0, 5).join(', ')}
                    {comparisonWb.headers.length > 5 ? ` +${comparisonWb.headers.length - 5} more` : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onPreviewWb(comparisonWb, t.incomingFile)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t.previewData}
                </button>

                <button
                  onClick={() => compFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.replaceFile}</span>
                </button>

                <button
                  onClick={() => onSetComparisonWb(null)}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 rounded-lg border border-slate-700 hover:border-rose-900/50 transition-colors"
                  title={t.clearAll}
                  aria-label={t.clearAll}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone for Comparison */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingComp(true);
              }}
              onDragLeave={() => setIsDraggingComp(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingComp(false);
                if (e.dataTransfer.files?.[0]) {
                  handleCompUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDraggingComp
                  ? 'border-sky-500 bg-sky-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Upload className="w-6 h-6 text-sky-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">{t.uploadCompPrompt}</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{t.dropFileHere}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t.supportedFormats}</p>

              <button
                onClick={() => compFileInputRef.current?.click()}
                disabled={loadingComp}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {t.browseFiles}
              </button>
            </div>
          )}

          <input
            type="file"
            ref={compFileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleCompUpload(e.target.files[0]);
              }
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>
      </div>

      {/* Primary Workflow CTA: Proceed to Step 2 */}
      {referenceWb && comparisonWb && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onProceedToStep2}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-950/50 transition-all hover:translate-x-0.5"
          >
            <span>Proceed to Step 2: Mapping & Rules</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Dialog for Resetting Reference File */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">{t.confirmReset}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.confirmResetDesc}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onSetReferenceWb(null);
                  setShowResetDialog(false);
                  onShowToast(t.toastRefReset, 'info');
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
