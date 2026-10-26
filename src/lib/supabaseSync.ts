import { getSupabase } from './supabase';
import LZString from 'lz-string';
import {
  saveToIDB,
  getFromIDB,
  deleteFromIDB,
  StorageKeys,
  defaultNormalizationRules,
  defaultDecisionLayers,
} from '../utils/storage';
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
// Workbook compression (fixes "TypeError: Failed to fetch" on large uploads)
// ---------------------------------------------------------------------------
//
// The Main workbook serializes to ~16 MB of JSON. Sending that as one
// PostgREST upsert dies in transit on slow/mobile connections (the browser
// never receives a response, hence "Failed to fetch" with no HTTP code).
// Workbooks are therefore compressed with lz-string (base64, JSON-safe) when
// it actually shrinks them: 16.02 MB -> 1.27 MB on the real Main file.
// Small payloads are left untouched, and old plain (uncompressed) rows keep
// loading because decompression passes anything unmarked straight through.

/** Marker wrapper stored in the jsonb column when a workbook is compressed. */
interface CompressedWorkbook {
  __hptCompressed: true;
  algo: 'lz-base64';
  /** Base64-compressed JSON of the WorkbookData. */
  data: string;
  /** Original uncompressed JSON byte size (for display/diagnostics). */
  originalBytes: number;
}

function isCompressedWorkbook(value: unknown): value is CompressedWorkbook {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as CompressedWorkbook).__hptCompressed === true &&
    (value as CompressedWorkbook).algo === 'lz-base64' &&
    typeof (value as CompressedWorkbook).data === 'string'
  );
}

/** Below this JSON size compression is not worth its CPU cost. */
const COMPRESSION_THRESHOLD_BYTES = 256 * 1024;

/**
 * Compress a workbook for the wire. Returns the original value when the
 * payload is small or compression does not shrink it.
 */
export function compressWorkbookForSync(wb: WorkbookData): WorkbookData | CompressedWorkbook {
  let json: string;
  try {
    json = JSON.stringify(wb);
  } catch {
    return wb;
  }
  if (json.length < COMPRESSION_THRESHOLD_BYTES) return wb;
  try {
    const compressed = LZString.compressToBase64(json);
    if (!compressed || compressed.length >= json.length) return wb;
    return {
      __hptCompressed: true,
      algo: 'lz-base64',
      data: compressed,
      originalBytes: new Blob([json]).size,
    };
  } catch {
    return wb;
  }
}

/**
 * Restore a workbook read from Supabase. Plain (legacy) values pass through
 * untouched; a corrupt compressed value yields null instead of crashing the
 * pull, so the app can continue with its local copy.
 */
export function decompressWorkbookFromSync(value: unknown): WorkbookData | null | undefined {
  if (value === null || value === undefined) return value as null | undefined;
  if (!isCompressedWorkbook(value)) return value as WorkbookData;
  try {
    const json = LZString.decompressFromBase64(value.data);
    if (!json) return null;
    return JSON.parse(json) as WorkbookData;
  } catch {
    return null;
  }
}

