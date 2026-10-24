import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';
import { packCompact, unpackCompact } from '../utils/previewSharing';
import type { SharedPreviewPayload } from '../utils/previewSharing';
import type {
  ColumnConfigItem,
  ColumnMapping,
  DecisionLayer,
  MatchedRow,
  MatchingStats,
  NormalizationRules,
  SavedDecisionPreset,
  SavedMappingPreset,
  SyncHistoryEntry,
  WorkbookData,
} from '../types';

/** Tiny debounce helper for cloud publishes. */
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
// Rule settings sync: normalization rules, decision layers, column mappings,
// presets, and column view settings.
// Stored at workspaces/{uid}/state/rules and state/columnConfigs.
// ---------------------------------------------------------------------------

export interface StoredColumnSettings {
  order: string[];
  visibility: Record<string, { table: boolean; export: boolean }>;
  updatedAt?: number;
}

export interface CloudRulesState {
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

const stateDoc = (uid: string, name: string) => doc(db, 'workspaces', uid, 'state', name);

export async function publishRulesState(
  uid: string,
  state: Partial<Omit<CloudRulesState, 'updatedAt'>>
): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, 'rules'), { ...state, updatedAt: Date.now() }, { merge: true });
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

export async function publishColumnConfigs(
  uid: string,
  settings: StoredColumnSettings
): Promise<boolean> {
  try {
    await Promise.all([
      setDoc(stateDoc(uid, 'columnConfigs'), { ...settings, updatedAt: Date.now() }, { merge: true }),
      setDoc(stateDoc(uid, 'rules'), { columnConfigs: settings, updatedAt: Date.now() }, { merge: true }),
    ]);
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish columnConfigs', e);
    return false;
  }
}

export async function fetchColumnConfigs(uid: string): Promise<StoredColumnSettings | null> {
  try {
    const snap = await getDoc(stateDoc(uid, 'columnConfigs'));
    if (snap.exists()) {
      return snap.data() as StoredColumnSettings;
    }
    // Fallback: check inside rules doc in case columnConfigs was stored there
    const rulesSnap = await getDoc(stateDoc(uid, 'rules'));
    if (rulesSnap.exists()) {
      const data = rulesSnap.data() as CloudRulesState;
      if (data?.columnConfigs) return data.columnConfigs;
    }
    return null;
  } catch (e) {
    console.warn('Cloud sync: failed to fetch columnConfigs', e);
    return null;
  }
}

export async function publishMappingPresets(
  uid: string,
  presets: SavedMappingPreset[]
): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, 'rules'), { mappingPresets: presets, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish mappingPresets', e);
    return false;
  }
}

