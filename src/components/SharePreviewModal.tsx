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
    <div className="bulk-backdrop flex items-center justify-center p-4">
      <div className="bulk-modal !max-w-lg !w-full flex flex-col overflow-hidden !p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                {t.shareTitle}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t.shareDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-[var(--bg-surface)]">
          {/* Feature Highlights */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] space-y-2">
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.shareWhatSee}</span>
            </div>
            <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 list-disc list-inside leading-relaxed">
              <li>{t.shareBullet1}</li>
              <li>{t.shareBullet2}</li>
              <li>{t.shareBullet3}</li>
            </ul>
          </div>

          {/* Filter Sharing Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">
              {t.shareFilterConfig}
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border)] hover:border-emerald-500 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeFilter}
                  onChange={(e) => setIncludeFilter(e.target.checked)}
                  className="rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs text-[var(--text-secondary)]">
                  <span>{t.sharePreselectFilter} </span>
                  <span className={filterLabels[activeFilter]?.colorClass}>
                    {filterLabels[activeFilter]?.label}
                  </span>
                </div>
              </label>

              {searchTerm.trim() && (
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border)] hover:border-emerald-500 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSearch}
                    onChange={(e) => setIncludeSearch(e.target.checked)}
                    className="rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-[var(--text-secondary)]">
                    <span>{t.shareIncludeSearch} </span>
                    <span className="font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-bold">
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
              <label className="text-xs font-bold text-[var(--text-primary)]">
                {t.shareLinkLabel}
              </label>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {charCount.toLocaleString()} {t.shareChars}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] font-mono selection:bg-emerald-600 selection:text-white truncate focus:outline-none focus:border-emerald-500 shadow-xs"
              />
              <button
                onClick={handleCopy}
                className="tbtn tbtn--upload !h-9 !px-3.5 cursor-pointer"
              >
                <span className="tbtn__icon">
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </span>
                <span>{copied ? t.shareCopied : t.shareCopyLink}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
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
                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:opacity-80 font-semibold transition-colors cursor-pointer"
                title="Download single-file interactive preview HTML"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.shareDownloadHtml}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="tbtn tbtn--neutral !h-9 !px-3.5 cursor-pointer"
          >
            {t.close}
          </button>

          <button
            onClick={handleOpenPreview}
            className="tbtn tbtn--primary !h-9 !px-4 cursor-pointer"
          >
            <span className="tbtn__icon">
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
            <span>{t.shareTestNow}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