/** True for browser/network failures where no HTTP response arrived. */
function isNetworkError(err: unknown): boolean {
  const msg = String((err as { message?: unknown })?.message ?? err ?? '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  );
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
  // Item count and the preparing-phase total come from the original
  // payload; the uploading/history size is the WIRE size (after
  // compression). Declared here (not inside try) because the catch block
  // also reports them.
  const { itemCount, byteCount: estimatedBytes } = estimatePayloadDetails(payload);
  let byteCount = 0;
  let sizeFormatted = '0 B';

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
    totalBytes: estimatedBytes,
    bytesUploaded: 0,
    error: undefined,
  });

  try {
    // Compress workbooks for the wire (null = workbook removed, passes through).
    const updatePayload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (payload.referenceWb !== undefined) {
      updatePayload.reference_wb =
        payload.referenceWb === null ? null : compressWorkbookForSync(payload.referenceWb);
    }
    if (payload.comparisonWb !== undefined) {
      updatePayload.comparison_wb =
        payload.comparisonWb === null ? null : compressWorkbookForSync(payload.comparisonWb);
    }
    if (payload.results !== undefined) updatePayload.results = payload.results;
    if (payload.stats !== undefined) updatePayload.stats = payload.stats;
    if (payload.settings !== undefined) updatePayload.settings = payload.settings;

    // Wire size (after compression) is what the progress UI and history show.
    try {
      byteCount = new Blob([JSON.stringify(updatePayload)]).size;
    } catch {
      byteCount = 0;
    }
    sizeFormatted =
      byteCount < 1024
        ? `${byteCount} B`
        : byteCount < 1024 * 1024
        ? `${(byteCount / 1024).toFixed(1)} KB`
        : `${(byteCount / (1024 * 1024)).toFixed(2)} MB`;

    // 2. Uploading Phase
    updateSyncProgress({
      progressPercent: 65,
      phase: 'uploading',
      title: `Uploading to Supabase (${sizeFormatted})...`,
      bytesUploaded: Math.round(byteCount * 0.65),
    });

    // One retry for network failures only ("Failed to fetch" = no response
    // arrived). Server errors (RLS, validation, ...) are NOT retried.
    let upsertError: { message?: string } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await client
          .from('workspaces')
          .upsert(updatePayload, { onConflict: 'user_id' });
        if (!error) {
          upsertError = null;
          break;
        }
        upsertError = error;
      } catch (thrown: any) {
        upsertError = thrown;
      }
      if (!isNetworkError(upsertError) || attempt === 1) break;
      updateSyncProgress({
        progressPercent: 65,
        phase: 'uploading',
        title: 'Connection interrupted — retrying upload...',
        bytesUploaded: Math.round(byteCount * 0.65),
      });
      await new Promise((r) => setTimeout(r, 2000));
    }
    // A network failure that survived the retry goes to the outer catch so
    // it is recorded in history exactly like any other sync failure.
    if (upsertError && isNetworkError(upsertError)) throw upsertError;
    const error = upsertError;

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

    // New rows store workbooks compressed; legacy rows store them plain.
    // Both shapes load through the same path (null = no workbook stored).
    const payload: FullWorkspacePayload = {
      referenceWb: decompressWorkbookFromSync(data.reference_wb) ?? undefined,
      comparisonWb: decompressWorkbookFromSync(data.comparison_wb) ?? undefined,
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
 * Startup cloud download, one column at a time, so the splash screen can
 * show REAL download progress (which item, how many done, percent) instead
 * of a fake timer. Columns are fetched sequentially: the progress callback
 * fires before each fetch (item starts) and after each one (item done).
 *
 * A column whose row value is null is ABSENT, not failed (fresh/empty
 * workspace). A column that errors or times out lands in `failed` — the
 * caller shows the error screen (Retry / Continue with local data) rather
 * than guessing, because a failed column is unknown, not empty.
 */
export interface WorkspaceColumnProgress {
  /** Human-readable label of the column being downloaded. */
  item: string;
  done: number;
  total: number;
  percent: number;
}

export interface WorkspaceColumnsResult {
  /** Only columns that downloaded successfully (null values omitted). */
  columns: Partial<FullWorkspacePayload>;
  /** Labels of columns that failed to download. */
  failed: string[];
}

const WORKSPACE_COLUMNS: {
  label: string;
  column: string;
  field: keyof FullWorkspacePayload;
  workbook: boolean;
}[] = [
  { label: 'Main file', column: 'reference_wb', field: 'referenceWb', workbook: true },
  { label: 'Comparison file', column: 'comparison_wb', field: 'comparisonWb', workbook: true },
  { label: 'Rules & settings', column: 'settings', field: 'settings', workbook: false },
  { label: 'Matching results', column: 'results', field: 'results', workbook: false },
  { label: 'Result statistics', column: 'stats', field: 'stats', workbook: false },
];

/** Per-column download timeout: generous, so a slow Main file still lands. */
const COLUMN_FETCH_TIMEOUT_MS = 60000;

export async function fetchWorkspaceColumns(
  userId: string,
  onProgress: (progress: WorkspaceColumnProgress) => void
): Promise<WorkspaceColumnsResult> {
  const client = getSupabase();
  const startTime = Date.now();
  const total = WORKSPACE_COLUMNS.length;
  const columns: Partial<FullWorkspacePayload> = {};
  const failed: string[] = [];

  updateSyncProgress({
    isSyncing: true,
    progressPercent: 10,
    phase: 'uploading',
    title: 'Downloading cloud workspace...',
    reason: 'Startup workspace sync',
    startedAt: startTime,
  });

  if (!client || !userId) {
    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'error',
      title: 'Cloud Pull Failed',
      reason: 'Supabase client or user not authenticated',
      error: 'Supabase client or user not authenticated',
    });
    return { columns, failed: WORKSPACE_COLUMNS.map((c) => c.label) };
  }

  for (let i = 0; i < WORKSPACE_COLUMNS.length; i++) {
    const { label, column, field, workbook } = WORKSPACE_COLUMNS[i];
    onProgress({ item: label, done: i, total, percent: Math.round((i / total) * 100) });
    try {
      const fetchPromise = client
        .from('workspaces')
        .select(column)
        .eq('user_id', userId)
        .maybeSingle();
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Download timed out')), COLUMN_FETCH_TIMEOUT_MS)
      );
      const { data, error } = await Promise.race([fetchPromise, timeout]);
      if (error) throw new Error(error.message);
      const value = (data as Record<string, unknown> | null)?.[column];
      if (value !== undefined && value !== null) {
        (columns as Record<string, unknown>)[field] = workbook
          ? decompressWorkbookFromSync(value)
          : value;
        // A workbook column that decompresses to null is corrupt, not empty.
        if (workbook && (columns as Record<string, unknown>)[field] == null) {
          delete (columns as Record<string, unknown>)[field];
          failed.push(label);
        }
      }
    } catch (err: any) {
      console.warn(`Supabase column fetch failed (${label}):`, err);
      failed.push(label);
    }
    onProgress({
      item: label,
      done: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
    });
  }

  const durationMs = Date.now() - startTime;
  const { sizeFormatted, itemCount } = estimatePayloadDetails(
    columns as FullWorkspacePayload
  );

  if (failed.length > 0) {
    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'error',
      title: 'Cloud Pull Partially Failed',
      reason: `Failed: ${failed.join(', ')}`,
      error: `Failed: ${failed.join(', ')}`,
    });
    await addSyncHistoryEntry({
      time: startTime,
      kind: 'pull',
      title: 'Cloud Pull Partially Failed',
      reason: `Startup workspace sync — failed: ${failed.join(', ')}`,
      status: 'failed',
      size: sizeFormatted,
      itemCount,
      durationMs,
      error: `Failed columns: ${failed.join(', ')}`,
      target: 'supabase',
    });
  } else {
    updateSyncProgress({
      isSyncing: false,
      progressPercent: 100,
      phase: 'completed',
      title: 'Cloud Workspace Pulled',
      reason: 'Startup workspace sync',
    });
    await addSyncHistoryEntry({
      time: startTime,
      kind: 'pull',
      title: 'Cloud Workspace Pulled',
      reason: `Startup workspace sync (${itemCount.toLocaleString()} total items)`,
      status: 'done',
      size: sizeFormatted,
      itemCount,
      durationMs,
      target: 'supabase',
    });
  }

  return { columns, failed };
}

