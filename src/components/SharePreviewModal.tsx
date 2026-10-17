import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Language, MatchedRow, MatchingStats, ColumnConfigItem } from '../types';
import { generatePreviewLink, exportStandalonePreviewHtml } from '../utils/previewSharing';
import { translations } from '../translations';

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MatchedRow[];
  stats: MatchingStats;
  comparisonWbName: string;
  activeFilter: 'all' | 'green' | 'yellow' | 'red' | 'blue' | 'unmatched';
  searchTerm: string;
  searchColumn: string;
  columnConfigs?: ColumnConfigItem[];
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  language?: Language;
  onlyAccept?: boolean;
}

export const SharePreviewModal: React.FC<SharePreviewModalProps> = ({
  isOpen,
  onClose,
  results,
  stats,
  comparisonWbName,
  activeFilter,
  searchTerm,
  searchColumn,
  columnConfigs,
  onShowToast,
  language = 'en',
  onlyAccept = true,
}) => {
  const t = translations[language];
  const [includeFilter, setIncludeFilter] = useState(true);
  const [includeSearch, setIncludeSearch] = useState(Boolean(searchTerm.trim()));
  const [copied, setCopied] = useState(false);

  // Generate the shareable link based on user options
  const { url, isHashTooLong, charCount } = useMemo(() => {
    if (!isOpen) return { url: '', isHashTooLong: false, charCount: 0 };

    return generatePreviewLink({
      version: 1,
      createdAt: Date.now(),
      comparisonWbName,
      stats,
      results,
      filter: includeFilter ? activeFilter : 'all',
      onlyAccept,
      searchTerm: includeSearch ? searchTerm : '',
      searchColumn: includeSearch ? searchColumn : 'all',
      columnConfigs,
    });
  }, [
    isOpen,
    comparisonWbName,
    stats,
    results,
    includeFilter,
    columnConfigs,
    activeFilter,
    includeSearch,
    searchTerm,
    searchColumn,
  ]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onShowToast(t.shareCopiedToast, 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast(t.shareCopyFailToast, 'error');
    }
  };

  const handleOpenPreview = () => {
    window.location.href = url;
  };

  const filterLabels: Record<string, { label: string; colorClass: string }> = {
    all: { label: t.shareFilterAll, colorClass: 'text-slate-700 font-semibold' },
    green: { label: t.shareFilterGreen, colorClass: 'text-emerald-700 font-bold' },
    yellow: { label: t.shareFilterYellow, colorClass: 'text-amber-700 font-bold' },
    red: { label: t.shareFilterRed, colorClass: 'text-rose-700 font-bold' },
    blue: { label: t.shareFilterBlue, colorClass: 'text-blue-700 font-bold' },
    unmatched: { label: t.shareFilterUnmatched, colorClass: 'text-violet-700 font-bold' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {t.shareTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.shareDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-white">
          {/* Feature Highlights */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.shareWhatSee}</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside leading-relaxed">
              <li>{t.shareBullet1}</li>
              <li>{t.shareBullet2}</li>
              <li>{t.shareBullet3}</li>
            </ul>
          </div>

          {/* Filter Sharing Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700">
              {t.shareFilterConfig}
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeFilter}
                  onChange={(e) => setIncludeFilter(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs text-slate-700">
                  <span>{t.sharePreselectFilter} </span>
                  <span className={filterLabels[activeFilter]?.colorClass}>
                    {filterLabels[activeFilter]?.label}
                  </span>
                </div>
              </label>

              {searchTerm.trim() && (
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSearch}
                    onChange={(e) => setIncludeSearch(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-slate-700">
                    <span>{t.shareIncludeSearch} </span>
                    <span className="font-mono text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 font-bold">
                      "{searchTerm}"
                    </span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {t.shareLinkLabel}
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {charCount.toLocaleString()} {t.shareChars}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono selection:bg-emerald-600 selection:text-white truncate focus:outline-none focus:border-emerald-500 shadow-xs"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.shareCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.shareCopyLink}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                {t.shareCompressedNote}
              </span>
              <button
                type="button"
                onClick={() => {
                  exportStandalonePreviewHtml({
                    version: 2,
                    createdAt: Date.now(),
                    comparisonWbName,
                    stats,
                    results,
                    filter: includeFilter ? activeFilter : 'all',
                    onlyAccept,
                    searchTerm: includeSearch ? searchTerm : '',
                    searchColumn: includeSearch ? searchColumn : 'all',
                    columnConfigs,
                  });
                  onShowToast(t.shareHtmlToast, 'success');
                }}
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
                title="Download single-file interactive preview HTML"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.shareDownloadHtml}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t.close}
          </button>

          <button
            onClick={handleOpenPreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.shareTestNow}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
