import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { db } from './firebase';
import { packCompact, unpackCompact } from '../utils/previewSharing';
import type { SharedPreviewPayload } from '../utils/previewSharing';
import type {
  ColumnConfigItem,
  ColumnMapping,
  DecisionLayer,
  MatchedRow,
  MatchingStats,
  NormalizationRules,
  SyncHistoryEntry,
  WorkbookData,
} from '../types';

/** Tiny debounce helper for cloud publishes. */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number
): (...args: Args) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Unguessable public share identifier. */
export function generateShareId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch {
    // fall through to Math.random fallback
  }
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

// ---------------------------------------------------------------------------
// Rule settings sync: normalization rules, decision layers, column mappings.
// Stored at workspaces/{uid}/state/rules — shared across every device.
// ---------------------------------------------------------------------------

export interface CloudRulesState {
  normalization: NormalizationRules;
  layers: DecisionLayer[];
  mappings: ColumnMapping[];
  holdColumn: string;
  holdValues: string[];
  holdReason: string;
  releasedRowIds: string[];
  updatedAt: number;
}

const stateDoc = (uid: string, name: string) => doc(db, 'workspaces', uid, 'state', name);

export async function publishRulesState(
  uid: string,
  state: Omit<CloudRulesState, 'updatedAt'>
): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, 'rules'), { ...state, updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish rules', e);
    return false;
  }
}

