import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
// NOTE: chunk documents are removed via batch.delete(); no deleteDoc import needed.
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
// Live preview sync: latest evaluated results + active filter/search/columns.
// Meta lives at workspaces/{uid}/state/preview; the (possibly large) compact
// payload is chunked into workspaces/{uid}/state/preview/chunks/{i} because a
// single Firestore document is limited to ~1MB.
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
}

const CHUNK_CHARS = 700_000;

export async function publishPreviewSnapshot(
  uid: string,
  payload: SharedPreviewPayload
): Promise<void> {
  try {
    const json = JSON.stringify(packCompact(payload));
    const chunks: string[] = [];
    for (let i = 0; i < json.length; i += CHUNK_CHARS) {
      chunks.push(json.slice(i, i + CHUNK_CHARS));
    }

    const metaRef = stateDoc(uid, 'preview');
    const prevSnap = await getDoc(metaRef).catch(() => null);
    const prevCount =
      prevSnap && prevSnap.exists() ? (prevSnap.data() as CloudPreviewMeta).chunkCount || 0 : 0;

    const batch = writeBatch(db);
    const chunksCol = collection(metaRef, 'chunks');
    chunks.forEach((data, i) => {
      batch.set(doc(chunksCol, String(i)), { data });
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
    } satisfies CloudPreviewMeta);
    await batch.commit();
  } catch (e) {
    console.warn('Cloud sync: failed to publish preview snapshot', e);
  }
}

/** Real-time listener: fires whenever the studio publishes a newer snapshot. */
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

/** Fetches the full snapshot (meta + chunks) and unpacks it into results. */
export async function fetchPreviewSnapshot(uid: string): Promise<SharedPreviewPayload | null> {
  try {
    const metaSnap = await getDoc(stateDoc(uid, 'preview'));
    if (!metaSnap.exists()) return null;
    const colSnap = await getDocs(collection(metaSnap.ref, 'chunks'));
    const parts: string[] = [];
    colSnap.forEach((d) => {
      parts[parseInt(d.id, 10)] = (d.data() as { data: string }).data;
    });
    if (parts.length === 0 || parts.some((p) => p === undefined)) return null;
    return unpackCompact(JSON.parse(parts.join('')));
  } catch (e) {
    console.warn('Cloud sync: failed to fetch preview snapshot', e);
    return null;
  }
}
