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
  ActiveUpload,
  SavedMappingPreset,
  SavedDecisionPreset,
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
import { CountryFlag, GoogleIcon } from './components/CountryFlag';
import { RippleButton } from './components/RippleButton';
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
import { LOGO_DATA_URL } from './assets/logo';
import {
  publishRulesState,
  fetchRulesState,
  publishColumnConfigs,
  fetchColumnConfigs,
  subscribePreviewSnapshot,
  fetchPreviewSnapshot,
  subscribeSharedSnapshot,
  fetchSharedSnapshot,
  unpublishSharedSnapshot,
  debounce,
  publishWorkbooks,
  fetchWorkbooks,
  publishResultsState,
  publishResultFilters,
  fetchResultsState,
  deleteResultsState,
  isCloudDocUploading,
  publishSyncHistory,
  fetchSyncHistory,
  FIXED_PREVIEW_SHARE_ID,
  defaultResultFilters,
  wipeCloudWorkspace,
} from './lib/cloudSync';
import type { ResultFilters, StoredColumnSettings } from './lib/cloudSync';
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
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // UI Theme state (Light / Dark mode) with persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      try { localStorage.setItem('theme', theme); } catch {}
    }
  }, [theme]);

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
  // Public live-share id from ?share=... (viewable without sign-in).
  // For the bare /preview fixed link this becomes FIXED_PREVIEW_SHARE_ID.
  const [shareId, setShareId] = useState<string | null>(() => getShareIdFromUrl());
  const [previewLoading, setPreviewLoading] = useState(false);
  const shareRevokedToastShownRef = useRef(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'blue' | 'unmatched'>('all');
  const [previewOnlyAccept, setPreviewOnlyAccept] = useState<boolean>(true);
  const [previewSearchTerm, setPreviewSearchTerm] = useState<string>('');
  const [previewSearchColumn, setPreviewSearchColumn] = useState<string>('all');
  const [previewColumnConfigs, setPreviewColumnConfigs] = useState<ColumnConfigItem[] | undefined>(undefined);
  const [studioColumnConfigs, setStudioColumnConfigs] = useState<ColumnConfigItem[] | undefined>(undefined);

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
  const [guestMode, setGuestMode] = useState(false);
  // Synced view state for the results (filter tab, search, Only Accept)
  const [resultFilters, setResultFilters] = useState<ResultFilters>(defaultResultFilters);
  // Bumped when cloud results are applied so the dashboard remounts with them
  const [studioSession, setStudioSession] = useState(0);
  // True while the login pull is downloading the workspace from the cloud
  const [isCloudPulling, setIsCloudPulling] = useState(false);
  // Cloud upload tracking: real upload-manager state (progress ring + history)
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const activeUploadsRef = useRef<Record<string, ActiveUpload>>({});
  const syncHistoryRef = useRef<SyncHistoryEntry[]>([]);
  // Tracks results that came straight from a cloud pull (skip re-publish echo)
  const pulledResultsRef = useRef<MatchedRow[] | null>(null);
  const rulesStateRef = useRef({ normalization, layers, mappings, holdColumn, holdValues, holdReason, releasedRowIds });
  rulesStateRef.current = { normalization, layers, mappings, holdColumn, holdValues, holdReason, releasedRowIds };
  const lastRulesPublishRef = useRef<string>('');
  const lastCloudPreviewAtRef = useRef<number>(0);
  const publicPreviewAppliedRef = useRef<boolean>(false);

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
  const uidRef = useRef<string | null>(null);

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
        uploadedAt: pData.comparisonWbUploadedAt,
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
      uidRef.current = u ? u.uid : null;
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
    attempts = 3,
    onProgress?: (done: number, total: number) => void
  ): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      if (await publishWorkbooks(uid, wbs, onProgress)) return true;
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
        const [cloudRules, cloudColConfigs, cloudWbs, cloudResults, wbsUploading, resultsUploading, cloudHistory] = await Promise.all([
          fetchRulesState(cloudUser.uid),
          fetchColumnConfigs(cloudUser.uid),
          fetchWorkbooks(cloudUser.uid),
          fetchResultsState(cloudUser.uid),
          isCloudDocUploading(cloudUser.uid, 'workbooks'),
          isCloudDocUploading(cloudUser.uid, 'results'),
          fetchSyncHistory(cloudUser.uid),
        ]);

        // Upload history: merge the cloud log with this device's log so every
        // device sees every upload (union by id, newest first, capped).
        // A cloud-side clear (clearedAt) drops entries from before the clear.
        if (cloudHistory) {
          const clearedAt = cloudHistory.clearedAt || 0;
          const seen = new Set<string>();
          const merged: SyncHistoryEntry[] = [];
          const consider = (e: SyncHistoryEntry) => {
            if (!e || !e.id || seen.has(e.id)) return;
            if (e.time < clearedAt) return;
            seen.add(e.id);
            merged.push(e);
          };
          syncHistoryRef.current.forEach(consider);
          cloudHistory.entries.forEach(consider);
          merged.sort((a, b) => b.time - a.time);
          const capped = merged.slice(0, 50);
          syncHistoryRef.current = capped;
          setSyncHistory(capped);
          await saveToIDB(StorageKeys.SYNC_HISTORY, capped);
        } else if (syncHistoryRef.current.length > 0) {
          // First device with history seeds the cloud log
          await publishSyncHistory(cloudUser.uid, syncHistoryRef.current);
        }

        let effMappings = rulesStateRef.current.mappings;
        let effHoldColumn = rulesStateRef.current.holdColumn;
        let effHoldValues = rulesStateRef.current.holdValues;
        let effReleased = rulesStateRef.current.releasedRowIds;
        let effRef = refWbRef.current;
        let effComp = compWbRef.current;

        // Restore column configs (Column View Settings) from cloud so every device opens with same column order & visibility
        const effectiveColSettings = cloudColConfigs || cloudRules?.columnConfigs;
        if (effectiveColSettings && Array.isArray(effectiveColSettings.order) && effectiveColSettings.order.length > 0) {
          try {
            localStorage.setItem('excelmatch_column_settings_v2', JSON.stringify(effectiveColSettings));
            localStorage.setItem('emp_column_configs', JSON.stringify(effectiveColSettings));
            await saveToIDB(StorageKeys.COLUMN_CONFIGS, effectiveColSettings);
            const configs: ColumnConfigItem[] = effectiveColSettings.order.map((id) => ({
              id,
              label: id,
              category: 'data',
              showInTable: effectiveColSettings.visibility?.[id]?.table !== false,
              showInExport: effectiveColSettings.visibility?.[id]?.export !== false,
            }));
            setStudioColumnConfigs(configs);
          } catch (e) {
            console.warn('Could not store pulled column configs', e);
          }
        }

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
          if (cloudRules.mappingPresets && Array.isArray(cloudRules.mappingPresets)) {
            await saveToIDB(StorageKeys.SAVED_MAPPING_PRESETS, cloudRules.mappingPresets);
          }
          if (cloudRules.decisionPresets && Array.isArray(cloudRules.decisionPresets)) {
            await saveToIDB(StorageKeys.SAVED_DECISION_PRESETS, cloudRules.decisionPresets);
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
          const mapPresets = (await getFromIDB<SavedMappingPreset[]>(StorageKeys.SAVED_MAPPING_PRESETS)) || [];
          const decPresets = (await getFromIDB<SavedDecisionPreset[]>(StorageKeys.SAVED_DECISION_PRESETS)) || [];
          let curColConfigs: StoredColumnSettings | undefined = undefined;
          try {
            const raw = localStorage.getItem('excelmatch_column_settings_v2');
            if (raw) curColConfigs = JSON.parse(raw);
          } catch {}
          await publishRulesState(cloudUser.uid, {
            ...cur,
            mappingPresets: mapPresets,
            decisionPresets: decPresets,
            columnConfigs: curColConfigs,
          });
          if (curColConfigs) {
            await publishColumnConfigs(cloudUser.uid, curColConfigs);
          }
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

        // While the cloud doc is mid-upload, keep local files untouched:
        // never seed over it, mirror it, or apply a partial payload.
        if (wbsUploading) {
          console.log('Cloud pull: workbooks mid-upload on another device — keeping local files');
        } else if (cloudWbs && cloudWbs.updatedAt) {
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
          !wbsUploading &&
          cloudResults &&
          cloudResults.results.length > 0 &&
          effRef &&
          effComp &&
          (!cloudWbs || !cloudWbs.updatedAt || cloudResults.updatedAt >= cloudWbs.updatedAt);
        // While the cloud results are mid-upload, keep local results untouched:
        // never apply a partial payload or regenerate over it.
        if (resultsUploading) {
          console.log('Cloud pull: results mid-upload on another device — keeping local results');
        } else if (resultsFresh) {
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

  const pickActiveUpload = useCallback(() => {
    const m = activeUploadsRef.current;
    const next = m['file'] || m['settings'] || m['results'] || null;
    setActiveUpload(next ? { ...next } : null);
  }, []);

  const beginUpload = useCallback((kind: ActiveUpload['kind'], label: string, fileName: string) => {
    activeUploadsRef.current[kind] = { kind, label, fileName, done: 0, total: 0 };
    pickActiveUpload();
  }, [pickActiveUpload]);

  const updateUploadProgress = useCallback((kind: ActiveUpload['kind'], done: number, total: number) => {
    const cur = activeUploadsRef.current[kind];
    if (!cur) return;
    activeUploadsRef.current[kind] = { ...cur, done, total };
    pickActiveUpload();
  }, [pickActiveUpload]);

  const debouncedPublishHistory = useRef(
    debounce((uid: string, history: SyncHistoryEntry[]) => {
      publishSyncHistory(uid, history);
    }, 2000)
  ).current;

  const endUpload = useCallback((entry: { kind: 'file' | 'settings' | 'results'; title: string; status: 'done' | 'failed' }) => {
    delete activeUploadsRef.current[entry.kind];
    pickActiveUpload();
    const full: SyncHistoryEntry = {
      ...entry,
      id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: Date.now(),
    };
    const next = [full, ...syncHistoryRef.current].slice(0, 50);
    syncHistoryRef.current = next;
    setSyncHistory(next);
    saveToIDB(StorageKeys.SYNC_HISTORY, next).catch(() => {});
    // Sync the log to the cloud so other devices see this upload too
    if (uidRef.current) debouncedPublishHistory(uidRef.current, next);
  }, [pickActiveUpload, debouncedPublishHistory]);

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
    if (uidRef.current) {
      try { await publishSyncHistory(uidRef.current, [], Date.now()); } catch { /* ignore */ }
    }
  }, []);

  // Publish rule settings to the cloud whenever they change (optimized debounce).
  const debouncedPublishRules = useRef(
    debounce((uid: string, st: { normalization: NormalizationRules; layers: DecisionLayer[]; mappings: ColumnMapping[]; holdColumn: string; holdValues: string[]; holdReason: string; releasedRowIds: string[] }, reason: string) => {
      const key = JSON.stringify({ n: st.normalization, l: st.layers, m: st.mappings, hc: st.holdColumn, h: st.holdValues, hr: st.holdReason, rr: st.releasedRowIds });
      if (key === lastRulesPublishRef.current) return;
      lastRulesPublishRef.current = key;
      const tt = tRef.current;
      beginUpload('settings', tt.syncSettingsLabel, reason);
      publishRulesState(uid, st).then((ok) => {
        endUpload({ kind: 'settings', title: reason, status: ok ? 'done' : 'failed' });
        if (ok) showToast(tt.toastCloudSettingsUploaded, 'success');
        else showToast(tt.toastCloudSettingsSyncFailed, 'error');
      });
    }, 500)
  ).current;

  useEffect(() => {
    if (!cloudUser || isPreviewMode || !localReady || !didCloudPullRef.current) return;
    const cur = rulesStateRef.current;
    const reason = describeRulesChange(lastRulesPublishRef.current, {
      n: cur.normalization, l: cur.layers, m: cur.mappings,
      hc: cur.holdColumn, h: cur.holdValues, hr: cur.holdReason, rr: cur.releasedRowIds,
    });
    debouncedPublishRules(cloudUser.uid, cur, reason);
    return () => debouncedPublishRules.cancel();
  }, [cloudUser, isPreviewMode, localReady, normalization, layers, mappings, holdColumn, holdValues, holdReason, releasedRowIds, debouncedPublishRules, describeRulesChange]);

  // Publish evaluated results to the cloud whenever matching is executed.
  // Pull-applied results are skipped via pulledResultsRef (no echo).
  // The generation guard drops a pending publish after results are cleared.
  const resultsPublishGenRef = useRef(0);
  const debouncedPublishResults = useRef(
    debounce((uid: string, state: { results: MatchedRow[]; stats: MatchingStats; filters: ResultFilters }, gen: number) => {
      if (gen !== resultsPublishGenRef.current) return;
      const tt = tRef.current;
      beginUpload('results', tt.syncResultsLabel, `${state.results.length}`);
      publishResultsState(uid, state, (done, total) =>
        updateUploadProgress('results', done, total)
      ).then((ok) => {
        endUpload({ kind: 'results', title: `${tt.syncResultsLabel} (${state.results.length})`, status: ok ? 'done' : 'failed' });
        if (ok) showToast(tt.toastCloudResultsUploaded, 'success');
        else showToast(tt.toastCloudResultsSyncFailed, 'error');
      });
      // Keep the local instant-paint cache in step
      saveToIDB(StorageKeys.RESULTS_STATE, state).catch(() => {});
    }, 500)
  );

  // Dedicated lightweight filter updater: updates metadata only, never re-uploads whole dataset
  const debouncedPublishResultFilters = useRef(
    debounce((uid: string, filters: ResultFilters) => {
      publishResultFilters(uid, filters);
    }, 400)
  ).current;

  // Trigger full chunked upload ONLY when results or stats actually change
  useEffect(() => {
    if (!cloudUser || isPreviewMode || !localReady || !didCloudPullRef.current) return;
    if (results.length === 0 || !stats) return;
    if (pulledResultsRef.current === results) {
      return;
    }
    pulledResultsRef.current = null;
    debouncedPublishResults.current(cloudUser.uid, { results, stats, filters: resultFilters }, resultsPublishGenRef.current);
    return () => debouncedPublishResults.current.cancel();
  }, [cloudUser, isPreviewMode, localReady, results, stats, debouncedPublishResults]);

  // When only view filters change, publish lightweight filter metadata (super fast, no re-chunking)
  useEffect(() => {
    if (!cloudUser || isPreviewMode || !localReady || !didCloudPullRef.current) return;
    if (results.length === 0 || !stats) return;
    debouncedPublishResultFilters(cloudUser.uid, resultFilters);
    return () => debouncedPublishResultFilters.cancel();
  }, [cloudUser, isPreviewMode, localReady, resultFilters, debouncedPublishResultFilters]);

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
      beginUpload('file', tt.syncFilesLabel, names);
      publishWorkbooksWithRetry(uid, wbs, 3, (done, total) =>
        updateUploadProgress('file', done, total)
      ).then((ok) => {
        endUpload({ kind: 'file', title: names, status: ok ? 'done' : 'failed' });
        if (ok) showToast(tt.toastCloudFilesUploaded, 'success');
        else showToast(tt.toastCloudFilesSyncFailed, 'error');
      });
    }, 300)
  ).current;

  const publishWorkbooksNow = (refWb: WorkbookData | null, compWb: WorkbookData | null) => {
    if (cloudUser) debouncedPublishWorkbooks(cloudUser.uid, { reference: refWb, comparison: compWb });
  };

  // Live public share: follow the shared snapshot in real time (no sign-in required).
  // If the owner turns sharing off, the last received snapshot stays visible.
  useEffect(() => {
    if (!shareId || !isPreviewMode) return;
    const unsub = subscribeSharedSnapshot(shareId, async (meta) => {
      if (meta === null) {
        if (!shareRevokedToastShownRef.current) {
          shareRevokedToastShownRef.current = true;
          showToast(t.toastShareRevoked, 'info');
        }
        setPreviewLoading(false);
        return;
      }
      if (!meta.updatedAt || meta.updatedAt <= lastCloudPreviewAtRef.current) {
        setPreviewLoading(false);
        return;
      }
      lastCloudPreviewAtRef.current = meta.updatedAt;
      const pData = await fetchSharedSnapshot(shareId);
      if (pData && checkAndApplyPreview(pData)) {
        showToast(t.toastPreviewSynced, 'success');
      }
      setPreviewLoading(false);
    });
    return () => unsub();
  }, [shareId, isPreviewMode, checkAndApplyPreview, showToast]);

  // Live cloud preview: while signed in, the preview page follows the latest
  // snapshot published by the studio — on any device, no refresh needed.
  // Skip if the public shares/latest slot already provided data (it's the source of truth).
  useEffect(() => {
    if (!cloudUser || !isPreviewMode) return;
    if (publicPreviewAppliedRef.current) return;
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
      activeUploadsRef.current = {};
      setActiveUpload(null);
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

  const handleRestoreOriginalStage = async () => {
    setIsRestoring(true);
    try {
      // 1. Wipe cloud workspace documents in Firestore if user is signed in
      if (cloudUser) {
        await wipeCloudWorkspace(cloudUser.uid);
      } else {
        try { await unpublishSharedSnapshot(FIXED_PREVIEW_SHARE_ID); } catch {}
      }

      // 2. Wipe all IndexedDB keys
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
        StorageKeys.COLUMN_CONFIGS,
        StorageKeys.SAVED_MAPPING_PRESETS,
        StorageKeys.SAVED_DECISION_PRESETS,
      ]) {
        try { await deleteFromIDB(k); } catch { /* ignore */ }
      }

      // 3. Wipe localStorage keys
      try {
        const lsKeys = Object.keys(localStorage);
        for (const k of lsKeys) {
          if (k.startsWith('excelmatch_') || k.startsWith('emp_')) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      // 4. Reset all in-memory React states to empty/defaults
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
      setStudioColumnConfigs(undefined);
      setPreviewColumnConfigs(undefined);
      setResultFilters(defaultResultFilters);
      syncHistoryRef.current = [];
      setSyncHistory([]);
      activeUploadsRef.current = {};
      setActiveUpload(null);
      pulledResultsRef.current = null;
      lastRulesPublishRef.current = '';
      setStudioSession((n) => n + 1);

      showToast('Restored to original stage. All cloud and local data cleared.', 'success');
      setIsRestoreModalOpen(false);
    } catch (err: any) {
      console.error('Failed to restore original stage', err);
      showToast('Error restoring original stage: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // Dedicated loader for Live Preview Mode: runs independently of Firebase Auth state
  // to ensure preview snapshots download completely without auth race condition cancellation.
  useEffect(() => {
    const isPreview =
      typeof window !== 'undefined' &&
      (window.location.pathname.endsWith('/preview') ||
        window.location.pathname.endsWith('/preview/') ||
        window.location.hash.startsWith('#/preview') ||
        window.location.hash.includes('preview') ||
        window.location.search.includes('preview') ||
        getShareIdFromUrl() !== null);

    if (!isPreview) return;

    let active = true;
    setIsPreviewMode(true);
    setPreviewLoading(true);

    const loadPreviewData = async () => {
      try {
        // Priority 0: Explicit public share id (?share=... or #share=...)
        const urlShareId = getShareIdFromUrl();
        if (urlShareId) {
          setShareId(urlShareId);
          const shared = await fetchSharedSnapshot(urlShareId);
          if (shared && active) {
            lastCloudPreviewAtRef.current = shared.createdAt || 0;
            checkAndApplyPreview(shared);
            setPreviewLoading(false);
            setIsStorageLoading(false);
            return;
          }
        }

        // Priority 1: URL Hash embedded payload (#preview=...)
        const hashData = parsePreviewFromUrl();
        if (hashData && hashData.results && hashData.results.length > 0) {
          if (active) {
            checkAndApplyPreview(hashData);
            setPreviewLoading(false);
            setIsStorageLoading(false);
            return;
          }
        }

        // Priority 2: Fixed public slot (/preview -> shares/latest)
        setShareId(FIXED_PREVIEW_SHARE_ID);
        const fixed = await fetchSharedSnapshot(FIXED_PREVIEW_SHARE_ID);
        if (fixed && active) {
          lastCloudPreviewAtRef.current = fixed.createdAt || 0;
          publicPreviewAppliedRef.current = true;
          checkAndApplyPreview(fixed);
          setPreviewLoading(false);
          setIsStorageLoading(false);
          return;
        }

        // Priority 3: Fallback to local storage cache if opened on same machine
        if (active) {
          const cached = parsePreviewFromUrl();
          if (cached && checkAndApplyPreview(cached)) {
            setPreviewLoading(false);
            setIsStorageLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load shared preview:', err);
      } finally {
        if (active) {
          setPreviewLoading(false);
          setIsStorageLoading(false);
        }
      }
    };

    loadPreviewData();

    const handleUrlChange = () => {
      loadPreviewData();
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      active = false;
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [checkAndApplyPreview]);

  // Initial Load from Persistent Storage & Live Preview Link Handling
  useEffect(() => {
    let isMounted = true;
    // Safety guard: max 1200ms loading skeleton time
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsStorageLoading(false);
    }, 1200);

    async function loadSavedState() {
      try {
        // Preview mode is handled by the dedicated preview loader effect
        const isPreviewRoute =
          window.location.pathname.endsWith('/preview') ||
          window.location.pathname.endsWith('/preview/') ||
          window.location.hash.startsWith('#/preview') ||
          window.location.hash.includes('preview') ||
          window.location.search.includes('preview');

        if (isPreviewRoute || isPreviewMode) {
          if (isMounted) {
            clearTimeout(safetyTimer);
            setIsStorageLoading(false);
          }
          return;
        }

        // Studio language is loaded even before sign-in so the gate renders translated
        const savedLang = await getFromIDB<Language>(StorageKeys.LANGUAGE);
        if (savedLang && isMounted) {
          setLanguage(savedLang);
          try { localStorage.setItem('excelmatch_language', savedLang); } catch { /* ignore */ }
        }

        // Login-first: wait for auth to resolve, then require signed-in user or guestMode
        if (!authResolved) return;
        if (!cloudUser && !guestMode) {
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

        if (savedMappings && isMounted) {
          setMappings(savedMappings);
        }
        if (savedRef && isMounted) {
          setReferenceWb(savedRef);
        }
        if (savedComp && isMounted) {
          setComparisonWb(savedComp);
        }

        const savedColSettings = await getFromIDB<StoredColumnSettings>(StorageKeys.COLUMN_CONFIGS);
        if (savedColSettings && Array.isArray(savedColSettings.order) && isMounted) {
          try {
            localStorage.setItem('excelmatch_column_settings_v2', JSON.stringify(savedColSettings));
            localStorage.setItem('emp_column_configs', JSON.stringify(savedColSettings));
            const configs: ColumnConfigItem[] = savedColSettings.order.map((id) => ({
              id,
              label: id,
              category: 'data',
              showInTable: savedColSettings.visibility?.[id]?.table !== false,
              showInExport: savedColSettings.visibility?.[id]?.export !== false,
            }));
            setStudioColumnConfigs(configs);
          } catch {}
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
          if (cloudUser || guestMode) setLocalReady(true);
        }
      }
    }

    loadSavedState();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [authResolved, cloudUser?.uid, guestMode, isPreviewMode]);

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
    // No results left: take the fixed public preview link down too
    try { await unpublishSharedSnapshot(FIXED_PREVIEW_SHARE_ID); } catch { /* ignore */ }
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
      // If user has not yet configured any mappings and comparison file exists, attempt auto-mapping
      if (effectiveMappings.length === 0 && comparisonWb) {
        const auto = autoMapColumns(wb.headers, comparisonWb.headers);
        if (auto.length > 0) {
          effectiveMappings = auto;
          setMappings(auto);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
        }
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
    // Stamp when the user loads/replaces the file (pull/load paths bypass this handler)
    const stamped = wb ? { ...wb, uploadedAt: Date.now() } : null;
    setComparisonWb(stamped);
    if (stamped) {
      const wb = stamped;
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
    publishWorkbooksNow(referenceWb, stamped);
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

  // Explicit Save Settings confirmation for user - immediately persists locally and pushes to Cloud
  const handleSaveAllSettingsExplicit = async () => {
    await saveToIDB(StorageKeys.COLUMN_MAPPINGS, mappings);
    await saveToIDB(StorageKeys.NORMALIZATION_RULES, normalization);
    await saveToIDB(StorageKeys.DECISION_LAYERS, layers);
    await saveToIDB(StorageKeys.HOLD_COLUMN, holdColumn);
    await saveToIDB(StorageKeys.HOLD_VALUES, holdValues);
    await saveToIDB(StorageKeys.HOLD_REASON, holdReason);
    await saveToIDB(StorageKeys.RELEASED_ROWS, releasedRowIds);

    const mappingPresets = (await getFromIDB<SavedMappingPreset[]>(StorageKeys.SAVED_MAPPING_PRESETS)) || [];
    const decisionPresets = (await getFromIDB<SavedDecisionPreset[]>(StorageKeys.SAVED_DECISION_PRESETS)) || [];

    let colSettings: StoredColumnSettings | undefined = undefined;
    try {
      const raw = localStorage.getItem('excelmatch_column_settings_v2') || localStorage.getItem('emp_column_configs');
      if (raw) colSettings = JSON.parse(raw);
    } catch {}

    if (colSettings) {
      await saveToIDB(StorageKeys.COLUMN_CONFIGS, colSettings);
    }

    if (cloudUser) {
      const tt = tRef.current;
      beginUpload('settings', tt.syncSettingsLabel, 'Explicit save');
      const payload = {
        normalization,
        layers,
        mappings,
        holdColumn,
        holdValues,
        holdReason,
        releasedRowIds,
        mappingPresets,
        decisionPresets,
        columnConfigs: colSettings,
      };
      const ok = await publishRulesState(cloudUser.uid, payload);
      if (colSettings) {
        await publishColumnConfigs(cloudUser.uid, colSettings);
      }
      lastRulesPublishRef.current = JSON.stringify({
        n: normalization,
        l: layers,
        m: mappings,
        hc: holdColumn,
        h: holdValues,
        hr: holdReason,
        rr: releasedRowIds,
      });
      endUpload({ kind: 'settings', title: tt.syncSettingsLabel, status: ok ? 'done' : 'failed' });
    }
    showToast(
      cloudUser ? `${t.toastRulesSaved} (Synced to Cloud)` : t.toastRulesSaved,
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
  if (!isPreviewMode && authResolved && !cloudUser && !guestMode) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 sm:p-10 w-full max-w-[430px] shadow-[0_12px_36px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] text-center space-y-5 transition-all">
          <img
            src={LOGO_DATA_URL}
            alt="Excellent Medical Technology"
            className="h-14 sm:h-16 w-auto mx-auto object-contain opacity-95"
          />
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-heading">
              {t.appName}
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              Created by <span className="font-semibold text-emerald-600 dark:text-emerald-400">DO2-HPT</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 pt-1.5">{t.gateTitle}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">{t.gateDesc}</p>
          </div>
          <div className="space-y-2.5 pt-1.5">
            {/* 1. Primary Sign-In with Refined Clean Emerald Styling */}
            <RippleButton
              onClick={handleCloudSignIn}
              rippleColor="rgba(255, 255, 255, 0.35)"
              enableScaleHover={true}
              title={t.gateSignIn}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl border border-emerald-500/40 shadow-sm hover:shadow-md transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4 shrink-0 text-white" monochrome={true} />
              <span>{t.gateSignIn}</span>
            </RippleButton>

            {/* Layout divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
              <span className="absolute px-2.5 bg-white dark:bg-[#111827] text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                or
              </span>
            </div>

            {/* 2. Secondary Continue as Guest with Subtle Neutral Tone */}
            <RippleButton
              onClick={() => {
                setGuestMode(true);
                setLocalReady(true);
              }}
              rippleColor="rgba(0, 0, 0, 0.08)"
              enableScaleHover={true}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>{t.gateGuest}</span>
            </RippleButton>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5 flex-nowrap">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 shrink-0">{t.headerSelectLanguage}:</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {(['en', 'my', 'th', 'zh'] as Language[]).map((l) => {
                const countryTitles: Record<Language, string> = {
                  en: 'United States (English)',
                  my: 'မြန်မာ (Myanmar)',
                  th: 'ไทย (Thailand)',
                  zh: '中文 (China)',
                };
                const isSelected = language === l;
                return (
                  <RippleButton
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    rippleColor={isSelected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(0, 0, 0, 0.12)'}
                    enableScaleHover={true}
                    title={countryTitles[l]}
                    aria-label={countryTitles[l]}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-white dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CountryFlag language={l} className="w-4.5 h-3 sm:w-5 sm:h-3.5 rounded-2xs shadow-2xs object-cover" />
                    <span className="text-[11px] font-bold tracking-wide">{l.toUpperCase()}</span>
                  </RippleButton>
                );
              })}
            </div>
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
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-ui transition-colors duration-200">
      {cloudPullOverlay}
      {/* 1. Header (Adapts cleanly to Studio or Preview mode) */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        cloudUser={cloudUser}
        onCloudSignIn={handleCloudSignIn}
        onCloudSignOut={handleCloudSignOut}
        activeUpload={activeUpload}
        onOpenSyncPanel={() => setIsSyncPanelOpen(true)}
        onOpenRulesSetting={() => setIsRulesModalOpen(true)}
        onOpenRestoreConfirm={() => setIsRestoreModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
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
            {previewLoading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
                <h3 className="text-base font-semibold text-slate-900">
                  {t.previewDownloading}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.previewPleaseWait}
                </p>
              </div>
            ) : results.length > 0 && stats ? (
              <ResultsDashboard
                key={`preview-${lastCloudPreviewAtRef.current || results.length}`}
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
                onRefresh={async () => {
                  // Fixed short link / live share link: pull the latest
                  // published snapshot from the cloud (with timeout).
                  if (shareId) {
                    try {
                      const latest = await Promise.race([
                        fetchSharedSnapshot(shareId),
                        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
                      ]);
                      if (latest && checkAndApplyPreview(latest)) {
                        showToast(t.toastPreviewRefreshed, 'success');
                        return;
                      }
                    } catch (e) {
                      console.warn('Preview refresh: cloud fetch failed', e);
                    }
                    // Cloud fetch failed/timed out: tell the user honestly.
                    showToast(t.toastPreviewRefreshFailed || 'Could not refresh from cloud', 'error');
                    return;
                  }
                  // Fallback: URL-embedded snapshot (hash links)
                  const pData = parsePreviewFromUrl();
                  if (pData && checkAndApplyPreview(pData)) {
                    showToast(t.toastPreviewRefreshed, 'success');
                  } else {
                    showToast(t.toastPreviewRefreshFailed || 'Could not refresh from cloud', 'error');
                  }
                }}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {shareId === FIXED_PREVIEW_SHARE_ID ? t.previewFixedEmptyTitle : t.previewNoResultsTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {shareId === FIXED_PREVIEW_SHARE_ID ? t.previewFixedEmptyDesc : t.previewNoResultsDesc}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.previewRetry || 'Retry'}
                </button>
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
              <div className="pt-2 border-t border-[var(--border)]">
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
                  initialColumnConfigs={studioColumnConfigs || previewColumnConfigs}
                  onSaveColumnConfigs={(configs) => setStudioColumnConfigs(configs)}
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
        activeUpload={activeUpload}
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
        cloudUser={cloudUser}
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

      {/* Restore Original Stage Confirmation Modal */}
      {isRestoreModalOpen && (
        <div className="bulk-backdrop flex items-center justify-center p-4">
          <div className="bulk-modal !max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-border)] flex items-center justify-center text-[var(--danger)] shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)] font-ui">
                  Restore Original Stage
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-ui">
                  Are you sure you want to restore? This will clear all history, files, and data from both cloud and local database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-light)]">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setIsRestoreModalOpen(false)}
                className="tbtn tbtn--neutral !h-9 !px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleRestoreOriginalStage}
                className="bulk-del-btn !h-9 !px-4 flex items-center gap-2"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Restore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} language={language} />
    </div>
  );
}
