import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Database,
  FileSpreadsheet,
  Settings2,
  TableProperties,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';
import {
  getSyncHistory,
  clearSyncHistory,
  exportSyncHistoryCSV,
  subscribeSyncHistory,
  subscribeSyncProgress,
  getCurrentSyncProgress,
} from '../lib/supabaseSync';
import { DEFAULT_SUPABASE_URL } from '../lib/supabase';
import type { SyncHistoryEntry, SyncProgress } from '../types';
import { RippleButton } from './RippleButton';

interface SyncHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerManualSync?: () => Promise<void>;
  onTriggerManualPull?: () => Promise<void>;
  isSupabaseConnected: boolean;
  onOpenSupabaseConfig?: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SyncHistoryModal: React.FC<SyncHistoryModalProps> = ({
  isOpen,
  onClose,
  onTriggerManualSync,
  onTriggerManualPull,
  isSupabaseConnected,
  onOpenSupabaseConfig,
  onShowToast,
}) => {
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [progress, setProgress] = useState<SyncProgress>(getCurrentSyncProgress);
  const [activeTab, setActiveTab] = useState<'all' | 'file' | 'settings' | 'results' | 'pull' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getSyncHistory().then((h) => setHistory(h));
    }
  }, [isOpen]);

  useEffect(() => {
    return subscribeSyncHistory((h) => {
      setHistory(h);
    });
  }, []);

  useEffect(() => {
    return subscribeSyncProgress((p) => {
      setProgress(p);
    });
  }, []);

  const counts = useMemo(() => {
    return {
      all: history.length,
      file: history.filter((e) => e.kind === 'file').length,
      settings: history.filter((e) => e.kind === 'settings').length,
      results: history.filter((e) => e.kind === 'results').length,
      pull: history.filter((e) => e.kind === 'pull').length,
      error: history.filter((e) => e.status === 'failed').length,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Tab filter
      if (activeTab === 'file' && item.kind !== 'file') return false;
      if (activeTab === 'settings' && item.kind !== 'settings') return false;
      if (activeTab === 'results' && item.kind !== 'results') return false;
      if (activeTab === 'pull' && item.kind !== 'pull') return false;
      if (activeTab === 'error' && item.status !== 'failed') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchReason = (item.reason || '').toLowerCase().includes(q);
        const matchError = (item.error || '').toLowerCase().includes(q);
        return matchTitle || matchReason || matchError;
      }
      return true;
    });
  }, [history, activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    if (!onTriggerManualSync) return;
    setIsActionRunning(true);
    try {
      await onTriggerManualSync();
      onShowToast('Cloud sync completed successfully!', 'success');
    } catch (err: any) {
      onShowToast(err?.message || 'Manual sync failed', 'error');
    } finally {
      setIsActionRunning(false);
    }
  };

  const handleManualPull = async () => {
    if (!onTriggerManualPull) return;
    setIsActionRunning(true);
    try {
      await onTriggerManualPull();
      onShowToast('Workspace restored from Supabase!', 'success');
    } catch (err: any) {
      onShowToast(err?.message || 'Manual pull failed', 'error');
    } finally {
      setIsActionRunning(false);
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) {
      onShowToast('No sync history to export yet.', 'info');
      return;
    }
    const csv = exportSyncHistoryCSV(history);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excelmatch_sync_history_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Sync history exported to CSV!', 'success');
  };

  const handleClear = async () => {
    await clearSyncHistory();
    onShowToast('Sync history cleared.', 'info');
  };

  const lastSuccessfulEntry = history.find((e) => e.status === 'done');

  const formatRelativeTime = (time: number) => {
    const diffSec = Math.floor((Date.now() - time) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const formatExactDateTime = (time: number) => {
    const d = new Date(time);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getKindIcon = (kind: SyncHistoryEntry['kind']) => {
    switch (kind) {
      case 'file':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'settings':
        return <Settings2 className="w-4 h-4 text-indigo-500" />;
      case 'results':
        return <TableProperties className="w-4 h-4 text-blue-500" />;
      case 'pull':
        return <ArrowDownCircle className="w-4 h-4 text-purple-500" />;
      case 'wipe':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <Cloud className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                  Upload & Sync History
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit log of all uploaded workbooks, decision rules, date/timestamps, and triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Progress Banner (if syncing right now) */}
          {progress.isSyncing && (
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    {progress.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {progress.progressPercent}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-indigo-200/70 dark:bg-indigo-900/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-indigo-800 dark:text-indigo-300">
                <span className="truncate">Reason: {progress.reason}</span>
                {progress.totalBytes ? (
                  <span className="font-mono font-medium shrink-0 ml-2">
                    {(progress.bytesUploaded || 0) < 1024
                      ? `${progress.bytesUploaded} B`
                      : `${((progress.bytesUploaded || 0) / 1024).toFixed(0)} KB`}{' '}
                    / {(progress.totalBytes / 1024).toFixed(0)} KB
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Last Synced</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {lastSuccessfulEntry ? formatRelativeTime(lastSuccessfulEntry.time) : 'Never'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate" title={lastSuccessfulEntry ? formatExactDateTime(lastSuccessfulEntry.time) : ''}>
                  {lastSuccessfulEntry ? formatExactDateTime(lastSuccessfulEntry.time) : 'No uploads yet'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <ArrowUpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Total Uploads</span>
              </div>
              <div className="mt-2">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {counts.all}
                </div>
                <div className="text-[10px] text-slate-400">
                  {counts.error > 0 ? `${counts.error} failed` : 'All operations ok'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span>Cloud Database</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  Supabase PostgreSQL
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate" title="xopzbzpfpnuhkjxokuyj.supabase.co">
                  xopzbzpfpnuhkjxokuyj
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sync Status</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </div>
                <div className="text-[10px] text-slate-400">
                  Auto-sync debounced (2s)
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              {onTriggerManualSync && (
                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={handleManualSync}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isActionRunning ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
              )}

              {onTriggerManualPull && (
                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={handleManualPull}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5 text-purple-500" />
                  Pull from Cloud
                </button>
              )}

              {onOpenSupabaseConfig && (
                <button
                  type="button"
                  onClick={onOpenSupabaseConfig}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Settings
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                title="Download CSV log"
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Export CSV
              </button>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear history log"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'file'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Workbooks ({counts.file})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Rules ({counts.settings})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'results'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Results ({counts.results})
              </button>
              {counts.error > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('error')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'error'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-2xs'
                      : 'text-rose-500 hover:text-rose-600'
                  }`}
                >
                  Errors ({counts.error})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reason, title, error..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* History Event Feed */}
          <div className="space-y-2.5">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <Cloud className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? 'No matching sync records found' : 'No sync checkpoints recorded yet'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When you upload files, modify decision rules, or run matching, uploads will appear here automatically.
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isSuccess = item.status === 'done';
                const isFailed = item.status === 'failed';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-indigo-500/10 text-indigo-600'
                        }`}
                      >
                        {getKindIcon(item.kind)}
                      </div>

                      {/* Info & Reason */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              isSuccess
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : isFailed
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {isSuccess ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                            {isSuccess ? 'Uploaded' : isFailed ? 'Failed' : 'In Progress'}
                          </span>
                        </div>

                        {/* Reason string */}
                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 leading-relaxed">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Reason:</span>
                          <span className="truncate">{item.reason || 'Workspace state update'}</span>
                        </div>

                        {/* Error info if failed */}
                        {item.error && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 px-2 py-1 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                            <strong>Error:</strong> {item.error}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta: Date/Time, Payload, Duration */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                      {/* Date & Time */}
                      <div className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span title={formatExactDateTime(item.time)}>
                          {formatExactDateTime(item.time)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({formatRelativeTime(item.time)})
                        </span>
                      </div>

                      {/* Size, rows, duration tags */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {item.size && (
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {item.size}
                          </span>
                        )}
                        {item.itemCount !== undefined && item.itemCount > 0 && (
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {item.itemCount.toLocaleString()} items
                          </span>
                        )}
                        {item.durationMs !== undefined && (
                          <span className="text-slate-400 font-mono">
                            {item.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target: <strong className="text-slate-700 dark:text-slate-300">workspaces</strong> table on Supabase</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
