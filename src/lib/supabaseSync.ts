import { getSupabase } from './supabase';
import { saveToIDB, getFromIDB, deleteFromIDB, StorageKeys } from '../utils/storage';
import type {
  ColumnConfigItem,
  ColumnMapping,
  DecisionLayer,
  MatchedRow,
  MatchingStats,
  NormalizationRules,
  SavedDecisionPreset,
  SavedMappingPreset,
  WorkbookData,
  SyncHistoryEntry,
  SyncProgress,
} from '../types';

export interface StoredColumnSettings {
  order: string[];
  visibility: Record<string, { table: boolean; export: boolean }>;
  updatedAt?: number;
}

export interface WorkspaceSettings {
  normalization: NormalizationRules;
  layers: DecisionLayer[];
  mappings: ColumnMapping[];
  holdColumn: string;
  holdValues: string[];
  holdReason: string;
  releasedRowIds: string[];
  mappingPresets?: SavedMappingPreset[];
  decisionPresets?: SavedDecisionPreset[];
  columnConfigs?: StoredColumnSettings;
  updatedAt: number;
}

export interface FullWorkspacePayload {
  referenceWb?: WorkbookData | null;
  comparisonWb?: WorkbookData | null;
  results?: MatchedRow[] | null;
  stats?: MatchingStats | null;
  settings?: WorkspaceSettings | null;
}

// ---------------------------------------------------------------------------
// Progress & State Event Listeners
// ---------------------------------------------------------------------------

let currentProgress: SyncProgress = {
  isSyncing: false,
  progressPercent: 100,
  phase: 'idle',
  title: 'Cloud Synced',
  reason: 'All changes up to date',
};

const progressListeners = new Set<(progress: SyncProgress) => void>();
const historyListeners = new Set<(history: SyncHistoryEntry[]) => void>();

let cachedHistory: SyncHistoryEntry[] | null = null;

export function getCurrentSyncProgress(): SyncProgress {
  return currentProgress;
}

export function updateSyncProgress(update: Partial<SyncProgress>): void {
  currentProgress = { ...currentProgress, ...update };
  progressListeners.forEach((cb) => {
    try {
      cb(currentProgress);
    } catch {}
  });
}

export function subscribeSyncProgress(callback: (progress: SyncProgress) => void): () => void {
  progressListeners.add(callback);
  callback(currentProgress);
  return () => progressListeners.delete(callback);
}

export function subscribeSyncHistory(callback: (history: SyncHistoryEntry[]) => void): () => void {
  historyListeners.add(callback);
  getSyncHistory().then((h) => callback(h));
  return () => historyListeners.delete(callback);
}

function notifyHistoryListeners(history: SyncHistoryEntry[]) {
  historyListeners.forEach((cb) => {
    try {
      cb(history);
    } catch {}
  });
}

// ---------------------------------------------------------------------------
// Sync History Management (IndexedDB + Memory Cache)
// ---------------------------------------------------------------------------

export async function getSyncHistory(): Promise<SyncHistoryEntry[]> {
  if (cachedHistory) return cachedHistory;
  try {
    const stored = await getFromIDB<SyncHistoryEntry[]>(StorageKeys.SYNC_HISTORY);
    cachedHistory = Array.isArray(stored) ? stored : [];
    return cachedHistory;
  } catch {
    cachedHistory = [];
    return cachedHistory;
  }
}

export async function addSyncHistoryEntry(
  entry: Omit<SyncHistoryEntry, 'id'>
): Promise<SyncHistoryEntry> {
  const fullEntry: SyncHistoryEntry = {
    ...entry,
    id: 'sync_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
  };

  const list = await getSyncHistory();
  // Keep the most recent 120 sync history events
  const nextList = [fullEntry, ...list].slice(0, 120);
  cachedHistory = nextList;

  try {
    await saveToIDB(StorageKeys.SYNC_HISTORY, nextList);
  } catch (err) {
    console.warn('Failed to save sync history to storage:', err);
  }

  notifyHistoryListeners(nextList);
  return fullEntry;
}

export async function clearSyncHistory(): Promise<void> {
  cachedHistory = [];
  try {
    await deleteFromIDB(StorageKeys.SYNC_HISTORY);
  } catch {}
  notifyHistoryListeners([]);
}

