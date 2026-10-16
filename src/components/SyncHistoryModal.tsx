import React from 'react';
import {
  X,
  CloudUpload,
  CheckCircle2,
  FileUp,
  SlidersHorizontal,
  Table2,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { Language, SyncHistoryEntry } from '../types';
import { translations } from '../translations';

interface SyncHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  isUploading: boolean;
  uploadLabel: string;
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
  isUploading,
  uploadLabel,
  history,
  onClearHistory,
}) => {
  const t = translations[language];
  if (!isOpen) return null;

  const lastSync = history.length > 0 ? history[0].time : null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <CloudUpload className="w-5 h-5 text-sky-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t.syncPanelTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          {isUploading ? (
            <div className="flex items-center gap-3">
              <CloudUpload className="w-6 h-6 text-sky-600 animate-bounce shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{t.syncUploading}</p>
                {uploadLabel && <p className="text-xs text-slate-500 truncate">{uploadLabel}</p>}
              </div>
              <Loader2 className="w-4 h-4 text-sky-500 animate-spin ml-auto shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{t.syncAllSynced}</p>
                {lastSync && (
                  <p className="text-xs text-slate-500">
                    {new Date(lastSync).toLocaleString(language)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.syncHistory}</p>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                {t.syncClearHistory}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">{t.syncNoHistory}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 -mx-1 px-1">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-2.5">
                  {kindIcon(entry.kind)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{entry.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(entry.time).toLocaleString(language)}
                    </p>
                  </div>
                  {entry.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 shrink-0" />
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
