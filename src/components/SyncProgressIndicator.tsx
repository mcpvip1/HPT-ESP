import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudAlert,
  Loader2,
  Clock,
  ArrowUpCircle,
  Database,
} from 'lucide-react';
import {
  subscribeSyncProgress,
  getCurrentSyncProgress,
  getSyncHistory,
  subscribeSyncHistory,
} from '../lib/supabaseSync';
import type { SyncProgress, SyncHistoryEntry } from '../types';

interface SyncProgressIndicatorProps {
  onOpenHistory: () => void;
  isSupabaseConnected: boolean;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({
  onOpenHistory,
  isSupabaseConnected,
}) => {
  const [progress, setProgress] = useState<SyncProgress>(getCurrentSyncProgress);
  const [lastEntry, setLastEntry] = useState<SyncHistoryEntry | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('Never');

  useEffect(() => {
    return subscribeSyncProgress((p) => {
      setProgress(p);
    });
  }, []);

  useEffect(() => {
    return subscribeSyncHistory((history) => {
      if (history && history.length > 0) {
        setLastEntry(history[0]);
      } else {
        setLastEntry(null);
      }
    });
  }, []);

  // Update relative time string every 15 seconds
  useEffect(() => {
    const updateRelativeTime = () => {
      if (!lastEntry?.time) {
        setTimeAgo('No sync yet');
        return;
      }
      const diffSec = Math.floor((Date.now() - lastEntry.time) / 1000);
      if (diffSec < 15) {
        setTimeAgo('Just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        const m = Math.floor(diffSec / 60);
        setTimeAgo(`${m}m ago`);
      } else if (diffSec < 86400) {
        const h = Math.floor(diffSec / 3600);
        setTimeAgo(`${h}h ago`);
      } else {
        const d = Math.floor(diffSec / 86400);
        setTimeAgo(`${d}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 15000);
    return () => clearInterval(interval);
  }, [lastEntry?.time]);

  if (!isSupabaseConnected) {
    return (
      <button
        type="button"
        onClick={onOpenHistory}
        title="Sync History (Local Mode)"
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden lg:inline text-[11px]">Sync History</span>
      </button>
    );
  }

  // Active Syncing State
  if (progress.isSyncing) {
    return (
      <button
        type="button"
        onClick={onOpenHistory}
        title={`Sync in progress: ${progress.reason} (${progress.progressPercent}%) - Click for details`}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold border border-indigo-300 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs hover:bg-indigo-100/90 transition-all cursor-pointer animate-pulse"
      >
        <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
        <span className="truncate max-w-[130px] sm:max-w-[180px] text-[11px] font-medium">
          {progress.title}
        </span>
        <span className="text-[10px] font-mono font-bold bg-indigo-200/70 dark:bg-indigo-900/80 px-1.5 py-0.5 rounded-md text-indigo-800 dark:text-indigo-200">
          {progress.progressPercent}%
        </span>
      </button>
    );
  }

  // Error State
  if (progress.phase === 'error' || (lastEntry && lastEntry.status === 'failed')) {
    return (
      <button
        type="button"
        onClick={onOpenHistory}
        title={`Sync Warning: ${progress.reason || lastEntry?.error || 'Check details'} - Click to view history`}
        className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100/80 transition-all cursor-pointer"
      >
        <CloudAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="hidden sm:inline text-[11px]">Sync Warning</span>
        <span className="sm:hidden text-[10px]">Warning</span>
      </button>
    );
  }

  // Idle / Synced State
  const formattedFullDate = lastEntry?.time
    ? new Date(lastEntry.time).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'No sync recorded yet';

  return (
    <button
      type="button"
      onClick={onOpenHistory}
      title={`Last Cloud Sync: ${formattedFullDate}\nReason: ${lastEntry?.reason || 'Initial state'}\nClick to view full upload history`}
      className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 transition-all cursor-pointer group"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span className="hidden md:inline text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
        Synced
      </span>
      <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">
        {timeAgo}
      </span>
    </button>
  );
};
