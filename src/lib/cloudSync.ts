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
  MatchingStats,
  NormalizationRules,
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
  updatedAt: number;
}

const stateDoc = (uid: string, name: string) => doc(db, 'workspaces', uid, 'state', name);

export async function publishRulesState(
  uid: string,
  state: Omit<CloudRulesState, 'updatedAt'>
): Promise<void> {
  try {
    await setDoc(stateDoc(uid, 'rules'), { ...state, updatedAt: Date.now() });
  } catch (e) {
    console.warn('Cloud sync: failed to publish rules', e);
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

const CHUNK_CHARS = 700_000;

async function publishSnapshotTo(
  metaRef: DocumentReference,
  payload: SharedPreviewPayload,
  extraFields: Record<string, unknown> = {},
  chunkFields: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    const json = JSON.stringify(packCompact(payload));
    const chunks: string[] = [];
    for (let i = 0; i < json.length; i += CHUNK_CHARS) {
      chunks.push(json.slice(i, i + CHUNK_CHARS));
    }

    const prevSnap = await getDoc(metaRef).catch(() => null);
    const prevCount =
      prevSnap && prevSnap.exists() ? (prevSnap.data() as CloudPreviewMeta).chunkCount || 0 : 0;

    const batch = writeBatch(db);
    const chunksCol = collection(metaRef, 'chunks');
    chunks.forEach((data, i) => {
      batch.set(doc(chunksCol, String(i)), { data, ...chunkFields });
    });
    // Remove stale chunks left over from a previously larger payload
    for (let i = chunks.length; i < prevCount; i++) {
      batch.delete(doc(chunksCol, String(i)));
    }
    batch.set(metaRef, {
      updatedAt: payload.createdAt || Date.now(),
      comparisonWbName: payload.comparisonWbName,
      filter: payload.filter || 'all',
      searchTerm: payload.searchTerm || '',
      searchColumn: payload.searchColumn || 'all',
      columnConfigs: payload.columnConfigs || [],
      stats: payload.stats,
      chunkCount: chunks.length,
      ...extraFields,
    } satisfies CloudPreviewMeta);
    await batch.commit();
    return true;
  } catch (e) {
    console.warn('Cloud sync: failed to publish snapshot', e);
    return false;
  }
}

async function fetchSnapshotFrom(metaRef: DocumentReference): Promise<SharedPreviewPayload | null> {
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) return null;
  const colSnap = await getDocs(collection(metaSnap.ref, 'chunks'));
  const parts: string[] = [];
  colSnap.forEach((d) => {
    parts[parseInt(d.id, 10)] = (d.data() as { data: string }).data;
  });
  if (parts.length === 0 || parts.some((p) => p === undefined)) return null;
  return unpackCompact(JSON.parse(parts.join('')));
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