/** Formats sync history as downloadable CSV audit log */
export function exportSyncHistoryCSV(history: SyncHistoryEntry[]): string {
  const headers = ['ID', 'Date & Time (UTC)', 'Kind', 'Status', 'Reason', 'Title', 'Payload Size', 'Item Count', 'Duration (ms)', 'Error'];
  const rows = history.map((item) => [
    `"${item.id}"`,
    `"${new Date(item.time).toISOString()}"`,
    `"${item.kind}"`,
    `"${item.status}"`,
    `"${(item.reason || '').replace(/"/g, '""')}"`,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    `"${item.size || ''}"`,
    `"${item.itemCount || ''}"`,
    `"${item.durationMs || 0}"`,
    `"${(item.error || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ---------------------------------------------------------------------------
// Payload Size & Item Count Utilities
// ---------------------------------------------------------------------------

export function estimatePayloadDetails(payload: FullWorkspacePayload): {
  sizeFormatted: string;
  itemCount: number;
  byteCount: number;
} {
  let count = 0;
  if (payload.referenceWb?.rows) count += payload.referenceWb.rows.length;
  if (payload.comparisonWb?.rows) count += payload.comparisonWb.rows.length;
  if (payload.results) count += payload.results.length;

  let approxBytes = 0;
  try {
    const str = JSON.stringify(payload);
    approxBytes = new Blob([str]).size;
  } catch {
    approxBytes = 1024;
  }

  const formatted =
    approxBytes < 1024
      ? `${approxBytes} B`
      : approxBytes < 1024 * 1024
      ? `${(approxBytes / 1024).toFixed(1)} KB`
      : `${(approxBytes / (1024 * 1024)).toFixed(2)} MB`;

  return { sizeFormatted: formatted, itemCount: count, byteCount: approxBytes };
}

/** Tiny debounce helper */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number
): ((...args: Args) => void) & { cancel: () => void } {
  let t: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (t) clearTimeout(t);
    t = undefined;
  };
  return debounced;
}

// ---------------------------------------------------------------------------
// Supabase Sync Operations with Live Progress & History Logging
// ---------------------------------------------------------------------------

/**
 * Upsert workspace data into Supabase `workspaces` table with live progress updates.
 */
export async function syncWorkspaceToSupabase(
  userId: string,
  payload: FullWorkspacePayload,
  reason = 'Auto-sync workspace state'
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Supabase client or user not authenticated' };
  }

  const startTime = Date.now();
  const { sizeFormatted, itemCount, byteCount } = estimatePayloadDetails(payload);

  // Determine kind
  let kind: SyncHistoryEntry['kind'] = 'settings';
  let title = 'Workspace Synced';
  if (payload.referenceWb || payload.comparisonWb) {
    kind = 'file';
    title = payload.referenceWb && payload.comparisonWb ? 'Both Workbooks Synced' : payload.referenceWb ? 'Reference Workbook' : 'Comparison Workbook';
  } else if (payload.results) {
    kind = 'results';
    title = 'Matching Results Synced';
  } else if (payload.settings) {
    kind = 'settings';
    title = 'Decision Settings Synced';
  }

  // 1. Preparing Phase
  updateSyncProgress({
    isSyncing: true,
    progressPercent: 20,
    phase: 'preparing',
    title: `Preparing ${title}...`,
    reason,
    startedAt: startTime,
    totalBytes: byteCount,
    bytesUploaded: 0,
    error: undefined,
  });

  try {
    const updatePayload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (payload.referenceWb !== undefined) updatePayload.reference_wb = payload.referenceWb;
    if (payload.comparisonWb !== undefined) updatePayload.comparison_wb = payload.comparisonWb;
    if (payload.results !== undefined) updatePayload.results = payload.results;
    if (payload.stats !== undefined) updatePayload.stats = payload.stats;
    if (payload.settings !== undefined) updatePayload.settings = payload.settings;

    // 2. Uploading Phase
    updateSyncProgress({
      progressPercent: 65,
      phase: 'uploading',
      title: `Uploading to Supabase (${sizeFormatted})...`,
      bytesUploaded: Math.round(byteCount * 0.65),
    });

    const { error } = await client
      .from('workspaces')
      .upsert(updatePayload, { onConflict: 'user_id' });

    // 3. Verifying Phase
    updateSyncProgress({
      progressPercent: 90,
      phase: 'verifying',
      title: 'Verifying Cloud Storage...',
      bytesUploaded: byteCount,
    });

    const durationMs = Date.now() - startTime;

    if (error) {
      console.warn('Supabase workspace sync error:', error);
      updateSyncProgress({
        isSyncing: false,
        progressPercent: 100,
        phase: 'error',
        title: 'Sync Warning',
        reason: error.message,
        error: error.message,
      });

      await addSyncHistoryEntry({
        time: startTime,
        kind,
        title,
        reason,
        status: 'failed',
        size: sizeFormatted,
        itemCount,
        durationMs,
        error: error.message,
        target: 'supabase',
      });

      return { success: false, error: error.message };
    }

    // 4. Completed Phase
    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'completed',
      title: 'Cloud Synced',
      reason,
      error: undefined,
    });

    await addSyncHistoryEntry({
      time: startTime,
      kind,
      title,
      reason,
      status: 'done',
      size: sizeFormatted,
      itemCount,
      durationMs,
      target: 'supabase',
    });

    return { success: true };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = err?.message || 'Sync failed';
    console.warn('Failed to sync to Supabase:', err);

    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'error',
      title: 'Sync Failed',
      reason: errMsg,
      error: errMsg,
    });

    await addSyncHistoryEntry({
      time: startTime,
      kind,
      title,
      reason,
      status: 'failed',
      size: sizeFormatted,
      itemCount,
      durationMs,
      error: errMsg,
      target: 'supabase',
    });

    return { success: false, error: errMsg };
  }
}

/**
 * Fetch the entire user workspace from Supabase with progress and history logging.
 */
export async function fetchWorkspaceFromSupabase(
  userId: string,
  reason = 'Restore workspace from cloud'
): Promise<{ success: boolean; data?: FullWorkspacePayload; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Supabase client or user not authenticated' };
  }

  const startTime = Date.now();
  updateSyncProgress({
    isSyncing: true,
    progressPercent: 30,
    phase: 'uploading',
    title: 'Connecting to Supabase...',
    reason,
    startedAt: startTime,
  });

  try {
    const { data, error } = await client
      .from('workspaces')
      .select('reference_wb, comparison_wb, results, stats, settings, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    const durationMs = Date.now() - startTime;

    if (error) {
      console.warn('Supabase fetch workspace error:', error);
      updateSyncProgress({
        isSyncing: false,
        progressPercent: 100,
        phase: 'error',
        title: 'Fetch Warning',
        reason: error.message,
        error: error.message,
      });

      await addSyncHistoryEntry({
        time: startTime,
        kind: 'pull',
        title: 'Cloud Pull Failed',
        reason,
        status: 'failed',
        durationMs,
        error: error.message,
        target: 'supabase',
      });

      return { success: false, error: error.message };
    }

    if (!data) {
      updateSyncProgress({
        isSyncing: false,
        progressPercent: 100,
        phase: 'completed',
        title: 'Workspace Initialized',
        reason: 'No remote workspace found. Fresh session ready.',
      });
      return { success: true, data: undefined };
    }

    const payload: FullWorkspacePayload = {
      referenceWb: data.reference_wb,
      comparisonWb: data.comparison_wb,
      results: data.results,
      stats: data.stats,
      settings: data.settings,
    };

    const { sizeFormatted, itemCount } = estimatePayloadDetails(payload);

    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'completed',
      title: 'Cloud Workspace Pulled',
      reason,
    });

    await addSyncHistoryEntry({
      time: startTime,
      kind: 'pull',
      title: 'Cloud Workspace Pulled',
      reason: `${reason} (${itemCount.toLocaleString()} total items)`,
      status: 'done',
      size: sizeFormatted,
      itemCount,
      durationMs,
      target: 'supabase',
    });

    return { success: true, data: payload };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = err?.message || 'Failed to fetch from Supabase';

    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'error',
      title: 'Cloud Pull Failed',
      reason: errMsg,
      error: errMsg,
    });

    await addSyncHistoryEntry({
      time: startTime,
      kind: 'pull',
      title: 'Cloud Pull Failed',
      reason,
      status: 'failed',
      durationMs,
      error: errMsg,
      target: 'supabase',
    });

    return { success: false, error: errMsg };
  }
}

/**
 * Sync only settings (rules, mappings, layers, column configs) to Supabase.
 */
export async function syncSettingsToSupabase(
  userId: string,
  settings: WorkspaceSettings,
  reason = 'Saved decision & mapping rules'
): Promise<{ success: boolean; error?: string }> {
  return syncWorkspaceToSupabase(userId, { settings }, reason);
}

/**
 * Delete / reset cloud workspace in Supabase.
 */
export async function wipeSupabaseWorkspace(
  userId: string,
  reason = 'Reset workspace to original stage'
): Promise<boolean> {
  const client = getSupabase();
  if (!client || !userId) return false;
  const startTime = Date.now();

  try {
    const { error } = await client
      .from('workspaces')
      .delete()
      .eq('user_id', userId);

    const durationMs = Date.now() - startTime;

    await addSyncHistoryEntry({
      time: startTime,
      kind: 'wipe',
      title: 'Cloud Workspace Reset',
      reason,
      status: !error ? 'done' : 'failed',
      durationMs,
      error: error?.message,
      target: 'supabase',
    });

    return !error;
  } catch {
    return false;
  }
}