/**
 * Startup presence merge (no-sign-in shared workspace).
 *
 * Rule the user chose: local data is authoritative when it exists; the
 * cloud only fills gaps. Field by field:
 * - local present -> keep local (push it to the cloud only if the cloud
 *   lacks that field, so other devices converge on it);
 * - local absent + cloud present -> pull the cloud value;
 * - both absent -> nothing.
 * Results/stats are pulled only when no local data could change them
 * (no local files, mappings, layers, normalization, or hold state);
 * otherwise the app re-evaluates matching from merged inputs, because
 * cloud results computed from cloud inputs would not match merged inputs.
 *
 * Push-back settings are built COMPLETE (cloud values preserved for shared
 * fields, local values only for missing fields, app defaults for the rest)
 * because the sync upsert replaces the whole settings column.
 */
export interface LocalWorkspaceSnapshot {
  referenceWb?: WorkbookData | null;
  comparisonWb?: WorkbookData | null;
  normalization?: NormalizationRules | null;
  layers?: DecisionLayer[] | null;
  mappings?: ColumnMapping[] | null;
  holdColumn?: string | null;
  holdValues?: string[] | null;
  holdReason?: string | null;
  releasedRowIds?: string[] | null;
  columnConfigs?: StoredColumnSettings | null;
  mappingPresets?: SavedMappingPreset[] | null;
  decisionPresets?: SavedDecisionPreset[] | null;
}

