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
  updatedAt?: number;
  cloudExists?: boolean;
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

/** Marker wrapper stored in the jsonb column when a payload is compressed. */
interface CompressedPayload {
  __hptCompressed: true;
  algo: 'gzip-base64' | 'lz-base64';
  /** Base64-compressed JSON of the serialized payload. */
  data: string;
  /** Original uncompressed JSON byte size (for display/diagnostics). */
  originalBytes: number;
}

function isCompressedPayload(value: unknown): value is CompressedPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as CompressedPayload).__hptCompressed === true &&
    ((value as CompressedPayload).algo === 'lz-base64' ||
      (value as CompressedPayload).algo === 'gzip-base64') &&
    typeof (value as CompressedPayload).data === 'string'
  );
}

/** Below this JSON size compression is not worth its CPU cost (32 KB). */
const COMPRESSION_THRESHOLD_BYTES = 32 * 1024;

let compressionWorker: Worker | null = null;
let workerMsgId = 0;
const workerCallbacks = new Map<string, (res: { success: boolean; result?: string | null; error?: string }) => void>();

function supportsNativeGzip(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function gzipCompressFallback(str: string): Promise<string> {
  const encoded = new TextEncoder().encode(str);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return uint8ToBase64(new Uint8Array(buf));
}

async function gzipDecompressFallback(b64: string): Promise<string> {
  const bytes = base64ToUint8(b64);
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes as unknown as BufferSource);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(buf);
}

function getCompressionWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
  if (!compressionWorker) {
    try {
      compressionWorker = new Worker(new URL('../workers/compression.worker.ts', import.meta.url), {
        type: 'module',
      });
      compressionWorker.onmessage = (e: MessageEvent<{ id: string; success: boolean; result?: string | null; error?: string }>) => {
        const cb = workerCallbacks.get(e.data.id);
        if (cb) {
          workerCallbacks.delete(e.data.id);
          cb(e.data);
        }
      };
      compressionWorker.onerror = () => {
        compressionWorker = null;
      };
    } catch {
      compressionWorker = null;
    }
  }
  return compressionWorker;
}

export async function compressStringAsync(
  str: string,
  algo: 'gzip-base64' | 'lz-base64' = supportsNativeGzip() ? 'gzip-base64' : 'lz-base64'
): Promise<{ data: string; algo: 'gzip-base64' | 'lz-base64' }> {
  const runFallback = async (): Promise<{ data: string; algo: 'gzip-base64' | 'lz-base64' }> => {
    if (algo === 'gzip-base64' && supportsNativeGzip()) {
      return { data: await gzipCompressFallback(str), algo: 'gzip-base64' };
    }
    await new Promise((r) => setTimeout(r, 0));
    return { data: LZString.compressToBase64(str), algo: 'lz-base64' };
  };

  const worker = getCompressionWorker();
  if (worker) {
    return new Promise((resolve) => {
      const id = `cw_${++workerMsgId}`;
      const timeout = setTimeout(async () => {
        workerCallbacks.delete(id);
        resolve(await runFallback());
      }, 30000);
      workerCallbacks.set(id, async (res) => {
        clearTimeout(timeout);
        if (res.success && typeof res.result === 'string') {
          resolve({ data: res.result, algo });
        } else {
          resolve(await runFallback());
        }
      });
      worker.postMessage({ id, action: 'compress', algo, data: str });
    });
  }
  return runFallback();
}

export async function decompressStringAsync(
  data: string,
  algo: 'gzip-base64' | 'lz-base64' = 'lz-base64'
): Promise<string | null> {
  const runFallback = async (): Promise<string | null> => {
    if (algo === 'gzip-base64' && typeof DecompressionStream !== 'undefined') {
      return gzipDecompressFallback(data);
    }
    await new Promise((r) => setTimeout(r, 0));
    return LZString.decompressFromBase64(data);
  };

  const worker = getCompressionWorker();
  if (worker) {
    return new Promise((resolve) => {
      const id = `cw_${++workerMsgId}`;
      const timeout = setTimeout(async () => {
        workerCallbacks.delete(id);
        try {
          resolve(await runFallback());
        } catch {
          resolve(null);
        }
      }, 30000);
      workerCallbacks.set(id, async (res) => {
        clearTimeout(timeout);
        if (res.success && res.result !== undefined) {
          resolve(res.result);
        } else {
          try {
            resolve(await runFallback());
          } catch {
            resolve(null);
          }
        }
      });
      worker.postMessage({ id, action: 'decompress', algo, data });
    });
  }
  return runFallback();
}

