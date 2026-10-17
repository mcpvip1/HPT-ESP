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
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { WorkbookData, Language } from '../types';
import { translations } from '../translations';
import { parseExcelFile } from '../utils/excel';

interface FilesManagementProps {
  referenceWb: WorkbookData | null;
  comparisonWb: WorkbookData | null;
  onSetReferenceWb: (wb: WorkbookData | null) => void;
  onSetComparisonWb: (wb: WorkbookData | null, autoEvaluate?: boolean) => void;
  onSelectReferenceSheet?: (sheetName: string) => void;
  onSelectComparisonSheet?: (sheetName: string) => void;
  onPreviewWb: (wb: WorkbookData, title: string) => void;
  onOpenRulesSetting?: () => void;
  onProceedToStep3?: () => void;
  language: Language;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FilesManagement: React.FC<FilesManagementProps> = ({
  referenceWb,
  comparisonWb,
  onSetReferenceWb,
  onSetComparisonWb,
  onSelectReferenceSheet,
  onSelectComparisonSheet,
  onPreviewWb,
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
      setRefProgress({ percent: 10, text: t.filesOpeningFile });
      await new Promise((r) => setTimeout(r, 40));

      const parsed = await parseExcelFile(file, (percent, text) => {
        setRefProgress({ percent, text });
      }, t);

      setRefProgress({ percent: 95, text: t.filesSavingStorage });
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
      setCompProgress({ percent: 10, text: t.filesOpeningFile });
      await new Promise((r) => setTimeout(r, 40));

      const parsed = await parseExcelFile(file, (percent, text) => {
        setCompProgress({ percent, text });
      }, t);

      // Pass true for autoEvaluate so it jumps straight to Results & Export if reference file exists
      onSetComparisonWb(parsed, true);
      if (!referenceWb) {
        onShowToast(t.filesLoadedNeedsRef.replace('{name}', parsed.name).replace('{rows}', parsed.rows.length.toLocaleString()), 'info');
      }
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 2-Column Split: Reference File vs Incoming Comparison File */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Reference Workbook (Main File) */}
        <div className="flex flex-col bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/90 flex items-center justify-center text-brand-600 shadow-xs shrink-0">
                <Database className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t.referenceFile}</h3>
                <p className="text-xs text-slate-500">{t.filesMasterBaseline}</p>
              </div>
            </div>