export interface MergedWorkspace {
  referenceWb?: WorkbookData;
  comparisonWb?: WorkbookData;
  /** Presence-accurate merged settings: only fields that exist somewhere. */
  settings?: Partial<WorkspaceSettings>;
  results?: MatchedRow[];
  stats?: MatchingStats;
  /** Human-readable labels of fields pulled from the cloud. */
  pulled: string[];
  /** True when any settings field was pulled (caller re-runs matching). */
  settingsPulled: boolean;
  /** True when a workbook file was pulled. */
  filesPulled: boolean;
  /** Upload payload for local-only data, or null when the cloud already
   *  has everything local has. */
  pushBack: FullWorkspacePayload | null;
}

type SettingsField =
  | 'normalization'
  | 'layers'
  | 'mappings'
  | 'holdColumn'
  | 'holdValues'
  | 'holdReason'
  | 'releasedRowIds'
  | 'columnConfigs'
  | 'mappingPresets'
  | 'decisionPresets';

const SETTINGS_FIELD_LABELS: { key: SettingsField; label: string }[] = [
  { key: 'normalization', label: 'Normalization rules' },
  { key: 'layers', label: 'Decision layers' },
  { key: 'mappings', label: 'Column mappings' },
  { key: 'holdColumn', label: 'Hold column' },
  { key: 'holdValues', label: 'Hold values' },
  { key: 'holdReason', label: 'Hold reason' },
  { key: 'releasedRowIds', label: 'Released rows' },
  { key: 'columnConfigs', label: 'Column view settings' },
  { key: 'mappingPresets', label: 'Mapping presets' },
  { key: 'decisionPresets', label: 'Decision presets' },
];