/**
 * Strip duplicated sheets[activeSheet] data on the wire while keeping
 * lossless restoration on download. Cuts multi-sheet / active-sheet JSON size ~40-50%.
 */
function deduplicateWorkbookForWire(wb: WorkbookData): Record<string, any> {
  if (!wb.sheets || !wb.activeSheet || !wb.sheets[wb.activeSheet]) {
    return wb;
  }
  const activeEntry = wb.sheets[wb.activeSheet];
  if (
    activeEntry &&
    activeEntry.rows?.length === wb.rows?.length &&
    activeEntry.headers?.length === wb.headers?.length
  ) {
    const { [wb.activeSheet]: _omitted, ...otherSheets } = wb.sheets;
    return {
      ...wb,
      sheets: {
        ...otherSheets,
        [wb.activeSheet]: { __hptActiveSheetRef: true },
      },
    };
  }
  return wb;
}

function restoreDeduplicatedWorkbook(wb: WorkbookData): WorkbookData {
  if (!wb || !wb.sheets || !wb.activeSheet) return wb;
  const activeEntry = wb.sheets[wb.activeSheet] as unknown as { __hptActiveSheetRef?: boolean };
  if (activeEntry && activeEntry.__hptActiveSheetRef) {
    return {
      ...wb,
      sheets: {
        ...wb.sheets,
        [wb.activeSheet]: {
          headers: wb.headers || [],
          rows: wb.rows || [],
        },
      },
    };
  }
  return wb;
}

/**
 * Compress a workbook for the wire. Uses native gzip (falls back to LZString)
 * inside the background Web Worker to prevent UI freezing and statement timeouts.
 */
export async function compressWorkbookForSync(wb: WorkbookData): Promise<WorkbookData | CompressedPayload> {
  await new Promise((r) => setTimeout(r, 0));

  const wireWb = deduplicateWorkbookForWire(wb);
  let json: string;
  try {
    json = JSON.stringify(wireWb);
  } catch {
    return wb;
  }
  if (json.length < COMPRESSION_THRESHOLD_BYTES) return wireWb as WorkbookData;

  try {
    const { data: compressed, algo } = await compressStringAsync(json);
    if (!compressed || compressed.length >= json.length) return wireWb as WorkbookData;
    return {
      __hptCompressed: true,
      algo,
      data: compressed,
      originalBytes: json.length,
    };
  } catch {
    return wireWb as WorkbookData;
  }
}

export async function compressResultsForSync(
  results: MatchedRow[]
): Promise<Omit<MatchedRow, 'searchBlob'>[] | CompressedPayload> {
  await new Promise((r) => setTimeout(r, 0));
  const stripped = results.map(({ searchBlob: _unused, ...rest }) => rest);
  let json: string;
  try {
    json = JSON.stringify(stripped);
  } catch {
    return stripped;
  }
  if (json.length < COMPRESSION_THRESHOLD_BYTES) return stripped;

  try {
    const { data: compressed, algo } = await compressStringAsync(json);
    if (!compressed || compressed.length >= json.length) return stripped;
    return {
      __hptCompressed: true,
      algo,
      data: compressed,
      originalBytes: json.length,
    };
  } catch {
    return stripped;
  }
}

export async function decompressResultsFromSync(value: unknown): Promise<MatchedRow[] | null | undefined> {
  if (value === null || value === undefined) return value as null | undefined;
  if (!isCompressedPayload(value)) return value as MatchedRow[];
  try {
    const json = await decompressStringAsync(value.data, value.algo);
    if (!json) return null;
    return JSON.parse(json) as MatchedRow[];
  } catch {
    return null;
  }
}

/**
 * Restore a workbook read from Supabase. Plain (legacy) values pass through
 * untouched; a corrupt compressed value yields null instead of crashing the
 * pull, so the app can continue with its local copy.
 */