            {referenceWb && !loadingRef && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.savedLocally}
              </span>
            )}
          </div>

          {loadingRef ? (
            /* Progress State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-700">
                  {refProgress?.text || t.filesProcessing}
                </div>
                <div className="w-52 bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden mx-auto">
                  <div
                    className="bg-brand-600 h-full transition-all duration-200"
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-900 truncate block">
                          {referenceWb.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          {t.totalRows}: <strong className="text-slate-900 font-mono tabular-nums">{referenceWb.rows.length.toLocaleString()}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>
                          {t.totalCols}: <strong className="text-slate-900 font-mono tabular-nums">{referenceWb.headers.length}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{formatFileSize(referenceWb.size)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {t.lastUpdated}: {formatDate(referenceWb.lastModified)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Sheet Selection for Main File */}
                {referenceWb.sheetNames && referenceWb.sheetNames.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Layers className="w-4 h-4 text-brand-600" />
                        <span>{t.filesSelectMainSheet}</span>
                        {referenceWb.sheetNames.length > 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand-50 text-brand-700 font-bold border border-brand-200">
                            {t.filesSheetsCount.replace('{count}', String(referenceWb.sheetNames.length))}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {t.filesActiveSheetLabel} <strong className="text-brand-700 font-bold">{referenceWb.activeSheet}</strong>
                      </span>
                    </div>

                    {referenceWb.sheetNames.length > 1 ? (
                      <div className="space-y-2">
                        <select
                          value={referenceWb.activeSheet}
                          onChange={(e) => onSelectReferenceSheet?.(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-all shadow-xs cursor-pointer font-mono"
                          aria-label={t.filesSelectRefSheetAria}
                        >
                          {referenceWb.sheetNames.map((sheet) => {
                            const sheetInfo = referenceWb.sheets?.[sheet];
                            const rCount = sheetInfo ? sheetInfo.rows.length : (sheet === referenceWb.activeSheet ? referenceWb.rows.length : '?');
                            const cCount = sheetInfo ? sheetInfo.headers.length : (sheet === referenceWb.activeSheet ? referenceWb.headers.length : '?');
                            return (
                              <option key={sheet} value={sheet}>
                                {t.filesSheetOption.replace('{sheet}', sheet).replace('{rows}', rCount.toLocaleString()).replace('{cols}', String(cCount))}
                              </option>
                            );
                          })}
                        </select>

                        <div className="flex flex-wrap gap-1.5">
                          {referenceWb.sheetNames.map((sheet) => {
                            const isSelected = sheet === referenceWb.activeSheet;
                            const sheetInfo = referenceWb.sheets?.[sheet];
                            const rCount = sheetInfo ? sheetInfo.rows.length : (sheet === referenceWb.activeSheet ? referenceWb.rows.length : 0);
                            return (
                              <button
                                key={sheet}
                                type="button"
                                onClick={() => onSelectReferenceSheet?.(sheet)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-xs ${
                                  isSelected
                                    ? 'bg-brand-600 text-white font-bold ring-2 ring-brand-600/30'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium'
                                }`}
                              >
                                <span>{sheet}</span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                    isSelected
                                      ? 'bg-brand-700 text-white'
                                      : 'bg-white text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {rCount.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 font-mono">📄 {referenceWb.activeSheet}</span>
                        <span className="text-[11px] text-slate-400">{t.filesSingleSheet}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-700">{t.filesColumnsDetected.replace('{count}', String(referenceWb.headers.length))} </span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    {referenceWb.headers.slice(0, 5).join(', ')}
                    {referenceWb.headers.length > 5 ? t.filesMoreColumns.replace('{count}', String(referenceWb.headers.length - 5)) : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => onPreviewWb(referenceWb, t.referenceFile)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t.previewData}
                </button>

                <button
                  onClick={() => refFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs transition-colors"
                  title={t.replaceFile}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.replaceFile}</span>
                </button>

                <button
                  onClick={() => setShowResetDialog(true)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 shadow-xs transition-colors"
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
                  ? 'border-brand-500 bg-brand-50/40'
                  : 'border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-brand-600 mb-3">
                <Upload className="w-6 h-6 text-brand-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{t.uploadRefPrompt}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{t.dropFileHere}</p>
              <p className="text-[11px] text-slate-400 mt-1">{t.supportedFormats}</p>

              <button
                onClick={() => refFileInputRef.current?.click()}
                disabled={loadingRef}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
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
        <div className="flex flex-col bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/90 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
                <FileUp className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t.incomingFile}</h3>
                <p className="text-xs text-slate-500">{t.filesIncomingDesc}</p>
              </div>
            </div>

            {comparisonWb && !loadingComp && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {t.filesReadyToEvaluate}
              </span>
            )}
          </div>

          {loadingComp ? (
            /* Progress State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-700">
                  {compProgress?.text || t.filesProcessing}
                </div>
                <div className="w-52 bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden mx-auto">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200"
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-900 truncate block">
                          {comparisonWb.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          {t.totalRows}: <strong className="text-slate-900 font-mono tabular-nums">{comparisonWb.rows.length.toLocaleString()}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>
                          {t.totalCols}: <strong className="text-slate-900 font-mono tabular-nums">{comparisonWb.headers.length}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{formatFileSize(comparisonWb.size)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {t.lastUpdated}: {formatDate(comparisonWb.lastModified)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Sheet Selection for Comparison File */}
                {comparisonWb.sheetNames && comparisonWb.sheetNames.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>{t.filesSelectIncomingSheet}</span>
                        {comparisonWb.sheetNames.length > 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            {t.filesSheetsCount.replace('{count}', String(comparisonWb.sheetNames.length))}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {t.filesActiveSheetLabel} <strong className="text-blue-700 font-bold">{comparisonWb.activeSheet}</strong>
                      </span>
                    </div>

                    {comparisonWb.sheetNames.length > 1 ? (
                      <div className="space-y-2">
                        <select
                          value={comparisonWb.activeSheet}
                          onChange={(e) => onSelectComparisonSheet?.(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs cursor-pointer font-mono"
                          aria-label={t.filesSelectCompSheetAria}
                        >
                          {comparisonWb.sheetNames.map((sheet) => {
                            const sheetInfo = comparisonWb.sheets?.[sheet];
                            const rCount = sheetInfo ? sheetInfo.rows.length : (sheet === comparisonWb.activeSheet ? comparisonWb.rows.length : '?');
                            const cCount = sheetInfo ? sheetInfo.headers.length : (sheet === comparisonWb.activeSheet ? comparisonWb.headers.length : '?');
                            return (
                              <option key={sheet} value={sheet}>
                                {t.filesSheetOption.replace('{sheet}', sheet).replace('{rows}', rCount.toLocaleString()).replace('{cols}', String(cCount))}
                              </option>
                            );
                          })}
                        </select>

                        <div className="flex flex-wrap gap-1.5">
                          {comparisonWb.sheetNames.map((sheet) => {
                            const isSelected = sheet === comparisonWb.activeSheet;
                            const sheetInfo = comparisonWb.sheets?.[sheet];
                            const rCount = sheetInfo ? sheetInfo.rows.length : (sheet === comparisonWb.activeSheet ? comparisonWb.rows.length : 0);
                            return (
                              <button
                                key={sheet}
                                type="button"
                                onClick={() => onSelectComparisonSheet?.(sheet)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-xs ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-600/30'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium'
                                }`}
                              >
                                <span>{sheet}</span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                    isSelected
                                      ? 'bg-blue-700 text-white'
                                      : 'bg-white text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {rCount.toLocaleString()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 font-mono">📄 {comparisonWb.activeSheet}</span>
                        <span className="text-[11px] text-slate-400">{t.filesSingleSheet}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-700">{t.filesColumnsDetected.replace('{count}', String(comparisonWb.headers.length))} </span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    {comparisonWb.headers.slice(0, 5).join(', ')}
                    {comparisonWb.headers.length > 5 ? t.filesMoreColumns.replace('{count}', String(comparisonWb.headers.length - 5)) : ''}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => onPreviewWb(comparisonWb, t.incomingFile)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t.previewData}
                </button>

                <button
                  onClick={() => compFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.replaceFile}</span>
                </button>

                <button
                  onClick={() => onSetComparisonWb(null)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 shadow-xs transition-colors"
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
                  ? 'border-blue-500 bg-blue-50/40'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{t.uploadCompPrompt}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{t.dropFileHere}</p>
              <p className="text-[11px] text-slate-400 mt-1">{t.supportedFormats}</p>

              <button
                onClick={() => compFileInputRef.current?.click()}
                disabled={loadingComp}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
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

      {/* Confirmation Dialog for Resetting Reference File */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">{t.confirmReset}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{t.confirmResetDesc}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onSetReferenceWb(null);
                  setShowResetDialog(false);
                  onShowToast(t.toastRefReset, 'info');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
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