export async function publishDecisionPresets(
  uid: string,
  presets: SavedDecisionPreset[]
): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, 'rules'), { decisionPresets: presets, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish decisionPresets', e);
    return false;
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

  const uploadId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const total = chunks.length;

  // Small/atomic path or single chunk: commit everything in a single atomic batch
  // (drastically speeds up uploads, cuts roundtrips from 4 down to 1).
  if (opts.atomic || total <= 1) {
    try {
      opts.onProgress?.(0, Math.max(total, 1));
      const prevSnap = await getDoc(metaRef).catch(() => null);
      const prevCount =
        prevSnap && prevSnap.exists()
          ? ((prevSnap.data() as { chunkCount?: number }).chunkCount || 0)
          : 0;
      const batch = writeBatch(db);
      chunks.forEach((data, i) => {
        batch.set(doc(chunksCol, String(i)), { data, uploadId, ...chunkFields });
      });
      for (let i = chunks.length; i < prevCount; i++) {
        batch.delete(doc(chunksCol, String(i)));
      }
      batch.set(
        metaRef,
        {
          ...metaFields,
          chunkCount: chunks.length,
          uploading: false,
          uploadId,
          uploadStartedAt: Date.now(),
        },
        { merge: true }
      );
      await batch.commit();
      opts.onProgress?.(total, Math.max(total, 1));
      return true;
    } catch (e) {
      console.warn('Cloud sync: failed to publish atomic/single chunked doc', e);
      return false;
    }
  }

  // Progressive path: upload multi-chunk payloads with real progress and bounded concurrency
  try {
    opts.onProgress?.(0, total);

    // 1. Marker and previous count check in parallel
    const [prevSnap] = await Promise.all([
      getDoc(metaRef).catch(() => null),
      setDoc(
        metaRef,
        { ...metaFields, chunkCount: 0, uploading: true, uploadId, uploadStartedAt: Date.now() },
        { merge: true }
      ),
    ]);
    const prevCount =
      prevSnap && prevSnap.exists()
        ? ((prevSnap.data() as { chunkCount?: number }).chunkCount || 0)
        : 0;

    // 2. Chunks with real progress (increased concurrency from 6 to 10 for faster uploads)
    const CONCURRENCY = 10;
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
  metaRef: DocumentReference,
  fromServer = false
): Promise<{ meta: Record<string, unknown>; json: string } | null> {
  try {
    // Public shares must bypass the local Firestore cache so a fresh open
    // always shows the latest published data, not a stale cached copy.
    const metaSnap = fromServer ? await getDocFromServer(metaRef) : await getDoc(metaRef);
    if (!metaSnap.exists()) return null;
    const meta = metaSnap.data() as Record<string, unknown>;
    // An upload in progress (or crashed mid-upload): never read partial data.
    // If the marker is stale (>10 min), the tab likely crashed; proceed anyway.
    if (meta.uploading) {
      const started = (meta.uploadStartedAt as number) || 0;
      if (Date.now() - started < 10 * 60 * 1000) return null;
    }
    const expected = (meta.chunkCount as number) || 0;
    if (expected === 0) return null;
    const metaUploadId = meta.uploadId as string | undefined;
    const colSnap = fromServer
      ? await getDocsFromServer(collection(metaSnap.ref, 'chunks'))
      : await getDocs(collection(metaSnap.ref, 'chunks'));
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

async function fetchSnapshotFrom(
  metaRef: DocumentReference,
  fromServer = false
): Promise<SharedPreviewPayload | null> {
  const res = await fetchChunkedDoc(metaRef, fromServer);
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

/**
 * Fixed public preview slot: shares/{FIXED_PREVIEW_SHARE_ID}.
 * A single well-known share doc that always carries the owner's latest
 * published results, so the short fixed link /preview shows the newest data
 * without a per-share id in the URL. It reuses the /shares Firestore rules
 * (public read, owner write), so no rules change is needed. The literal id
 * can never collide with generateShareId() output (uuid hex / base36).
 */
export const FIXED_PREVIEW_SHARE_ID = 'latest';

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
  // Try SDK first with a fast timeout so a hanging connection falls back quickly
  try {
    const viaSdk = await Promise.race([
      fetchSnapshotFrom(shareDoc(shareId), true),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore SDK fetch timeout')), 3500)
      ),
    ]);
    if (viaSdk) return viaSdk;
  } catch (e) {
    console.warn('Cloud sync: SDK fetch failed or timed out, trying REST fallback', e);
  }
  // Fallback: direct Firestore REST API (no SDK, no persistent connection).
  try {
    return await fetchSharedSnapshotViaRest(shareId);
  } catch (e) {
    console.warn('Cloud sync: REST fallback failed', e);
    return null;
  }
}

// Direct Firestore REST fetch for the public share slot.
// Uses the web API key and database ID from the provisioned Firebase client config.
const FIRESTORE_REST_BASE =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId || '(default)'}/documents`;
const FIRESTORE_WEB_KEY = firebaseConfig.apiKey;

async function fetchSharedSnapshotViaRest(shareId: string): Promise<SharedPreviewPayload | null> {
  const key = FIRESTORE_WEB_KEY;
  // Abort after 10s so a stalled network can't hang forever
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  const sig = ctrl.signal;
  try {
  // 1. Meta doc
  const metaRes = await fetch(
    `${FIRESTORE_REST_BASE}/shares/${encodeURIComponent(shareId)}?key=${key}`,
    { signal: sig }
  );
  if (!metaRes.ok) return null;
  const metaDoc = await metaRes.json();
  const fields = metaDoc.fields || {};
  const chunkCount = parseInt(fields.chunkCount?.integerValue || '0', 10);
  if (!chunkCount || chunkCount <= 0) return null;
  if (fields.uploading?.booleanValue) {
    // Stale marker check (same TTL as SDK path)
    const started = parseInt(fields.uploadStartedAt?.integerValue || '0', 10);
    if (Date.now() - started < 10 * 60 * 1000) return null;
  }
  const metaUploadId = fields.uploadId?.stringValue;
  // 2. Chunks (numeric doc ids) — fetched in parallel
  const chunkPromises = Array.from({ length: chunkCount }, async (_, i) => {
    const cRes = await fetch(
      `${FIRESTORE_REST_BASE}/shares/${encodeURIComponent(shareId)}/chunks/${i}?key=${key}`,
      { signal: sig }
    );
    if (!cRes.ok) throw new Error(`chunk ${i} failed`);
    const cDoc = await cRes.json();
    const cFields = cDoc.fields || {};
    // UploadId consistency: don't mix chunks from overlapping uploads
    const chunkUploadId = cFields.uploadId?.stringValue;
    if (metaUploadId && chunkUploadId && chunkUploadId !== metaUploadId) {
      throw new Error(`chunk ${i} uploadId mismatch`);
    }
    const data = cFields.data?.stringValue;
    if (typeof data !== 'string') throw new Error(`chunk ${i} bad data`);
    return data;
  });
  const parts = await Promise.all(chunkPromises);
  const json = parts.join('');
  try {
    return unpackCompact(JSON.parse(json));
  } catch (e) {
    console.warn('Cloud sync: REST unpack failed', e);
    return null;
  }
  } finally {
    clearTimeout(timer);
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

function compactWorkbook(wb: WorkbookData | null): WorkbookData | null {
  if (!wb) return null;
  // If sheets contains activeSheet, wb.rows is identical to wb.sheets[activeSheet].rows.
  // We can omit duplicating rows in wb.rows when sending to cloud, cutting bytes by up to 50%.
  if (wb.sheets && wb.activeSheet && wb.sheets[wb.activeSheet]) {
    return {
      ...wb,
      rows: [],
    };
  }
  return wb;
}

function restoreWorkbook(wb: WorkbookData | null): WorkbookData | null {
  if (!wb) return null;
  if ((!wb.rows || wb.rows.length === 0) && wb.sheets && wb.activeSheet && wb.sheets[wb.activeSheet]) {
    return {
      ...wb,
      rows: wb.sheets[wb.activeSheet].rows || [],
      headers: wb.headers && wb.headers.length > 0 ? wb.headers : (wb.sheets[wb.activeSheet].headers || []),
    };
  }
  return wb;
}

export async function publishWorkbooks(
  uid: string,
  wbs: { reference: WorkbookData | null; comparison: WorkbookData | null },
  onProgress?: (done: number, total: number) => void
): Promise<boolean> {
  return publishChunkedDoc(
    stateDoc(uid, 'workbooks'),
    JSON.stringify({ reference: compactWorkbook(wbs.reference), comparison: compactWorkbook(wbs.comparison) }),
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
      reference: restoreWorkbook(data.reference || null),
      comparison: restoreWorkbook(data.comparison || null),
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

export async function publishResultFilters(
  uid: string,
  filters: ResultFilters
): Promise<boolean> {
  try {
    await setDoc(
      stateDoc(uid, 'results'),
      { filters, updatedAt: Date.now() },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish result filters', e);
    return false;
  }
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

/** Wipes all cloud workspace state for a user (files, results, rules, column configs, history, preview) */
export async function wipeCloudWorkspace(uid: string): Promise<boolean> {
  try {
    // 1. Delete results chunks & meta
    await deleteResultsState(uid);

    // 2. Delete workbooks chunks & meta
    const wbsRef = stateDoc(uid, 'workbooks');
    try {
      const wbsChunks = await getDocs(collection(wbsRef, 'chunks'));
      const batch = writeBatch(db);
      wbsChunks.forEach((d) => batch.delete(d.ref));
      batch.delete(wbsRef);
      await batch.commit();
    } catch {}

    // 3. Delete rules, columnConfigs, history, preview
    await Promise.allSettled([
      deleteDoc(stateDoc(uid, 'rules')),
      deleteDoc(stateDoc(uid, 'columnConfigs')),
      deleteDoc(stateDoc(uid, 'history')),
      deleteDoc(stateDoc(uid, 'preview')),
      unpublishSharedSnapshot(FIXED_PREVIEW_SHARE_ID),
    ]);
    return true;
  } catch (e) {
    console.warn('Failed to wipe cloud workspace', e);
    return false;
  }
}
