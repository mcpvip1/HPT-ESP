import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WorkbookData,
  ColumnMapping,
  NormalizationRules,
  DecisionLayer,
  Language,
  MatchedRow,
  MatchingStats,
  ColumnConfigItem,
  SyncHistoryEntry,
} from './types';
import {
  saveToIDB,
  getFromIDB,
  deleteFromIDB,
  StorageKeys,
  defaultNormalizationRules,
  defaultDecisionLayers,
} from './utils/storage';
import {
  processMatching,
  generateSampleDatasets,
  autoMapColumns,
  changeWorkbookSheet,
} from './utils/excel';
import { Header } from './components/Header';
import { FilesManagement } from './components/FilesManagement';
import { RulesLogicModal } from './components/RulesLogicModal';
import { ResultsDashboard } from './components/ResultsDashboard';
import { DataPreviewModal } from './components/DataPreviewModal';
import { Toast, ToastMessage } from './components/Toast';
import { SyncHistoryModal } from './components/SyncHistoryModal';
import { GlobalLoadingSkeleton } from './components/GlobalLoadingSkeleton';
import { translations } from './translations';
import {
  parsePreviewFromUrl,
  copyPreviewLinkToClipboard,
  getShareIdFromUrl,
  SharedPreviewPayload,
} from './utils/previewSharing';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutGoogle } from './lib/firebase';
import {
  publishRulesState,
  fetchRulesState,
  subscribePreviewSnapshot,
  fetchPreviewSnapshot,
  subscribeSharedSnapshot,
  fetchSharedSnapshot,
  debounce,
  publishWorkbooks,
  fetchWorkbooks,
  publishResultsState,
  fetchResultsState,
  deleteResultsState,
  defaultResultFilters,
} from './lib/cloudSync';
import type { ResultFilters } from './lib/cloudSync';
import {
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Save,
  Check,
  Settings,
  SlidersHorizontal,
  Cloud,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Live Preview Mode State (activated via /preview route, #preview, ?preview, or ?share=)
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      return (
        path.endsWith('/preview') ||
        path.endsWith('/preview/') ||
        hash.startsWith('#/preview') ||
        hash.includes('preview') ||
        search.includes('preview') ||
        getShareIdFromUrl() !== null
      );
    }
    return false;
  });
  // Public live-share id from ?share=... (viewable without sign-in)
  const [shareId, setShareId] = useState<string | null>(() => getShareIdFromUrl());
  const shareRevokedToastShownRef = useRef(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'blue' | 'unmatched'>('all');
  const [previewOnlyAccept, setPreviewOnlyAccept] = useState<boolean>(true);
  const [previewSearchTerm, setPreviewSearchTerm] = useState<string>('');
  const [previewSearchColumn, setPreviewSearchColumn] = useState<string>('all');
  const [previewColumnConfigs, setPreviewColumnConfigs] = useState<ColumnConfigItem[] | undefined>(undefined);

  // Workbooks
  const [referenceWb, setReferenceWb] = useState<WorkbookData | null>(null);
  const [comparisonWb, setComparisonWb] = useState<WorkbookData | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const refWbRef = useRef<WorkbookData | null>(null);
  const compWbRef = useRef<WorkbookData | null>(null);
  refWbRef.current = referenceWb;
  compWbRef.current = comparisonWb;

  // Rules & Configuration
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [normalization, setNormalization] = useState<NormalizationRules>(
    defaultNormalizationRules
  );
  const [layers, setLayers] = useState<DecisionLayer[]>(defaultDecisionLayers);
  // Hold filter: rows whose chosen column value is in holdValues move to the Hold tab (blue).
  // holdColumn '' = legacy substring matching against key columns.
  const [holdColumn, setHoldColumn] = useState<string>('');
  const [holdValues, setHoldValues] = useState<string[]>([]);
  // Why the items are on hold (shown at supervisor release) + rows released via supervisor confirm
  const [holdReason, setHoldReason] = useState<string>('');
  const [releasedRowIds, setReleasedRowIds] = useState<string[]>([]);

  // Cloud sync (Firebase): one shared workspace across every device
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  // Synced view state for the results (filter tab, search, Only Accept)
  const [resultFilters, setResultFilters] = useState<ResultFilters>(defaultResultFilters);
  // Bumped when cloud results are applied so the dashboard remounts with them
  const [studioSession, setStudioSession] = useState(0);
  // True while the login pull is downloading the workspace from the cloud
  const [isCloudPulling, setIsCloudPulling] = useState(false);
  // Cloud upload tracking: header arrow animation + history panel
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const pendingUploadsRef = useRef(0);
  const syncHistoryRef = useRef<SyncHistoryEntry[]>([]);
  // Tracks results that came straight from a cloud pull (skip re-publish echo)
  const pulledResultsRef = useRef<MatchedRow[] | null>(null);
  const rulesStateRef = useRef({ normalization, layers, mappings, holdColumn, holdValues, holdReason, releasedRowIds });
  rulesStateRef.current = { normalization, layers, mappings, holdColumn, holdValues, holdReason, releasedRowIds };
  const lastRulesPublishRef = useRef<string>('');
  const lastCloudPreviewAtRef = useRef<number>(0);

  // Matching Results
  const [results, setResults] = useState<MatchedRow[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals & Feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    workbook: WorkbookData | null;
    title: string;
  }>({
    isOpen: false,
    workbook: null,
    title: '',
  });

  const t = translations[language];
  const tRef = useRef(t);
  tRef.current = t;

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const checkAndApplyPreview = useCallback((pData: SharedPreviewPayload | null) => {
    if (pData && pData.results && pData.stats) {
      setIsPreviewMode(true);
      setResults(pData.results);
      setStats(pData.stats);
      setComparisonWb({
        id: `preview_${Date.now()}`,
        name: pData.comparisonWbName || 'Evaluation_Results.xlsx',
        size: 0,
        lastModified: Date.now(),
        sheetNames: ['Results'],
        activeSheet: 'Results',
        headers: pData.results[0]?.comparisonRow ? Object.keys(pData.results[0].comparisonRow) : [],
        rows: pData.results.map((r) => r.comparisonRow || {}),
      });
      if (pData.filter) setPreviewFilter(pData.filter);
      if (pData.onlyAccept !== undefined) setPreviewOnlyAccept(pData.onlyAccept);
      if (pData.searchTerm !== undefined) setPreviewSearchTerm(pData.searchTerm);
      if (pData.searchColumn) setPreviewSearchColumn(pData.searchColumn);
      if (pData.columnConfigs) setPreviewColumnConfigs(pData.columnConfigs);
      return true;
    }
    return false;
  }, []);

  // ---- Cloud sync: auth, shared rules, live preview -----------------------
  // Track Firebase auth state (sign-in/out happens through the header Sync button).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCloudUser(u);
      setAuthResolved(true);
      if (!u) didCloudPullRef.current = false; // allow a fresh pull on the next sign-in
    });
    return () => unsub();
  }, []);

  // Publish the workbooks to the cloud whenever they change (debounced).
  // Called from the file handlers below — never from an effect, so a cloud
  // pull can never echo back into a publish. Retries transient failures and
  // surfaces a toast when the files can't be synced, so a failed upload is
  // never silent (a silent failure is exactly how files went missing on
  // other devices before the byte-safe chunking fix).
  const publishWorkbooksWithRetry = async (
    uid: string,
    wbs: { reference: WorkbookData | null; comparison: WorkbookData | null },
    attempts = 3
  ): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      if (await publishWorkbooks(uid, wbs)) return true;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
    return false;
  };

  // Once local data is loaded and the user is signed in, pull the shared
  // workspace (rules + workbooks + results) so every device opens the same
  // files, settings and filtered results right after login.
  // First sign-in on the account seeds the cloud with this device's data.
  const didCloudPullRef = useRef(false);
  const previewHandledRef = useRef(false);
  useEffect(() => {
    if (!cloudUser || !localReady || isPreviewMode || didCloudPullRef.current) return;
    didCloudPullRef.current = true;
    setIsCloudPulling(true);
    const pullSafety = setTimeout(() => setIsCloudPulling(false), 30000);
    (async () => {
      try {
        const [cloudRules, cloudWbs, cloudResults] = await Promise.all([
          fetchRulesState(cloudUser.uid),
          fetchWorkbooks(cloudUser.uid),
          fetchResultsState(cloudUser.uid),
        ]);

        let effMappings = rulesStateRef.current.mappings;
        let effHoldColumn = rulesStateRef.current.holdColumn;
        let effHoldValues = rulesStateRef.current.holdValues;
        let effReleased = rulesStateRef.current.releasedRowIds;
        let effRef = refWbRef.current;
        let effComp = compWbRef.current;

        if (cloudRules && cloudRules.updatedAt) {
          if (cloudRules.normalization) {
            setNormalization(cloudRules.normalization);
            await saveToIDB(StorageKeys.NORMALIZATION_RULES, cloudRules.normalization);
          }
          if (cloudRules.layers && cloudRules.layers.length > 0) {
            setLayers(cloudRules.layers);
            await saveToIDB(StorageKeys.DECISION_LAYERS, cloudRules.layers);
          }
          if (cloudRules.mappings) {
            setMappings(cloudRules.mappings);
            await saveToIDB(StorageKeys.COLUMN_MAPPINGS, cloudRules.mappings);
            effMappings = cloudRules.mappings;
          }
          if (typeof cloudRules.holdColumn === 'string') {
            setHoldColumn(cloudRules.holdColumn);
            await saveToIDB(StorageKeys.HOLD_COLUMN, cloudRules.holdColumn);
            effHoldColumn = cloudRules.holdColumn;
          }
          {
            const vals = cloudRules.holdValues || (cloudRules as any).holdKeys;
            if (vals) {
              setHoldValues(vals);
              await saveToIDB(StorageKeys.HOLD_VALUES, vals);
              effHoldValues = vals;
            }
          }
          if (typeof cloudRules.holdReason === 'string') {
            setHoldReason(cloudRules.holdReason);
            await saveToIDB(StorageKeys.HOLD_REASON, cloudRules.holdReason);
          }
          if (cloudRules.releasedRowIds) {
            setReleasedRowIds(cloudRules.releasedRowIds);
            await saveToIDB(StorageKeys.RELEASED_ROWS, cloudRules.releasedRowIds);
            effReleased = cloudRules.releasedRowIds;
          }
          lastRulesPublishRef.current = JSON.stringify({
            n: cloudRules.normalization,
            l: cloudRules.layers,
            m: cloudRules.mappings,
            hc: cloudRules.holdColumn,
            h: cloudRules.holdValues,
            hr: cloudRules.holdReason,
            rr: cloudRules.releasedRowIds,
          });
          showToast(t.toastCloudRulesSynced, 'success');
        } else {
          const cur = rulesStateRef.current;
          await publishRulesState(cloudUser.uid, cur);
          lastRulesPublishRef.current = JSON.stringify({
            n: cur.normalization,
            l: cur.layers,
            m: cur.mappings,
            hc: cur.holdColumn,
            h: cur.holdValues,
            hr: cur.holdReason,
            rr: cur.releasedRowIds,
          });
        }

        if (cloudWbs && cloudWbs.updatedAt) {
          if (cloudWbs.reference) {
            setReferenceWb(cloudWbs.reference);
            await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, cloudWbs.reference);
            effRef = cloudWbs.reference;
          } else if (effRef) {
            // Cleared on another device — mirror the clear locally
            setReferenceWb(null);
            await deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK);
            effRef = null;
          }
          if (cloudWbs.comparison) {
            setComparisonWb(cloudWbs.comparison);
            await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, cloudWbs.comparison);
            effComp = cloudWbs.comparison;
          } else if (effComp) {
            setComparisonWb(null);
            await deleteFromIDB(StorageKeys.COMPARISON_WORKBOOK);
            effComp = null;
          }
          showToast(t.toastCloudFilesSynced, 'success');
        } else {
          // Seed the cloud with this device's files — but never with the
          // built-in demo datasets. A fresh device must not upload demo data
          // that would then overwrite real files on the next pull elsewhere.
          const isDemoWb = (wb: WorkbookData | null) =>
            !!wb &&
            (wb.name === 'Master_Procurement_Catalog_2026.xlsx' ||
              wb.name === 'Incoming_Receiving_Batch_Report.xlsx');
          if (!isDemoWb(effRef) && !isDemoWb(effComp)) {
            const seeded = await publishWorkbooksWithRetry(cloudUser.uid, {
              reference: effRef,
              comparison: effComp,
            });
            if (!seeded) showToast(t.toastCloudFilesSyncFailed, 'error');
          }
        }

        // Results: the cloud copy wins so every device shows the same
        // evaluated results and view filters right after login. If the synced
        // files are newer than the synced results (publish race), regenerate
        // instead of applying stale results.
        const resultsFresh =
          cloudResults &&
          cloudResults.results.length > 0 &&
          effRef &&
          effComp &&
          (!cloudWbs || !cloudWbs.updatedAt || cloudResults.updatedAt >= cloudWbs.updatedAt);
        if (resultsFresh) {
          pulledResultsRef.current = cloudResults.results;
          setResults(cloudResults.results);
          setStats(cloudResults.stats);
          const filters = { ...defaultResultFilters, ...(cloudResults.filters || {}) };
          setResultFilters(filters);
          await saveToIDB(StorageKeys.RESULTS_STATE, {
            results: cloudResults.results,
            stats: cloudResults.stats,
            filters,
          });
          // Remount the dashboard so the synced filter/search state applies
          setStudioSession((n) => n + 1);
          showToast(t.toastCloudResultsSynced, 'success');
        } else if (effRef && effComp) {
          handleExecuteMatching(effRef, effComp, effMappings, false, effHoldValues, effReleased, effHoldColumn);
        } else {
          // No files: no results either
          pulledResultsRef.current = null;
          setResults([]);
          setStats(null);
          await deleteFromIDB(StorageKeys.RESULTS_STATE);
        }
      } catch (e) {
        console.warn('Cloud workspace pull failed', e);
      } finally {
        clearTimeout(pullSafety);
        setIsCloudPulling(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudUser, localReady, isPreviewMode]);

  const beginUpload = useCallback((label: string) => {
    pendingUploadsRef.current += 1;
    setUploadLabel(label);
    setIsUploading(true);
  }, []);

  const endUpload = useCallback((entry: { kind: 'file' | 'settings' | 'results'; title: string; status: 'done' | 'failed' }) => {
    pendingUploadsRef.current = Math.max(0, pendingUploadsRef.current - 1);
    const full: SyncHistoryEntry = {
      ...entry,
      id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: Date.now(),
    };
    const next = [full, ...syncHistoryRef.current].slice(0, 50);
    syncHistoryRef.current = next;
    setSyncHistory(next);
    saveToIDB(StorageKeys.SYNC_HISTORY, next).catch(() => {});
    if (pendingUploadsRef.current === 0) {
      setIsUploading(false);
      setUploadLabel('');
    }
  }, []);

  // Human-readable reason for a settings upload, by diffing rule sections
  const describeRulesChange = useCallback((prevJson: string | null, cur: Record<string, unknown>): string => {
    const tt = tRef.current;
    let prev: Record<string, unknown> | null = null;
    try { prev = prevJson ? JSON.parse(prevJson) as Record<string, unknown> : null; } catch { prev = null; }
    if (!prev) return tt.syncSettingsLabel;
    const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const parts: string[] = [];
    if (!eq(prev.m, cur.m)) parts.push(tt.syncReasonMappings);
    if (!eq(prev.n, cur.n)) parts.push(tt.syncReasonNormalization);
    if (!eq(prev.l, cur.l)) parts.push(tt.syncReasonLayers);
    if (!eq(prev.hc, cur.hc) || !eq(prev.h, cur.h) || !eq(prev.hr, cur.hr) || !eq(prev.rr, cur.rr)) parts.push(tt.syncReasonHold);
    const unique = [...new Set(parts)];
    return unique.length > 0 ? unique.join(', ') : tt.syncSettingsLabel;
  }, []);

  const clearSyncHistory = useCallback(async () => {
    syncHistoryRef.current = [];
    setSyncHistory([]);
    try { await deleteFromIDB(StorageKeys.SYNC_HISTORY); } catch { /* ignore */ }
  }, []);

  // Publish rule settings to the cloud whenever they change (debounced).
  const debouncedPublishRules = useRef(
    debounce((uid: string, st: { normalization: NormalizationRules; layers: DecisionLayer[]; mappings: ColumnMapping[]; holdColumn: string; holdValues: string[]; holdReason: string; releasedRowIds: string[] }, reason: string) => {
      const key = JSON.stringify({ n: st.normalization, l: st.layers, m: st.mappings, hc: st.holdColumn, h: st.holdValues, hr: st.holdReason, rr: st.releasedRowIds });
      if (key === lastRulesPublishRef.current) return;
      lastRulesPublishRef.current = key;
      const tt = tRef.current;
      beginUpload(tt.syncSettingsLabel);
      publishRulesState(uid, st).then((ok) => {
        endUpload({ kind: 'settings', title: reason, status: ok ? 'done' : 'failed' });
        if (ok) showToast(tt.toastCloudSettingsUploaded, 'success');
        else showToast(tt.toastCloudSettingsSyncFailed, 'error');
      });
    }, 1500)
  ).current;

  useEffect(() => {
    if (!cloudUser || isPreviewMode || !localReady || !didCloudPullRef.current) return;
    const cur = rulesStateRef.current;
    const reason = describeRulesChange(lastRulesPublishRef.current, {
      n: cur.normalization, l: cur.layers, m: cur.mappings,
      hc: cur.holdColumn, h: cur.holdValues, hr: cur.holdReason, rr: cur.releasedRowIds,
    });
    debouncedPublishRules(cloudUser.uid, cur, reason);
  }, [cloudUser, isPreviewMode, localReady, normalization, layers, mappings, holdColumn, holdValues, holdReason, releasedRowIds, debouncedPublishRules, describeRulesChange]);

  // Publish evaluated results (+ view filters) to the cloud whenever they
  // change, so signing in on another device restores the same results.
  // Pull-applied results are skipped via pulledResultsRef (no echo).
  // The generation guard drops a pending publish after the results were
  // cleared (e.g. file removed) so stale results can't be resurrected.
  const resultsPublishGenRef = useRef(0);
  const debouncedPublishResults = useRef(
    debounce((uid: string, state: { results: MatchedRow[]; stats: MatchingStats; filters: ResultFilters }, gen: number) => {
      if (gen !== resultsPublishGenRef.current) return;
      const tt = tRef.current;
      beginUpload(tt.syncResultsLabel);
      publishResultsState(uid, state).then((ok) => {
        endUpload({ kind: 'results', title: `${tt.syncResultsLabel} (${state.results.length})`, status: ok ? 'done' : 'failed' });
        if (ok) showToast(tt.toastCloudResultsUploaded, 'success');
        else showToast(tt.toastCloudResultsSyncFailed, 'error');
      });
      // Keep the local instant-paint cache in step
      saveToIDB(StorageKeys.RESULTS_STATE, state).catch(() => {});
    }, 2500)
  );
  useEffect(() => {
    if (!cloudUser || isPreviewMode || !localReady || !didCloudPullRef.current) return;
    if (results.length === 0 || !stats) return;
    if (pulledResultsRef.current === results) {
      pulledResultsRef.current = null; // pull echo accounted for — skip
      return;
    }
    debouncedPublishResults.current(cloudUser.uid, { results, stats, filters: resultFilters }, resultsPublishGenRef.current);
  }, [cloudUser, isPreviewMode, localReady, results, stats, resultFilters, debouncedPublishResults]);

  const VALID_FILTERS = ['all', 'green', 'yellow', 'red', 'blue', 'unmatched'] as const;
  const isValidFilter = (f: string): f is typeof VALID_FILTERS[number] =>
    (VALID_FILTERS as readonly string[]).includes(f);

  // View-state reporter from the dashboard (debounced there)
  const handleViewStateChange = useCallback((v: ResultFilters) => {
    setResultFilters((prev) =>
      prev.activeFilter === v.activeFilter &&
      prev.searchTerm === v.searchTerm &&
      prev.searchColumn === v.searchColumn &&
      prev.onlyAccept === v.onlyAccept
        ? prev
        : v
    );
  }, []);

  const debouncedPublishWorkbooks = useRef(
    debounce((uid: string, wbs: { reference: WorkbookData | null; comparison: WorkbookData | null }) => {
      const tt = tRef.current;
      const names = [wbs.reference?.name, wbs.comparison?.name].filter(Boolean).join(' + ') || tt.syncFilesLabel;
      beginUpload(tt.syncFilesLabel);
      publishWorkbooksWithRetry(uid, wbs).then((ok) => {
        endUpload({ kind: 'file', title: names, status: ok ? 'done' : 'failed' });
        if (ok) showToast(tt.toastCloudFilesUploaded, 'success');
        else showToast(tt.toastCloudFilesSyncFailed, 'error');
      });
    }, 2000)
  ).current;

  const publishWorkbooksNow = (refWb: WorkbookData | null, compWb: WorkbookData | null) => {
    if (cloudUser) debouncedPublishWorkbooks(cloudUser.uid, { reference: refWb, comparison: compWb });
  };

  // Live public share: follow the shared snapshot in real time (no sign-in).
  // If the owner turns sharing off, the last received snapshot stays visible.
  useEffect(() => {
    if (!shareId || !isPreviewMode) return;
    const unsub = subscribeSharedSnapshot(shareId, async (meta) => {
      if (meta === null) {
        if (!shareRevokedToastShownRef.current) {
          shareRevokedToastShownRef.current = true;
          showToast(t.toastShareRevoked, 'info');
        }
        return;
      }
      if (!meta.updatedAt || meta.updatedAt <= lastCloudPreviewAtRef.current) return;
      lastCloudPreviewAtRef.current = meta.updatedAt;
      const pData = await fetchSharedSnapshot(shareId);
      if (pData && checkAndApplyPreview(pData)) {
        showToast(t.toastPreviewSynced, 'success');
      }
    });
    return () => unsub();
  }, [shareId, isPreviewMode, checkAndApplyPreview, showToast]);

  // Live cloud preview: while signed in, the preview page follows the latest
  // snapshot published by the studio — on any device, no refresh needed.
  useEffect(() => {
    if (!cloudUser || !isPreviewMode) return;
    const unsub = subscribePreviewSnapshot(cloudUser.uid, async (meta) => {
      if (!meta || !meta.updatedAt || meta.updatedAt <= lastCloudPreviewAtRef.current) return;
      lastCloudPreviewAtRef.current = meta.updatedAt;
      const pData = await fetchPreviewSnapshot(cloudUser.uid);
      if (pData && checkAndApplyPreview(pData)) {
        showToast(t.toastPreviewSynced, 'success');
      }
    });
    return () => unsub();
  }, [cloudUser, isPreviewMode, checkAndApplyPreview, showToast]);

  const handleCloudSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      showToast(e?.message || t.toastSignInFailed, 'error');
    }
  };

  const handleCloudSignOut = async () => {
    try {
      await signOutGoogle();
      // Clear in-memory studio state and the local cache so no other
      // account's data lingers on this device.
      setReferenceWb(null);
      setComparisonWb(null);
      setResults([]);
      setStats(null);
      setMappings([]);
      setNormalization(defaultNormalizationRules);
      setLayers(defaultDecisionLayers);
      setHoldColumn('');
      setHoldValues([]);
      setHoldReason('');
      setReleasedRowIds([]);
      setResultFilters(defaultResultFilters);
      pulledResultsRef.current = null;
      setLocalReady(false);
      syncHistoryRef.current = [];
      setSyncHistory([]);
      setIsSyncPanelOpen(false);
      pendingUploadsRef.current = 0;
      setIsUploading(false);
      setStudioSession((n) => n + 1);
      for (const k of [
        StorageKeys.REFERENCE_WORKBOOK,
        StorageKeys.COMPARISON_WORKBOOK,
        StorageKeys.COLUMN_MAPPINGS,
        StorageKeys.NORMALIZATION_RULES,
        StorageKeys.DECISION_LAYERS,
        StorageKeys.HOLD_COLUMN,
        StorageKeys.HOLD_VALUES,
        StorageKeys.HOLD_KEYS,
        StorageKeys.HOLD_REASON,
        StorageKeys.RELEASED_ROWS,
        StorageKeys.RESULTS_STATE,
        StorageKeys.SYNC_HISTORY,
      ]) {
        try { await deleteFromIDB(k); } catch { /* ignore */ }
      }
      showToast(t.toastSignedOut, 'info');
    } catch (e) {
      console.warn('Sign-out failed', e);
    }
  };

  // Initial Load from Persistent Storage & Live Preview Link Handling
  useEffect(() => {
    let isMounted = true;
    // Safety guard: max 1200ms loading skeleton time
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsStorageLoading(false);
    }, 1200);

    async function loadSavedState() {
      try {
        const isPreviewRoute =
          window.location.pathname.endsWith('/preview') ||
          window.location.pathname.endsWith('/preview/') ||
          window.location.hash.startsWith('#/preview') ||
          window.location.hash.includes('preview') ||
          window.location.search.includes('preview');

        // Priority 0: Public live-share link (?share=...) — no sign-in required
        const urlShareId = getShareIdFromUrl();
        if (urlShareId && !previewHandledRef.current) {
          previewHandledRef.current = true;
          setShareId(urlShareId);
          setIsPreviewMode(true);
          try {
            const shared = await fetchSharedSnapshot(urlShareId);
            if (shared && isMounted) {
              lastCloudPreviewAtRef.current = shared.createdAt || 0;
              checkAndApplyPreview(shared);
            }
          } catch (e) {
            console.warn('Failed to load shared preview', e);
          }
          if (isMounted) {
            clearTimeout(safetyTimer);
            setIsStorageLoading(false);
          }
          return;
        }

        // Priority 1: Check if page was loaded via a Live Preview Link (/preview, #preview=..., or ?preview=...)
        if (isPreviewRoute && !previewHandledRef.current) {
          previewHandledRef.current = true;
          setIsPreviewMode(true);
          const previewData = parsePreviewFromUrl();
          if (previewData && isMounted) {
            const applied = checkAndApplyPreview(previewData);
            if (applied) {
              clearTimeout(safetyTimer);
              setIsStorageLoading(false);
              return;
            }
          }

          // Fallback if no preview in storage yet: evaluate demo dataset so preview is never blank
          const demo = generateSampleDatasets();
          const auto = autoMapColumns(demo.reference.headers, demo.comparison.headers);
          const { results: evaluatedResults, stats: evaluatedStats } = processMatching(
            demo.reference,
            demo.comparison,
            auto,
            defaultNormalizationRules,
            defaultDecisionLayers
          );
          if (isMounted) {
            setResults(evaluatedResults);
            setStats(evaluatedStats);
            setComparisonWb(demo.comparison);
            clearTimeout(safetyTimer);
            setIsStorageLoading(false);
            return;
          }
        }

        // Studio language is loaded even before sign-in so the gate renders translated
        const savedLang = await getFromIDB<Language>(StorageKeys.LANGUAGE);
        if (savedLang && isMounted) {
          setLanguage(savedLang);
          try { localStorage.setItem('excelmatch_language', savedLang); } catch { /* ignore */ }
        }

        // Login-first: wait for auth to resolve, then require a signed-in user
        // for the studio (the sign-in gate renders otherwise).
        if (!authResolved) return;
        if (!cloudUser) {
          if (isMounted) {
            clearTimeout(safetyTimer);
            setIsStorageLoading(false);
          }
          return;
        }

        const savedRef = await getFromIDB<WorkbookData>(
          StorageKeys.REFERENCE_WORKBOOK
        );
        const savedComp = await getFromIDB<WorkbookData>(
          StorageKeys.COMPARISON_WORKBOOK
        );
        const savedMappings = await getFromIDB<ColumnMapping[]>(
          StorageKeys.COLUMN_MAPPINGS
        );
        const savedNorm = await getFromIDB<NormalizationRules>(
          StorageKeys.NORMALIZATION_RULES
        );
        const savedLayers = await getFromIDB<DecisionLayer[]>(
          StorageKeys.DECISION_LAYERS
        );
        const savedHoldColumn = await getFromIDB<string>(StorageKeys.HOLD_COLUMN);
        const savedHoldValues = await getFromIDB<string[]>(StorageKeys.HOLD_VALUES);
        const legacyHoldKeys = await getFromIDB<string[]>(StorageKeys.HOLD_KEYS);
        const savedHoldReason = await getFromIDB<string>(StorageKeys.HOLD_REASON);
        const savedReleased = await getFromIDB<string[]>(StorageKeys.RELEASED_ROWS);
        const savedResultsState = await getFromIDB<{
          results: MatchedRow[];
          stats: MatchingStats;
          filters: ResultFilters;
        }>(StorageKeys.RESULTS_STATE);
        const savedHistory = await getFromIDB<SyncHistoryEntry[]>(StorageKeys.SYNC_HISTORY);
        if (savedHistory && isMounted) {
          syncHistoryRef.current = savedHistory;
          setSyncHistory(savedHistory);
        }

        if (savedNorm && isMounted) setNormalization(savedNorm);
        if (savedLayers && savedLayers.length > 0 && isMounted) setLayers(savedLayers);
        if (savedHoldColumn !== null && savedHoldColumn !== undefined && isMounted) setHoldColumn(savedHoldColumn);
        if (isMounted) setHoldValues(savedHoldValues || legacyHoldKeys || []);
        if (savedHoldReason !== null && savedHoldReason !== undefined && isMounted) setHoldReason(savedHoldReason);
        if (savedReleased && isMounted) setReleasedRowIds(savedReleased);

        if (savedRef && isMounted) {
          setReferenceWb(savedRef);
          if (savedMappings) setMappings(savedMappings);
        }
        if (savedComp && isMounted) {
          setComparisonWb(savedComp);
        }
        // Restore cached results instantly; the cloud pull may overwrite with
        // newer synced results. Regenerate only when files exist but no cache.
        // (No demo seeding: with login-first, a fresh account starts empty.)
        if (savedResultsState && savedResultsState.results && savedResultsState.results.length > 0 && isMounted) {
          setResults(savedResultsState.results);
          setStats(savedResultsState.stats);
          if (savedResultsState.filters) {
            setResultFilters({ ...defaultResultFilters, ...savedResultsState.filters });
          }
        } else if (savedRef && savedComp && isMounted) {
          handleExecuteMatching(savedRef, savedComp, savedMappings || [], false);
        }
      } catch (e) {
        console.error('Storage loading error:', e);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setIsStorageLoading(false);
          if (cloudUser) setLocalReady(true);
        }
      }
    }

    loadSavedState();

    // Listen to URL changes (e.g. clicking shared links, back/forward button, or route changes)
    const handleUrlChange = () => {
      const sid = getShareIdFromUrl();
      setShareId(sid);
      if (sid) {
        setIsPreviewMode(true);
        fetchSharedSnapshot(sid).then((shared) => {
          if (shared) {
            lastCloudPreviewAtRef.current = shared.createdAt || 0;
            checkAndApplyPreview(shared);
          }
        });
        return;
      }
      const pData = parsePreviewFromUrl();
      if (pData) {
        checkAndApplyPreview(pData);
      } else {
        const isPreviewRoute =
          window.location.pathname.endsWith('/preview') ||
          window.location.pathname.endsWith('/preview/') ||
          window.location.hash.startsWith('#/preview') ||
          window.location.hash.includes('preview') ||
          window.location.search.includes('preview');
        setIsPreviewMode(isPreviewRoute);
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [authResolved, cloudUser?.uid]);

  // Clear results everywhere: local state, IDB cache and the cloud doc, so a
  // removed file leaves no stale results behind on any device.
  const clearResultsEverywhere = async () => {
    resultsPublishGenRef.current++; // invalidate any pending results publish
    pulledResultsRef.current = null;
    setResults([]);
    setStats(null);
    try { await deleteFromIDB(StorageKeys.RESULTS_STATE); } catch { /* ignore */ }
    if (cloudUser) {
      try { await deleteResultsState(cloudUser.uid); } catch (e) { console.warn('Failed to delete cloud results', e); }
    }
  };

  // Replace the Reference Workbook (Main File) with a newly uploaded file.
  // The old workbook is swapped out wholesale (never mutated in place); if the
  // Incoming file is already loaded, results are regenerated immediately so the
  // results and all data stay in sync until the next change.
  // Hold filter changes: persist, sync via the rules publish effect, and re-run matching
  const handleHoldSettingsChange = async (column: string, values: string[], reason: string) => {
    setHoldColumn(column);
    setHoldValues(values);
    setHoldReason(reason);
    await saveToIDB(StorageKeys.HOLD_COLUMN, column);
    await saveToIDB(StorageKeys.HOLD_VALUES, values);
    await saveToIDB(StorageKeys.HOLD_REASON, reason);
    if (referenceWb && comparisonWb) {
      handleExecuteMatching(referenceWb, comparisonWb, mappings, false, values, undefined, column);
    }
  };

  // Supervisor-confirmed release: delete the value from the hold settings, then
  // re-run matching. Released rows that matched & passed turn green; the rest
  // are forced to yellow (review) via releasedRowIds.
  const handleReleaseHoldKey = async (key: string) => {
    const normKey = key.trim().toLowerCase();
    const affected = results.filter((r) => r.isHold && (r.holdKey || '').toLowerCase() === normKey);
    // Delete by normalized comparison: stored values keep their original case
    const newHoldValues = holdValues.filter((v) => String(v ?? '').trim().toLowerCase() !== normKey);
    const newReleased = [...releasedRowIds];
    for (const r of affected) {
      if (!newReleased.includes(r.id)) newReleased.push(r.id);
    }
    setHoldValues(newHoldValues);
    setReleasedRowIds(newReleased);
    await saveToIDB(StorageKeys.HOLD_VALUES, newHoldValues);
    await saveToIDB(StorageKeys.RELEASED_ROWS, newReleased);
    // Original-case form of the key for display
    const displayKey = holdValues.find((v) => String(v ?? '').trim().toLowerCase() === normKey) ?? key;
    let green = 0;
    let yellow = 0;
    if (referenceWb && comparisonWb) {
      // Synchronous evaluation so the toast can report where the key data went
      const effMappings = mappings.length > 0 ? mappings : autoMapColumns(referenceWb.headers, comparisonWb.headers);
      const { results: next } = processMatching(
        referenceWb,
        comparisonWb,
        effMappings,
        normalization,
        layers,
        newHoldValues,
        newReleased,
        holdColumn
      );
      for (const r of next) {
        if (newReleased.includes(r.id)) {
          if (r.decisionColor === 'green') green++;
          else if (r.decisionColor === 'yellow') yellow++;
        }
      }
      handleExecuteMatching(referenceWb, comparisonWb, mappings, false, newHoldValues, newReleased, holdColumn);
    }
    return { key: displayKey, green, yellow, total: affected.length };
  };

  const handleSetReferenceWb = async (wb: WorkbookData | null) => {
    setReferenceWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, wb);
      let effectiveMappings = mappings;
      // Drop mappings that reference columns no longer present in the new file
      const validMappings = mappings.filter((m) => wb.headers.includes(m.mainCol));
      if (validMappings.length === 0 && comparisonWb) {
        const auto = autoMapColumns(wb.headers, comparisonWb.headers);
        if (auto.length > 0) {
          effectiveMappings = auto;
          setMappings(auto);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
        } else {
          effectiveMappings = [];
        }
      } else if (validMappings.length !== mappings.length) {
        effectiveMappings = validMappings;
        setMappings(validMappings);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, validMappings);
      }

      if (comparisonWb) {
        showToast(
          t.toastRefLoadedRegen.replace('{name}', wb.name),
          'info'
        );
        handleExecuteMatching(wb, comparisonWb, effectiveMappings, true);
      }
    } else {
      await deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK);
      // The old file is gone — its results must go too (cloud included)
      await clearResultsEverywhere();
    }
    publishWorkbooksNow(wb, comparisonWb);
  };

  const handleSetComparisonWb = async (wb: WorkbookData | null, autoEvaluate = true) => {
    const prevWb = comparisonWb;
    setComparisonWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, wb);
      // A genuinely new file invalidates row-positional release state
      // (row ids can't survive a file swap); key-based hold values are kept.
      if (
        prevWb &&
        (prevWb.name !== wb.name ||
          prevWb.rows.length !== wb.rows.length ||
          prevWb.headers.join('|') !== wb.headers.join('|'))
      ) {
        setReleasedRowIds([]);
        try { await deleteFromIDB(StorageKeys.RELEASED_ROWS); } catch { /* ignore */ }
      }
      let effectiveMappings = mappings;
      // If user has not yet defined any mappings, attempt auto-mapping
      if (effectiveMappings.length === 0 && referenceWb) {
        effectiveMappings = autoMapColumns(referenceWb.headers, wb.headers);
        if (effectiveMappings.length > 0) {
          setMappings(effectiveMappings);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, effectiveMappings);
        }
      }

      // If reference file is ready and autoEvaluate is enabled, immediately run matching and jump to Results & Export directly!
      if (referenceWb && autoEvaluate) {
        showToast(t.toastCompImported.replace('{name}', wb.name), 'info');
        handleExecuteMatching(referenceWb, wb, effectiveMappings, true);
      }
    } else {
      await deleteFromIDB(StorageKeys.COMPARISON_WORKBOOK);
      // The old file is gone — its results must go too (cloud included)
      await clearResultsEverywhere();
    }
    publishWorkbooksNow(referenceWb, wb);
  };

  // Switch Active Sheet for Main Reference File
  const handleSelectReferenceSheet = async (sheetName: string) => {
    if (!referenceWb || referenceWb.activeSheet === sheetName) return;

    const updatedWb = changeWorkbookSheet(referenceWb, sheetName);
    setReferenceWb(updatedWb);
    await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, updatedWb);
    publishWorkbooksNow(updatedWb, comparisonWb);

    // If new sheet has different columns, re-evaluate column mappings
    let effectiveMappings = mappings;
    if (comparisonWb) {
      const validMappings = mappings.filter((m) => updatedWb.headers.includes(m.mainCol));
      if (validMappings.length === 0) {
        effectiveMappings = autoMapColumns(updatedWb.headers, comparisonWb.headers);
        if (effectiveMappings.length > 0) {
          setMappings(effectiveMappings);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, effectiveMappings);
        }
      } else {
        effectiveMappings = validMappings;
      }

      showToast(
        t.toastRefSheetSwitched.replace('{sheet}', sheetName).replace('{rows}', updatedWb.rows.length.toLocaleString()).replace('{cols}', String(updatedWb.headers.length)),
        'info'
      );

      handleExecuteMatching(updatedWb, comparisonWb, effectiveMappings, true);
    } else {
      showToast(
        t.toastRefSheetSwitchedDone.replace('{sheet}', sheetName).replace('{rows}', updatedWb.rows.length.toLocaleString()).replace('{cols}', String(updatedWb.headers.length)),
        'success'
      );
    }
  };

  // Switch Active Sheet for Incoming Comparison File
  const handleSelectComparisonSheet = async (sheetName: string) => {
    if (!comparisonWb || comparisonWb.activeSheet === sheetName) return;

    const updatedWb = changeWorkbookSheet(comparisonWb, sheetName);
    setComparisonWb(updatedWb);
    await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, updatedWb);
    publishWorkbooksNow(referenceWb, updatedWb);

    let effectiveMappings = mappings;
    if (referenceWb) {
      const validMappings = mappings.filter((m) => updatedWb.headers.includes(m.comparisonCol));
      if (validMappings.length === 0) {
        effectiveMappings = autoMapColumns(referenceWb.headers, updatedWb.headers);
        if (effectiveMappings.length > 0) {
          setMappings(effectiveMappings);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, effectiveMappings);
        }
      } else {
        effectiveMappings = validMappings;
      }

      showToast(
        t.toastCompSheetSwitched.replace('{sheet}', sheetName).replace('{rows}', updatedWb.rows.length.toLocaleString()).replace('{cols}', String(updatedWb.headers.length)),
        'info'
      );

      handleExecuteMatching(referenceWb, updatedWb, effectiveMappings, true);
    } else {
      showToast(
        t.toastCompSheetSwitchedDone.replace('{sheet}', sheetName).replace('{rows}', updatedWb.rows.length.toLocaleString()).replace('{cols}', String(updatedWb.headers.length)),
        'success'
      );
    }
  };

  // Auto-save Settings
  const handleUpdateMappings = async (newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
    await saveToIDB(StorageKeys.COLUMN_MAPPINGS, newMappings);
  };

  const handleUpdateNormalization = async (newNorm: NormalizationRules) => {
    setNormalization(newNorm);
    await saveToIDB(StorageKeys.NORMALIZATION_RULES, newNorm);
  };

  const handleUpdateLayers = async (newLayers: DecisionLayer[]) => {
    setLayers(newLayers);
    await saveToIDB(StorageKeys.DECISION_LAYERS, newLayers);
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    try { localStorage.setItem('excelmatch_language', newLang); } catch { /* ignore */ }
    await saveToIDB(StorageKeys.LANGUAGE, newLang);
  };

  // Exit Live Preview and restore full studio editing
  const handleExitPreview = () => {
    setIsPreviewMode(false);
    if (window.history.pushState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.pushState(null, '', cleanUrl);
    } else {
      window.location.hash = '';
    }
    showToast(t.toastExitedPreview, 'info');
  };

  // Explicit Save Settings confirmation for user
  const handleSaveAllSettingsExplicit = async () => {
    await saveToIDB(StorageKeys.COLUMN_MAPPINGS, mappings);
    await saveToIDB(StorageKeys.NORMALIZATION_RULES, normalization);
    await saveToIDB(StorageKeys.DECISION_LAYERS, layers);
    showToast(
      t.toastRulesSaved,
      'success'
    );
  };

  // Load Built-in Demo Data
  const handleLoadSampleData = async () => {
    const demo = generateSampleDatasets();
    setReferenceWb(demo.reference);
    setComparisonWb(demo.comparison);
    const auto = mappings.length > 0 ? mappings : autoMapColumns(demo.reference.headers, demo.comparison.headers);
    if (mappings.length === 0) {
      setMappings(auto);
      await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
    }

    await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, demo.reference);
    await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, demo.comparison);
    publishWorkbooksNow(demo.reference, demo.comparison);

    showToast(t.toastSampleLoaded, 'success');
    handleExecuteMatching(demo.reference, demo.comparison, auto, true);
  };

  // Execute Matching & Decision Rules
  const handleExecuteMatching = (
    customRef?: WorkbookData | null,
    customComp?: WorkbookData | null,
    customMappings?: ColumnMapping[],
    notifySuccess = true,
    customHoldValues?: string[],
    customReleasedRowIds?: string[],
    customHoldColumn?: string
  ) => {
    const ref = customRef !== undefined ? customRef : referenceWb;
    const comp = customComp !== undefined ? customComp : comparisonWb;

    if (!ref || !comp) {
      showToast(t.toastBothFilesRequired, 'error');
      return;
    }

    let effectiveMappings = customMappings || mappings;
    if (effectiveMappings.length === 0) {
      effectiveMappings = autoMapColumns(ref.headers, comp.headers);
      if (effectiveMappings.length > 0) {
        setMappings(effectiveMappings);
        saveToIDB(StorageKeys.COLUMN_MAPPINGS, effectiveMappings);
      }
    }

    if (effectiveMappings.length === 0) {
      showToast(t.toastMappingRequired, 'error');
      setIsRulesModalOpen(true);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const { results: evaluatedResults, stats: evaluatedStats } = processMatching(
          ref,
          comp,
          effectiveMappings,
          normalization,
          layers,
          customHoldValues !== undefined ? customHoldValues : holdValues,
          customReleasedRowIds !== undefined ? customReleasedRowIds : releasedRowIds,
          customHoldColumn !== undefined ? customHoldColumn : holdColumn
        );

        setResults(evaluatedResults);
        setStats(evaluatedStats);

        // Keep local preview cache in sync for immediate /preview viewing
        try {
          localStorage.setItem(
            'emp_shared_preview_latest',
            JSON.stringify({
              version: 2,
              createdAt: Date.now(),
              comparisonWbName: comp.name || 'Evaluation_Results',
              stats: evaluatedStats,
              results: evaluatedResults,
              filter: 'all',
              searchTerm: '',
              searchColumn: 'all',
            })
          );
        } catch (e) {
          console.warn('Could not cache preview locally', e);
        }

        if (notifySuccess) {
          showToast(
            t.toastEvaluatedSummary.replace('{total}', String(evaluatedStats.totalIncoming)).replace('{green}', String(evaluatedStats.greenCount)).replace('{yellow}', String(evaluatedStats.yellowCount)).replace('{red}', String(evaluatedStats.redCount)),
            'success'
          );
        }
        if (evaluatedStats.blueCount > 0) {
          showToast(
            t.toastHoldFound.replace('{n}', String(evaluatedStats.blueCount)),
            'info'
          );
        }
      } catch (err: any) {
        showToast(err.message || t.toastMatchingError, 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  // Login-first: the studio requires a signed-in user so files, settings and
  // results sync from the cloud. Public share-preview links stay open.
  if (!isPreviewMode && authResolved && !cloudUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.appName}</h1>
            <p className="text-sm font-semibold text-slate-700">{t.gateTitle}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{t.gateDesc}</p>
          </div>
          <button
            onClick={handleCloudSignIn}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <Cloud className="w-4 h-4" />
            {t.gateSignIn}
          </button>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400">{t.headerSelectLanguage}:</span>
            {(['en', 'my', 'th', 'zh'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  language === l
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isStorageLoading) {
    return <GlobalLoadingSkeleton language={language} />;
  }

  // "Download Data from cloud" overlay while the login pull is in flight
  const cloudPullOverlay = isCloudPulling && !isPreviewMode && (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl px-7 py-6 shadow-xl flex items-center gap-4 max-w-sm w-full">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{t.cloudDownloading}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t.cloudDownloadingSub}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {cloudPullOverlay}
      {/* 1. Header (Adapts cleanly to Studio or Preview mode) */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        cloudUser={cloudUser}
        onCloudSignIn={handleCloudSignIn}
        onCloudSignOut={handleCloudSignOut}
        isUploading={isUploading}
        onOpenSyncPanel={() => setIsSyncPanelOpen(true)}
        onOpenRulesSetting={() => setIsRulesModalOpen(true)}
        hasRefFile={!!referenceWb}
        hasCompFile={!!comparisonWb}
        hasResults={results.length > 0}
        isPreviewMode={isPreviewMode}
        onExitPreview={handleExitPreview}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Preview Mode: Show ONLY the Table & its toolbar (no file uploaders, no giant banners) */}
        {isPreviewMode ? (
          <div className="space-y-4">
            {results.length > 0 && stats ? (
              <ResultsDashboard
                results={results}
                stats={stats}
                comparisonWb={comparisonWb}
                language={language}
                onShowToast={showToast}
                isPreviewMode={true}
                initialFilter={previewFilter}
                initialOnlyAccept={previewOnlyAccept}
                initialSearchTerm={previewSearchTerm}
                initialSearchColumn={previewSearchColumn}
                initialColumnConfigs={previewColumnConfigs}
                onExitPreview={handleExitPreview}
                onRefresh={() => {
                  const pData = parsePreviewFromUrl();
                  if (pData) {
                    checkAndApplyPreview(pData);
                  }
                  showToast(t.toastPreviewRefreshed, 'success');
                }}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {t.previewNoResultsTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.previewNoResultsDesc}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Main Studio: Unified single-page workflow with File Management and Filtered Results */
          <div className="space-y-8">
            {/* File Management Section */}
            <FilesManagement
              referenceWb={referenceWb}
              comparisonWb={comparisonWb}
              onSetReferenceWb={handleSetReferenceWb}
              onSetComparisonWb={handleSetComparisonWb}
              onSelectReferenceSheet={handleSelectReferenceSheet}
              onSelectComparisonSheet={handleSelectComparisonSheet}
              onPreviewWb={(wb, title) =>
                setPreviewModal({ isOpen: true, workbook: wb, title })
              }
              language={language}
              onShowToast={showToast}
            />

            {/* Filtered Results & Table Section (Immediately shown below after import) */}
            {results.length > 0 && stats && (
              <div className="pt-2 border-t border-slate-200">
                <ResultsDashboard
                  key={`studio-${studioSession}`}
                  results={results}
                  stats={stats}
                  comparisonWb={comparisonWb}
                  language={language}
                  onShowToast={showToast}
                  isPreviewMode={false}
                  initialFilter={isValidFilter(resultFilters.activeFilter) ? resultFilters.activeFilter : 'all'}
                  initialOnlyAccept={resultFilters.onlyAccept}
                  initialSearchTerm={resultFilters.searchTerm}
                  initialSearchColumn={resultFilters.searchColumn}
                  initialColumnConfigs={previewColumnConfigs}
                  cloudUser={cloudUser}
                  holdReason={holdReason}
                  onReleaseHoldKey={handleReleaseHoldKey}
                  onViewStateChange={handleViewStateChange}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cloud Sync Status & History */}
      <SyncHistoryModal
        isOpen={isSyncPanelOpen}
        onClose={() => setIsSyncPanelOpen(false)}
        language={language}
        isUploading={isUploading}
        uploadLabel={uploadLabel}
        history={syncHistory}
        onClearHistory={clearSyncHistory}
      />

      {/* Rules & Logic Settings Modal */}
      <RulesLogicModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        referenceWb={referenceWb}
        comparisonWb={comparisonWb}
        mappings={mappings}
        normalization={normalization}
        layers={layers}
        onUpdateMappings={handleUpdateMappings}
        onUpdateNormalization={handleUpdateNormalization}
        onUpdateLayers={handleUpdateLayers}
        onSaveSettings={handleSaveAllSettingsExplicit}
        onExecuteMatching={() => handleExecuteMatching()}
        isProcessing={isProcessing}
        language={language}
        onShowToast={showToast}
        holdColumn={holdColumn}
        holdValues={holdValues}
        holdReason={holdReason}
        onHoldSettingsChange={handleHoldSettingsChange}
      />



      {/* Global Data Preview Modal */}
      <DataPreviewModal
        language={language}
        workbook={previewModal.workbook}
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, workbook: null, title: '' })
        }
        title={previewModal.title}
        onSelectSheet={(sheetName) => {
          if (previewModal.workbook?.id === referenceWb?.id) {
            handleSelectReferenceSheet(sheetName);
          } else if (previewModal.workbook?.id === comparisonWb?.id) {
            handleSelectComparisonSheet(sheetName);
          }
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} language={language} />
    </div>
  );
}