export async function fetchRulesState(uid: string): Promise<CloudRulesState | null> {
  try {
    const snap = await getDoc(stateDoc(uid, 'rules'));
    if (!snap.exists()) return null;
    return snap.data() as CloudRulesState;
  } catch (e) {
    console.warn('Cloud sync: failed to fetch rules', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Snapshot storage (shared by private workspace previews and public shares).
// Meta lives at the given doc ref; the (possibly large) compact payload is
// chunked into {metaRef}/chunks/{i} because a Firestore document caps at ~1MB.
// ---------------------------------------------------------------------------

export interface CloudPreviewMeta {
  updatedAt: number;
  comparisonWbName: string;
  filter: string;
  searchTerm: string;
  searchColumn: string;
  columnConfigs: ColumnConfigItem[];
  stats: MatchingStats;
  chunkCount: number;
  ownerUid?: string;
}

const CHUNK_BYTES = 700_000; // max UTF-8 bytes per chunk doc (Firestore caps a doc at ~1MiB)

/** UTF-8 byte length of str[start, end) — surrogate-pair aware, no allocation. */
function utf8ByteLength(str: string, start: number, end: number): number {
  let bytes = 0;
  for (let i = start; i < end; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      bytes += 4;
      i++; // skip the low surrogate — counted as one code point
    } else bytes += 3;
  }
  return bytes;
}

/**
 * Split a string into chunks of at most maxBytes UTF-8 bytes.
 * Chunking by character count is unsafe: CJK/Myanmar text is 3 bytes per
 * char, so a 700k-char chunk can exceed Firestore's 1MiB document limit and
 * fail the whole batch write. Never splits a surrogate pair.
 */
function splitIntoByteChunks(str: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  const n = str.length;
  let start = 0;
  while (start < n) {
    // Upper bound: every char costs >= 1 byte, so end can be at most start + maxBytes.
    let end = Math.min(n, start + maxBytes);
    let bytes = utf8ByteLength(str, start, end);
    while (bytes > maxBytes && end > start + 1) {
      // Shrink proportionally; converges in ~2 iterations.
      end = start + Math.max(1, Math.floor(((end - start) * maxBytes) / bytes));
      // Never cut a surrogate pair in half.
      const prev = str.charCodeAt(end - 1);
      if (prev >= 0xd800 && prev <= 0xdbff) end--;
      bytes = utf8ByteLength(str, start, end);
    }
    chunks.push(str.slice(start, end));
    start = end;
  }
  return chunks;
}

export interface ChunkedPublishOptions {
  /** Real upload progress: called with (chunksDone, chunksTotal). */
  onProgress?: (done: number, total: number) => void;
  /**
   * When true, uploads everything in a single atomic batch (no progress
   * reporting, no uploading marker). Used for small payloads like share
   * snapshots where readers must never see a partial state.
   */
  atomic?: boolean;
}

/** Freshness window for the uploading marker (a crashed upload's marker goes stale). */
const UPLOAD_MARKER_STALE_MS = 5 * 60 * 1000;

async function publishChunkedDoc(
  metaRef: DocumentReference,
  json: string,
  metaFields: Record<string, unknown>,
  chunkFields: Record<string, unknown> = {},
  opts: ChunkedPublishOptions = {}
): Promise<boolean> {
  const chunks = splitIntoByteChunks(json, CHUNK_BYTES);
  const chunksCol = collection(metaRef, 'chunks');

  // Small/atomic path: single batch, all-or-nothing (previous behavior).
  if (opts.atomic) {
    try {
      const prevSnap = await getDoc(metaRef).catch(() => null);
      const prevCount =
        prevSnap && prevSnap.exists()
          ? ((prevSnap.data() as { chunkCount?: number }).chunkCount || 0)
          : 0;
      const batch = writeBatch(db);
      chunks.forEach((data, i) => {
        batch.set(doc(chunksCol, String(i)), { data, ...chunkFields });
      });
      for (let i = chunks.length; i < prevCount; i++) {
        batch.delete(doc(chunksCol, String(i)));
      }
      batch.set(metaRef, { ...metaFields, chunkCount: chunks.length });
      await batch.commit();
      opts.onProgress?.(chunks.length, chunks.length);
      return true;
    } catch (e) {
      console.warn('Cloud sync: failed to publish chunked doc', e);
      return false;
    }
  }

  // Progressive path: upload chunks with real progress, then finalize
  // atomically. An "uploading" marker tells concurrent readers to wait
  // instead of reading a partial payload; every chunk carries an uploadId
  // so a reader can detect chunks from an overlapping upload.
  const uploadId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const total = chunks.length;
  try {
    const prevSnap = await getDoc(metaRef).catch(() => null);
    const prevCount =
      prevSnap && prevSnap.exists()
        ? ((prevSnap.data() as { chunkCount?: number }).chunkCount || 0)
        : 0;

    // 1. Marker first (quick single write)
    await setDoc(
      metaRef,
      { ...metaFields, chunkCount: 0, uploading: true, uploadId, uploadStartedAt: Date.now() },
      { merge: true }
    );

    // 2. Chunks with real progress (bounded concurrency)
    opts.onProgress?.(0, total);
    const CONCURRENCY = 6;
    for (let i = 0; i < total; i += CONCURRENCY) {
      const end = Math.min(i + CONCURRENCY, total);
      await Promise.all(
        chunks.slice(i, end).map((data, j) =>
          setDoc(doc(chunksCol, String(i + j)), { data, uploadId, ...chunkFields })
        )
      );
      opts.onProgress?.(end, total);
    }

    // 3. Atomic finalize: drop stale chunks + publish the real meta
    const batch = writeBatch(db);
    for (let i = total; i < prevCount; i++) {
      batch.delete(doc(chunksCol, String(i)));
    }
    batch.set(metaRef, {
      ...metaFields,
      chunkCount: total,
      uploading: false,
      uploadId,
      uploadStartedAt: Date.now(),
    });
    await batch.commit();
    opts.onProgress?.(total, total);
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish chunked doc', e);
    // Best effort: clear the marker so readers don't wait on a dead upload
    try {
      await setDoc(metaRef, { uploading: false }, { merge: true });
    } catch { /* ignore */ }
    return false;
  }
}

/**
 * True while the given workspace doc has a fresh "uploading" marker.
 * The login pull uses this to avoid seeding over / reading a mid-upload doc.
 */
export async function isCloudDocUploading(uid: string, name: string): Promise<boolean> {
  try {
    const snap = await getDoc(stateDoc(uid, name));
    if (!snap.exists()) return false;
    const meta = snap.data() as { uploading?: boolean; uploadStartedAt?: number };
    if (!meta.uploading) return false;
    const started = meta.uploadStartedAt || 0;
    return Date.now() - started < UPLOAD_MARKER_STALE_MS;
  } catch {
    return false;
  }
}

async function fetchChunkedDoc(
  metaRef: DocumentReference
): Promise<{ meta: Record<string, unknown>; json: string } | null> {
  try {
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) return null;
    const meta = metaSnap.data() as Record<string, unknown>;
    // An upload in progress (or crashed mid-upload): never read partial data.
    if (meta.uploading) return null;
    const expected = (meta.chunkCount as number) || 0;
    if (expected === 0) return null;
    const metaUploadId = meta.uploadId as string | undefined;
    const colSnap = await getDocs(collection(metaSnap.ref, 'chunks'));
    const parts: string[] = [];
    let consistent = true;
    colSnap.forEach((d) => {
      const idx = parseInt(d.id, 10);
      if (idx >= 0 && idx < expected) {
        const dd = d.data() as { data: string; uploadId?: string };
        // Chunks from an overlapping upload must not be mixed in
        if (metaUploadId && dd.uploadId && dd.uploadId !== metaUploadId) consistent = false;
        parts[idx] = dd.data;
      }
    });
    if (!consistent) return null;
    // Direct index access (not .some(), which skips holes in sparse arrays).
    for (let i = 0; i < expected; i++) {
      if (parts[i] === undefined) return null;
    }
    return { meta, json: parts.join('') };
  } catch (e) {
    console.warn('Cloud sync: failed to fetch chunked doc', e);
    return null;
  }
}

function previewMetaFields(
  payload: SharedPreviewPayload,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    updatedAt: payload.createdAt || Date.now(),
    comparisonWbName: payload.comparisonWbName,
    filter: payload.filter || 'all',
    searchTerm: payload.searchTerm || '',
    searchColumn: payload.searchColumn || 'all',
    columnConfigs: payload.columnConfigs || [],
    stats: payload.stats,
    ...extra,
  };
}