export function mergeWorkspacePresence(
  local: LocalWorkspaceSnapshot,
  cloud: FullWorkspacePayload | undefined,
  options?: { allowPushBack?: boolean }
): MergedWorkspace {
  const present = (value: unknown): boolean => value !== undefined && value !== null;
  const pulled: string[] = [];
  let settingsPulled = false;
  let filesPulled = false;
  let pushBackNeeded = false;

  let referenceWb: WorkbookData | undefined;
  if (present(local.referenceWb)) {
    referenceWb = local.referenceWb as WorkbookData;
    if (!present(cloud?.referenceWb)) pushBackNeeded = true;
  } else if (present(cloud?.referenceWb)) {
    referenceWb = cloud?.referenceWb as WorkbookData;
    pulled.push('Reference Workbook');
    filesPulled = true;
  }

  let comparisonWb: WorkbookData | undefined;
  if (present(local.comparisonWb)) {
    comparisonWb = local.comparisonWb as WorkbookData;
    if (!present(cloud?.comparisonWb)) pushBackNeeded = true;
  } else if (present(cloud?.comparisonWb)) {
    comparisonWb = cloud?.comparisonWb as WorkbookData;
    pulled.push('Comparison Workbook');
    filesPulled = true;
  }

  const cloudSettings = cloud?.settings ?? undefined;
  const mergedSettings: Partial<WorkspaceSettings> = {};
  const localOnlySettings: Partial<WorkspaceSettings> = {};
  for (const { key, label } of SETTINGS_FIELD_LABELS) {
    const localValue = (local as Record<string, unknown>)[key];
    const cloudValue = (cloudSettings as Record<string, unknown> | undefined)?.[key];
    if (present(localValue)) {
      (mergedSettings as Record<string, unknown>)[key] = localValue;
      if (!present(cloudValue)) {
        (localOnlySettings as Record<string, unknown>)[key] = localValue;
        pushBackNeeded = true;
      }
    } else if (present(cloudValue)) {
      (mergedSettings as Record<string, unknown>)[key] = cloudValue;
      pulled.push(label);
      settingsPulled = true;
    }
  }
  const settings = Object.keys(mergedSettings).length > 0 ? mergedSettings : undefined;

  let results: MatchedRow[] | undefined;
  let stats: MatchingStats | undefined;
  const localAffectsResults =
    present(local.referenceWb) ||
    present(local.comparisonWb) ||
    present(local.normalization) ||
    present(local.layers) ||
    present(local.mappings) ||
    present(local.holdColumn) ||
    present(local.holdValues) ||
    present(local.holdReason) ||
    present(local.releasedRowIds);
  if (!localAffectsResults && present(cloud?.results) && present(cloud?.stats)) {
    results = cloud?.results as MatchedRow[];
    stats = cloud?.stats as MatchingStats;
    pulled.push('Matching results');
  }

  let pushBack: FullWorkspacePayload | null = null;
  // A partial cloud (some columns failed to download) must never push:
  // a failed column is unknown, not absent, and pushing local data over
  // it could overwrite newer cloud data the device simply could not see.
  if (pushBackNeeded && options?.allowPushBack !== false) {
    const cloudSettingsRecord = (cloudSettings ?? {}) as Partial<WorkspaceSettings>;
    const pushSettings: WorkspaceSettings | undefined =
      Object.keys(localOnlySettings).length > 0
        ? {
            normalization:
              localOnlySettings.normalization ?? cloudSettingsRecord.normalization ?? defaultNormalizationRules,
            layers: localOnlySettings.layers ?? cloudSettingsRecord.layers ?? defaultDecisionLayers,
            mappings: localOnlySettings.mappings ?? cloudSettingsRecord.mappings ?? [],
            holdColumn: localOnlySettings.holdColumn ?? cloudSettingsRecord.holdColumn ?? '',
            holdValues: localOnlySettings.holdValues ?? cloudSettingsRecord.holdValues ?? [],
            holdReason: localOnlySettings.holdReason ?? cloudSettingsRecord.holdReason ?? '',
            releasedRowIds: localOnlySettings.releasedRowIds ?? cloudSettingsRecord.releasedRowIds ?? [],
            mappingPresets: localOnlySettings.mappingPresets ?? cloudSettingsRecord.mappingPresets,
            decisionPresets: localOnlySettings.decisionPresets ?? cloudSettingsRecord.decisionPresets,
            columnConfigs: localOnlySettings.columnConfigs ?? cloudSettingsRecord.columnConfigs,
            updatedAt: Date.now(),
          }
        : undefined;
    pushBack = {
      referenceWb:
        present(local.referenceWb) && !present(cloud?.referenceWb)
          ? (local.referenceWb as WorkbookData)
          : undefined,
      comparisonWb:
        present(local.comparisonWb) && !present(cloud?.comparisonWb)
          ? (local.comparisonWb as WorkbookData)
          : undefined,
      settings: pushSettings,
    };
  }

  return {
    referenceWb,
    comparisonWb,
    settings,
    results,
    stats,
    pulled,
    settingsPulled,
    filesPulled,
    pushBack,
  };
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