export async function decompressWorkbookFromSync(value: unknown): Promise<WorkbookData | null | undefined> {
  if (value === null || value === undefined) return value as null | undefined;
  if (!isCompressedPayload(value)) return restoreDeduplicatedWorkbook(value as WorkbookData);
  try {
    const json = await decompressStringAsync(value.data, value.algo);
    if (!json) return null;
    return restoreDeduplicatedWorkbook(JSON.parse(json) as WorkbookData);
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
  let approxBytes = 0;
  if (payload.referenceWb?.rows) {
    count += payload.referenceWb.rows.length;
    approxBytes += payload.referenceWb.size || payload.referenceWb.rows.length * 200;
  }
  if (payload.comparisonWb?.rows) {
    count += payload.comparisonWb.rows.length;
    approxBytes += payload.comparisonWb.size || payload.comparisonWb.rows.length * 200;
  }
  if (payload.results) {
    count += payload.results.length;
    approxBytes += payload.results.length * 250;
  }
  if (payload.settings) {
    approxBytes += 2048;
  }
  if (approxBytes === 0) {
    approxBytes = 512;
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
        payload.referenceWb === null ? null : await compressWorkbookForSync(payload.referenceWb);
    }
    if (payload.comparisonWb !== undefined) {
      updatePayload.comparison_wb =
        payload.comparisonWb === null ? null : await compressWorkbookForSync(payload.comparisonWb);
    }
    if (payload.results !== undefined) {
      updatePayload.results =
        payload.results === null ? null : await compressResultsForSync(payload.results);
    }
    if (payload.stats !== undefined) updatePayload.stats = payload.stats;
    if (payload.settings !== undefined) updatePayload.settings = payload.settings;

    // Fast wire size calculation without re-stringifying whole payload
    byteCount = 0;
    if (updatePayload.reference_wb) {
      if (typeof updatePayload.reference_wb.data === 'string') {
        byteCount += updatePayload.reference_wb.data.length;
      } else {
        byteCount += (payload.referenceWb?.size || (payload.referenceWb?.rows?.length || 0) * 150);
      }
    }
    if (updatePayload.comparison_wb) {
      if (typeof updatePayload.comparison_wb.data === 'string') {
        byteCount += updatePayload.comparison_wb.data.length;
      } else {
        byteCount += (payload.comparisonWb?.size || (payload.comparisonWb?.rows?.length || 0) * 150);
      }
    }
    if (updatePayload.results) {
      if (typeof updatePayload.results.data === 'string') {
        byteCount += updatePayload.results.data.length;
      } else if (Array.isArray(updatePayload.results)) {
        byteCount += updatePayload.results.length * 250;
      }
    }
    if (byteCount === 0) byteCount = 512;
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

    // Fallback: If PostgreSQL statement timeout occurred (e.g. huge payloads exceeding query limits),
    // update columns individually so no single transaction exceeds the server timeout.
    if (
      upsertError &&
      (String(upsertError.message || '').toLowerCase().includes('statement timeout') ||
       String(upsertError.message || '').toLowerCase().includes('timeout'))
    ) {
      updateSyncProgress({
        progressPercent: 75,
        phase: 'uploading',
        title: 'Retrying with individual column stream to prevent timeout...',
        bytesUploaded: Math.round(byteCount * 0.75),
      });

      try {
        // 1. Ensure row exists with metadata & lightweight settings
        const baseUpdate: Record<string, any> = {
          user_id: userId,
          updated_at: new Date().toISOString(),
        };
        if (updatePayload.stats !== undefined) baseUpdate.stats = updatePayload.stats;
        if (updatePayload.settings !== undefined) baseUpdate.settings = updatePayload.settings;

        const { error: baseErr } = await client
          .from('workspaces')
          .upsert(baseUpdate, { onConflict: 'user_id' });

        if (!baseErr) {
          let stepError: { message?: string } | null = null;
          // 2. Stream reference_wb separately
          if (updatePayload.reference_wb !== undefined) {
            const { error: refErr } = await client
              .from('workspaces')
              .update({ reference_wb: updatePayload.reference_wb, updated_at: new Date().toISOString() })
              .eq('user_id', userId);
            if (refErr) stepError = refErr;
          }
          // 3. Stream comparison_wb separately
          if (!stepError && updatePayload.comparison_wb !== undefined) {
            const { error: compErr } = await client
              .from('workspaces')
              .update({ comparison_wb: updatePayload.comparison_wb, updated_at: new Date().toISOString() })
              .eq('user_id', userId);
            if (compErr) stepError = compErr;
          }
          // 4. Stream results separately
          if (!stepError && updatePayload.results !== undefined) {
            const { error: resErr } = await client
              .from('workspaces')
              .update({ results: updatePayload.results, updated_at: new Date().toISOString() })
              .eq('user_id', userId);
            if (resErr) stepError = resErr;
          }
          if (!stepError) {
            upsertError = null;
          } else {
            upsertError = stepError;
          }
        } else {
          upsertError = baseErr;
        }
      } catch (streamErr: any) {
        console.warn('Individual column fallback failed:', streamErr);
      }
    }

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

    try {
      await saveToIDB(StorageKeys.LAST_CLOUD_SYNC_AT, Date.now());
    } catch {}

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

    const parsedUpdatedAt = data.updated_at ? Date.parse(String(data.updated_at)) : NaN;
    // New rows store workbooks & large results compressed; legacy rows store them plain.
    // Both shapes load through the same path (null = no data stored).
    const payload: FullWorkspacePayload = {
      referenceWb: (await decompressWorkbookFromSync(data.reference_wb)) ?? undefined,
      comparisonWb: (await decompressWorkbookFromSync(data.comparison_wb)) ?? undefined,
      results: (await decompressResultsFromSync(data.results)) ?? undefined,
      stats: data.stats,
      settings: data.settings,
      updatedAt: Number.isFinite(parsedUpdatedAt) && parsedUpdatedAt > 0 ? parsedUpdatedAt : undefined,
      cloudExists: true,
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
  let cloudExists = false;
  let updatedAt: number | undefined;

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
    let timerId: ReturnType<typeof setTimeout> | undefined;
    try {
      const selectClause = column === 'stats' ? 'stats, updated_at' : column;
      const fetchPromise = client
        .from('workspaces')
        .select(selectClause)
        .eq('user_id', userId)
        .maybeSingle();
      const timeout = new Promise<never>((_, reject) => {
        timerId = setTimeout(() => reject(new Error('Download timed out')), COLUMN_FETCH_TIMEOUT_MS);
      });
      const { data, error } = await Promise.race([fetchPromise, timeout]);
      if (timerId) clearTimeout(timerId);
      if (error) throw new Error(error.message);
      const rowData = data as unknown as Record<string, unknown> | null;
      if (rowData) {
        cloudExists = true;
        const rowUpdated = rowData.updated_at;
        if (rowUpdated) {
          const parsed = Date.parse(String(rowUpdated));
          if (Number.isFinite(parsed) && parsed > 0) updatedAt = parsed;
        }
      }
      const value = rowData?.[column];
      if (value !== undefined && value !== null) {
        if (workbook) {
          (columns as Record<string, unknown>)[field] = await decompressWorkbookFromSync(value);
          // A workbook column that decompresses to null is corrupt, not empty.
          if ((columns as Record<string, unknown>)[field] == null) {
            delete (columns as Record<string, unknown>)[field];
            failed.push(label);
          }
        } else if (field === 'results') {
          (columns as Record<string, unknown>)[field] = await decompressResultsFromSync(value);
          if ((columns as Record<string, unknown>)[field] == null) {
            delete (columns as Record<string, unknown>)[field];
            failed.push(label);
          }
        } else {
          (columns as Record<string, unknown>)[field] = value;
        }
      }
    } catch (err: any) {
      if (timerId) clearTimeout(timerId);
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

  if (cloudExists) {
    columns.cloudExists = true;
    if (updatedAt) columns.updatedAt = updatedAt;
  } else if (failed.length === 0) {
    columns.cloudExists = false;
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
  lastCloudSyncedAt?: number | null;
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
  /** True when a workbook file was pulled or removed by cloud. */
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

const MATCHING_AFFECTING_SETTINGS = new Set<SettingsField>([
  'normalization',
  'layers',
  'mappings',
  'holdColumn',
  'holdValues',
  'releasedRowIds',
]);

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

export function getWorkbookTimestamp(wb?: WorkbookData | null): number {
  if (!wb) return 0;
  if (typeof wb.uploadedAt === 'number' && wb.uploadedAt > 0) return wb.uploadedAt;
  if (typeof wb.id === 'string') {
    const m = wb.id.match(/^wb_(\d+)_/);
    if (m) {
      const parsed = Number(m[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return typeof wb.lastModified === 'number' && wb.lastModified > 0 ? wb.lastModified : 0;
}

export function areCloudResultsFresh(
  referenceWb?: WorkbookData | null,
  comparisonWb?: WorkbookData | null,
  settings?: Partial<WorkspaceSettings> | null,
  stats?: MatchingStats | null,
  resultsCount?: number
): boolean {
  if (!stats) return false;
  if (comparisonWb) {
    const expectedRows = comparisonWb.rows?.length ?? 0;
    if (typeof stats.totalIncoming === 'number' && stats.totalIncoming !== expectedRows) {
      return false;
    }
    if (typeof resultsCount === 'number' && resultsCount !== expectedRows) {
      return false;
    }
  }
  if (stats.evaluatedRefId && referenceWb?.id && stats.evaluatedRefId !== referenceWb.id) {
    return false;
  }
  if (
    stats.evaluatedRefSheet &&
    referenceWb?.activeSheet &&
    stats.evaluatedRefSheet !== referenceWb.activeSheet
  ) {
    return false;
  }
  if (stats.evaluatedCompId && comparisonWb?.id && stats.evaluatedCompId !== comparisonWb.id) {
    return false;
  }
  if (
    stats.evaluatedCompSheet &&
    comparisonWb?.activeSheet &&
    stats.evaluatedCompSheet !== comparisonWb.activeSheet
  ) {
    return false;
  }
  if (typeof settings?.updatedAt === 'number' && settings.updatedAt > 0) {
    if (typeof stats.evaluatedSettingsAt !== 'number') {
      return false;
    }
    if (settings.updatedAt > stats.evaluatedSettingsAt) {
      return false;
    }
  }
  if (typeof stats.evaluatedAt === 'number') {
    if (referenceWb?.uploadedAt && referenceWb.uploadedAt > stats.evaluatedAt) return false;
    if (comparisonWb?.uploadedAt && comparisonWb.uploadedAt > stats.evaluatedAt) return false;
  } else if (referenceWb?.uploadedAt || comparisonWb?.uploadedAt) {
    return false;
  }
  return true;
}

export function mergeWorkspacePresence(
  local: LocalWorkspaceSnapshot,
  cloud: FullWorkspacePayload | undefined,
  options?: { allowPushBack?: boolean }
): MergedWorkspace {
  const hasValue = (val: unknown): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  };

  const isSameWorkbook = (a?: WorkbookData | null, b?: WorkbookData | null): boolean => {
    if (!a || !b) return false;
    const sameIdentity = (a.id && b.id && a.id === b.id) || a.name === b.name;
    if (!sameIdentity) return false;
    return (
      (a.activeSheet ?? '') === (b.activeSheet ?? '') &&
      (a.rows?.length ?? 0) === (b.rows?.length ?? 0) &&
      (a.headers?.length ?? 0) === (b.headers?.length ?? 0)
    );
  };

  const wasRemovedInCloud = (localWb: WorkbookData): boolean => {
    if (cloud?.cloudExists !== true) return false;
    if (typeof local.lastCloudSyncedAt !== 'number' || local.lastCloudSyncedAt <= 0) return false;
    const localTs = getWorkbookTimestamp(localWb);
    return localTs > 0 && localTs <= local.lastCloudSyncedAt;
  };

  const pulled: string[] = [];
  let settingsPulled = false;
  let filesPulled = false;
  let pushBackNeeded = false;

  let referenceWb: WorkbookData | undefined;
  if (hasValue(local.referenceWb) && hasValue(cloud?.referenceWb)) {
    const localRef = local.referenceWb as WorkbookData;
    const cloudRef = cloud?.referenceWb as WorkbookData;
    if (isSameWorkbook(localRef, cloudRef)) {
      referenceWb = localRef;
    } else if (getWorkbookTimestamp(cloudRef) >= getWorkbookTimestamp(localRef)) {
      referenceWb = cloudRef;
      pulled.push('Reference Workbook');
      filesPulled = true;
    } else {
      referenceWb = localRef;
      pushBackNeeded = true;
    }
  } else if (hasValue(local.referenceWb)) {
    const localRef = local.referenceWb as WorkbookData;
    if (wasRemovedInCloud(localRef)) {
      referenceWb = undefined;
      pulled.push('Reference Workbook (removed)');
      filesPulled = true;
    } else {
      referenceWb = localRef;
      pushBackNeeded = true;
    }
  } else if (hasValue(cloud?.referenceWb)) {
    referenceWb = cloud?.referenceWb as WorkbookData;
    pulled.push('Reference Workbook');
    filesPulled = true;
  }

  let comparisonWb: WorkbookData | undefined;
  if (hasValue(local.comparisonWb) && hasValue(cloud?.comparisonWb)) {
    const localComp = local.comparisonWb as WorkbookData;
    const cloudComp = cloud?.comparisonWb as WorkbookData;
    if (isSameWorkbook(localComp, cloudComp)) {
      comparisonWb = localComp;
    } else if (getWorkbookTimestamp(cloudComp) >= getWorkbookTimestamp(localComp)) {
      comparisonWb = cloudComp;
      pulled.push('Comparison Workbook');
      filesPulled = true;
    } else {
      comparisonWb = localComp;
      pushBackNeeded = true;
    }
  } else if (hasValue(local.comparisonWb)) {
    const localComp = local.comparisonWb as WorkbookData;
    if (wasRemovedInCloud(localComp)) {
      comparisonWb = undefined;
      pulled.push('Comparison Workbook (removed)');
      filesPulled = true;
    } else {
      comparisonWb = localComp;
      pushBackNeeded = true;
    }
  } else if (hasValue(cloud?.comparisonWb)) {
    comparisonWb = cloud?.comparisonWb as WorkbookData;
    pulled.push('Comparison Workbook');
    filesPulled = true;
  }

  const areSettingsEqual = (key: SettingsField, a: unknown, b: unknown): boolean => {
    try {
      if (key === 'columnConfigs' && a && b && typeof a === 'object' && typeof b === 'object') {
        const { updatedAt: _ua, ...restA } = a as Record<string, unknown>;
        const { updatedAt: _ub, ...restB } = b as Record<string, unknown>;
        return JSON.stringify(restA) === JSON.stringify(restB);
      }
      return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    } catch {
      return false;
    }
  };

  const cloudSettings = cloud?.settings ?? undefined;
  const hasCommittedCloudSettings =
    !!cloudSettings && typeof cloudSettings.updatedAt === 'number' && cloudSettings.updatedAt > 0;
  const mergedSettings: Partial<WorkspaceSettings> = {};
  const localOnlySettings: Partial<WorkspaceSettings> = {};

  for (const { key, label } of SETTINGS_FIELD_LABELS) {
    const localValue = (local as Record<string, unknown>)[key];
    const cloudValue = (cloudSettings as Record<string, unknown> | undefined)?.[key];

    const cloudExplicitlyCleared =
      hasCommittedCloudSettings &&
      cloudValue !== undefined &&
      cloudValue !== null &&
      (Array.isArray(cloudValue) || typeof cloudValue === 'string');

    if (hasValue(cloudValue) || cloudExplicitlyCleared) {
      // Cloud is authoritative for the shared workspace:
      // Adopt cloud settings so all devices converge on what was saved in the cloud,
      // but only flag settingsPulled / pulled[] when local actually differs.
      (mergedSettings as Record<string, unknown>)[key] = cloudValue;
      if (!areSettingsEqual(key, localValue, cloudValue)) {
        pulled.push(label);
        settingsPulled = true;
      }
    } else if (hasValue(localValue)) {
      // Cloud lacks this setting: initialize cloud from local
      (mergedSettings as Record<string, unknown>)[key] = localValue;
      (localOnlySettings as Record<string, unknown>)[key] = localValue;
      pushBackNeeded = true;
    }
  }
  if (hasCommittedCloudSettings && cloudSettings?.updatedAt) {
    mergedSettings.updatedAt = cloudSettings.updatedAt;
  }
  const settings = Object.keys(mergedSettings).length > 0 ? mergedSettings : undefined;

  let results: MatchedRow[] | undefined;
  let stats: MatchingStats | undefined;

  if (hasValue(cloud?.results) && hasValue(cloud?.stats)) {
    const refAligned = Boolean(referenceWb && isSameWorkbook(referenceWb, cloud?.referenceWb));
    const compAligned = Boolean(comparisonWb && isSameWorkbook(comparisonWb, cloud?.comparisonWb));
    const matchingLocalOnly = (Object.keys(localOnlySettings) as SettingsField[]).some((k) =>
      MATCHING_AFFECTING_SETTINGS.has(k)
    );
    const freshResults = areCloudResultsFresh(
      referenceWb,
      comparisonWb,
      mergedSettings,
      cloud?.stats,
      Array.isArray(cloud?.results) ? cloud.results.length : undefined
    );

    if (refAligned && compAligned && !matchingLocalOnly && freshResults) {
      results = cloud?.results as MatchedRow[];
      stats = cloud?.stats as MatchingStats;
      if (!hasValue(local.referenceWb) || filesPulled || settingsPulled) {
        pulled.push('Matching results');
      }
    }
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
        referenceWb && (!hasValue(cloud?.referenceWb) || !isSameWorkbook(referenceWb, cloud?.referenceWb))
          ? referenceWb
          : undefined,
      comparisonWb:
        comparisonWb && (!hasValue(cloud?.comparisonWb) || !isSameWorkbook(comparisonWb, cloud?.comparisonWb))
          ? comparisonWb
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

    if (!error) {
      try {
        await deleteFromIDB(StorageKeys.LAST_CLOUD_SYNC_AT);
      } catch {}
    }

    return !error;
  } catch {
    return false;
  }
}