async function publishSnapshotTo(
  metaRef: DocumentReference,
  payload: SharedPreviewPayload,
  extraFields: Record<string, unknown> = {},
  chunkFields: Record<string, unknown> = {}
): Promise<boolean> {
  // Share snapshots stay atomic: public viewers must never see a partial payload.
  return publishChunkedDoc(
    metaRef,
    JSON.stringify(packCompact(payload)),
    previewMetaFields(payload, extraFields),
    chunkFields,
    { atomic: true }
  );
}

async function fetchSnapshotFrom(metaRef: DocumentReference): Promise<SharedPreviewPayload | null> {
  const res = await fetchChunkedDoc(metaRef);
  if (!res) return null;
  try {
    return unpackCompact(JSON.parse(res.json));
  } catch (e) {
    console.warn('Cloud sync: failed to unpack snapshot', e);
    return null;
  }
}


// ---------------------------------------------------------------------------
// Private workspace preview: workspaces/{uid}/state/preview (+chunks).
// Only the owning signed-in user can read/write (see Firestore rules).
// ---------------------------------------------------------------------------

export async function publishPreviewSnapshot(
  uid: string,
  payload: SharedPreviewPayload
): Promise<void> {
  try {
    await publishSnapshotTo(stateDoc(uid, 'preview'), payload);
  } catch (e) {
    console.warn('Cloud sync: failed to publish preview snapshot', e);
  }
}

export function subscribePreviewSnapshot(
  uid: string,
  onUpdate: (meta: CloudPreviewMeta) => void
): () => void {
  return onSnapshot(
    stateDoc(uid, 'preview'),
    (snap) => {
      if (snap.exists()) onUpdate(snap.data() as CloudPreviewMeta);
    },
    (e) => console.warn('Cloud sync: preview subscription error', e)
  );
}

