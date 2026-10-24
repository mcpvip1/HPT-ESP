import React from 'react';
import {
  X,
  CloudUpload,
  CheckCircle2,
  FileUp,
  SlidersHorizontal,
  Table2,
  Trash2,
} from 'lucide-react';
import type { Language, SyncHistoryEntry, ActiveUpload } from '../types';
import { translations } from '../translations';
import { ProgressRing } from './ProgressRing';

interface SyncHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  activeUpload: ActiveUpload | null;
  history: SyncHistoryEntry[];
  onClearHistory: () => void;
}

const kindIcon = (kind: SyncHistoryEntry['kind']) => {
  if (kind === 'file') return <FileUp className="w-4 h-4 text-sky-600 shrink-0" />;
  if (kind === 'settings') return <SlidersHorizontal className="w-4 h-4 text-violet-600 shrink-0" />;
  return <Table2 className="w-4 h-4 text-emerald-600 shrink-0" />;
};

export const SyncHistoryModal: React.FC<SyncHistoryModalProps> = ({
  isOpen,
  onClose,
  language,
  activeUpload,
  history,
  onClearHistory,
}) => {
  const t = translations[language];
  if (!isOpen) return null;

  const lastSync = history.length > 0 ? history[0].time : null;
  const pct =
    activeUpload && activeUpload.total > 0
      ? Math.round((activeUpload.done / activeUpload.total) * 100)
      : null;

  return (
    <div
      className="bulk-backdrop flex items-start justify-center p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="bulk-modal !max-w-md !p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
              <CloudUpload className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.syncPanelTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload manager: live progress */}
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-soft)]">
          {activeUpload ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProgressRing pct={pct} size={56} strokeWidth={5} />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--text-primary)] tabular-nums">
                    {pct !== null ? `${pct}%` : '…'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{t.syncUploading}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate" title={activeUpload.fileName}>
                    {activeUpload.fileName}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                    {activeUpload.total > 1
                      ? `Chunk ${activeUpload.done} of ${activeUpload.total} (${pct ?? 0}%)`
                      : pct !== null
                      ? `${pct}% uploaded`
                      : activeUpload.label}
                  </p>
                </div>
              </div>
              {/* Linear bar */}
              <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-sky-500 transition-all duration-300 ${
                    pct === null ? 'animate-pulse w-1/3' : ''
                  }`}
                  style={pct !== null ? { width: `${pct}%` } : undefined}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">{t.syncAllSynced}</p>
                {lastSync && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(lastSync).toLocaleString(language)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="px-5 py-4 bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide font-mono">{t.syncHistory}</p>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--danger-soft)] rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                {t.syncClearHistory}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">{t.syncNoHistory}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-[var(--border-light)] -mx-1 px-1">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-2.5">
                  {kindIcon(entry.kind)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{entry.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {new Date(entry.time).toLocaleString(language)}
                    </p>
                  </div>
                  {entry.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