export async function fetchPreviewSnapshot(uid: string): Promise<SharedPreviewPayload | null> {
  try {
    return await fetchSnapshotFrom(stateDoc(uid, 'preview'));
  } catch (e) {
    console.warn('Cloud sync: failed to fetch preview snapshot', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public live shares: shares/{shareId} (+chunks).
// Readable by anyone with the link (no sign-in); writable only by the owner.
// ---------------------------------------------------------------------------

const shareDoc = (shareId: string) => doc(db, 'shares', shareId);

export async function publishSharedSnapshot(
  shareId: string,
  uid: string,
  payload: SharedPreviewPayload
): Promise<boolean> {
  return publishSnapshotTo(shareDoc(shareId), payload, { ownerUid: uid }, { ownerUid: uid });
}

/** Deletes a share and all its chunks. Firestore rules enforce owner-only delete. */
export async function unpublishSharedSnapshot(shareId: string): Promise<boolean> {
  try {
    const metaRef = shareDoc(shareId);
    const colSnap = await getDocs(collection(metaRef, 'chunks'));
    const batch = writeBatch(db);
    colSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(metaRef);
    await batch.commit();
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to unpublish share', e);
    return false;
  }
}

export function subscribeSharedSnapshot(
  shareId: string,
  onUpdate: (meta: CloudPreviewMeta | null) => void
): () => void {
  return onSnapshot(
    shareDoc(shareId),
    (snap) => onUpdate(snap.exists() ? (snap.data() as CloudPreviewMeta) : null),
    (e) => console.warn('Cloud sync: shared snapshot subscription error', e)
  );
}

export async function fetchSharedSnapshot(shareId: string): Promise<SharedPreviewPayload | null> {
  try {
    return await fetchSnapshotFrom(shareDoc(shareId));
  } catch (e) {
    console.warn('Cloud sync: failed to fetch shared snapshot', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Active share pointer: workspaces/{uid}/state/sharing = { shareId }.
// Lets every signed-in device know which public share is currently live.
// ---------------------------------------------------------------------------

export async function getActiveShare(uid: string): Promise<string | null> {
  try {
    const snap = await getDoc(stateDoc(uid, 'sharing'));
    if (!snap.exists()) return null;
    return (snap.data() as { shareId?: string }).shareId || null;
  } catch (e) {
    console.warn('Cloud sync: failed to fetch active share', e);
    return null;
  }
}

export async function setActiveShare(uid: string, shareId: string | null): Promise<boolean> {
  try {
    if (shareId) {
      await setDoc(stateDoc(uid, 'sharing'), { shareId, updatedAt: Date.now() });
    } else {
      await deleteDoc(stateDoc(uid, 'sharing'));
    }
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to set active share', e);
    return false;
  }
}


// ---------------------------------------------------------------------------
// Workbook sync: the actual Reference + Incoming files (headers + rows).
// Stored chunked at workspaces/{uid}/state/workbooks so every signed-in
// device opens the same files, history and results. Covered by the existing
// workspaces/{uid} security rule — no rules change needed.
// ---------------------------------------------------------------------------

export interface CloudWorkbooks {
  reference: WorkbookData | null;
  comparison: WorkbookData | null;
  updatedAt: number;
}

export async function publishWorkbooks(
  uid: string,
  wbs: { reference: WorkbookData | null; comparison: WorkbookData | null },
  onProgress?: (done: number, total: number) => void
): Promise<boolean> {
  return publishChunkedDoc(
    stateDoc(uid, 'workbooks'),
    JSON.stringify({ reference: wbs.reference, comparison: wbs.comparison }),
    { updatedAt: Date.now() },
    {},
    { onProgress }
  );
}

export async function fetchWorkbooks(uid: string): Promise<CloudWorkbooks | null> {
  const res = await fetchChunkedDoc(stateDoc(uid, 'workbooks'));
  if (!res) return null;
  try {
    const data = JSON.parse(res.json) as {
      reference?: WorkbookData | null;
      comparison?: WorkbookData | null;
    };
    return {
      reference: data.reference || null,
      comparison: data.comparison || null,
      updatedAt: (res.meta.updatedAt as number) || 0,
    };
  } catch (e) {
    console.warn('Cloud sync: failed to parse workbooks', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Results state: the evaluated matching results (+ stats + view filters) so a
// signed-in user gets their files, settings AND results on any device right
// after login, without re-running the match. Chunked: result sets can be large.
// ---------------------------------------------------------------------------

export interface ResultFilters {
  activeFilter: string;
  searchTerm: string;
  searchColumn: string;
  onlyAccept: boolean;
}

export interface CloudResultsState {
  results: MatchedRow[];
  stats: MatchingStats;
  filters: ResultFilters;
  updatedAt: number;
}

export const defaultResultFilters: ResultFilters = {
  activeFilter: 'all',
  searchTerm: '',
  searchColumn: 'all',
  onlyAccept: true,
};

export async function publishResultsState(
  uid: string,
  state: Omit<CloudResultsState, 'updatedAt'>,
  onProgress?: (done: number, total: number) => void
): Promise<boolean> {
  return publishChunkedDoc(
    stateDoc(uid, 'results'),
    JSON.stringify({ results: state.results, stats: state.stats, filters: state.filters }),
    { updatedAt: Date.now() },
    {},
    { onProgress }
  );
}

// ---------------------------------------------------------------------------
// Sync history: the per-device upload log (file names, settings reasons,
// results). Small enough for a single doc — no chunking. Merged (not
// overwritten) on pull so every device sees every other device's uploads.
// ---------------------------------------------------------------------------

export interface CloudSyncHistory {
  entries: SyncHistoryEntry[];
  updatedAt: number;
  clearedAt?: number;
}

export async function publishSyncHistory(
  uid: string,
  history: SyncHistoryEntry[],
  clearedAt?: number
): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, 'history'), {
      entries: history.slice(0, 50),
      updatedAt: Date.now(),
      ...(clearedAt ? { clearedAt } : {}),
    });
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish history', e);
    return false;
  }
}

export async function fetchSyncHistory(uid: string): Promise<CloudSyncHistory | null> {
  try {
    const snap = await getDoc(stateDoc(uid, 'history'));
    if (!snap.exists()) return null;
    const data = snap.data() as { entries?: SyncHistoryEntry[]; updatedAt?: number; clearedAt?: number };
    return {
      entries: Array.isArray(data.entries) ? data.entries : [],
      updatedAt: data.updatedAt || 0,
      clearedAt: data.clearedAt || 0,
    };
  } catch (e) {
    console.warn('Cloud sync: failed to fetch history', e);
    return null;
  }
}

export async function deleteResultsState(uid: string): Promise<void> {
  try {
    const metaRef = stateDoc(uid, 'results');
    const colSnap = await getDocs(collection(metaRef, 'chunks'));
    const batch = writeBatch(db);
    colSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(metaRef);
    await batch.commit();
  } catch (e) {
    console.warn('Cloud sync: failed to delete results state', e);
  }
}

export async function fetchResultsState(uid: string): Promise<CloudResultsState | null> {
  const res = await fetchChunkedDoc(stateDoc(uid, 'results'));
  if (!res) return null;
  try {
    const data = JSON.parse(res.json) as {
      results?: MatchedRow[];
      stats?: MatchingStats;
      filters?: ResultFilters;
    };
    if (!data.results || !data.stats) return null;
    return {
      results: data.results,
      stats: data.stats,
      filters: { ...defaultResultFilters, ...(data.filters || {}) },
      updatedAt: (res.meta.updatedAt as number) || 0,
    };
  } catch (e) {
    console.warn('Cloud sync: failed to parse results state', e);
    return null;
  }
}
