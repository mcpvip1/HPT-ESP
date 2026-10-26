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
import { GlobalLoadingSkeleton } from './components/GlobalLoadingSkeleton';
import { SplashScreen, SplashSyncState } from './components/SplashScreen';
import { UpdateModal } from './components/UpdateModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { SyncHistoryModal } from './components/SyncHistoryModal';
import {
  getRunningVersionInfo,
  formatBuildDisplay,
  checkAppUpdate,
  dismissVersion,
  AppVersionInfo,
} from './utils/versionManager';
import { translations } from './translations';
import {
  isSupabaseConfigured,
  subscribeSupabaseConfig,
  onSupabaseAuthStateChange,
  signOutSupabase,
  getEffectiveWorkspaceId,
} from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  syncWorkspaceToSupabase,
  fetchWorkspaceFromSupabase,
  fetchWorkspaceColumns,
  syncSettingsToSupabase,
  wipeSupabaseWorkspace,
  debounce,
  mergeWorkspacePresence,
  WorkspaceSettings,
  StoredColumnSettings,
  LocalWorkspaceSnapshot,
  FullWorkspacePayload,
} from './lib/supabaseSync';
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';

export default function App() {
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSupabaseConfigOpen, setIsSupabaseConfigOpen] = useState(false);
  const [isSyncHistoryOpen, setIsSyncHistoryOpen] = useState(false);

  // Auto-Update & Animated Splash Screen State
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppVersionInfo | null>(null);

  // Supabase state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);

  useEffect(() => {
    return subscribeSupabaseConfig((configured) => {
      setIsSupabaseConnected(configured);
    });
  }, []);

  useEffect(() => {
    return onSupabaseAuthStateChange((user) => {
      setSupabaseUser(user);
    });
  }, []);

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

  // Workbooks
  const [referenceWb, setReferenceWb] = useState<WorkbookData | null>(null);
  const [comparisonWb, setComparisonWb] = useState<WorkbookData | null>(null);
  const [studioColumnConfigs, setStudioColumnConfigs] = useState<ColumnConfigItem[] | undefined>(undefined);

  // Rules & Configuration
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [normalization, setNormalization] = useState<NormalizationRules>(
    defaultNormalizationRules
  );
  const [layers, setLayers] = useState<DecisionLayer[]>(defaultDecisionLayers);
  const [holdColumn, setHoldColumn] = useState<string>('');
  const [holdValues, setHoldValues] = useState<string[]>([]);
  const [holdReason, setHoldReason] = useState<string>('');
  const [releasedRowIds, setReleasedRowIds] = useState<string[]>([]);

  // Matching Results
  const [results, setResults] = useState<MatchedRow[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studioSession, setStudioSession] = useState(0);

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

  // Startup sequence: App owns it, SplashScreen only renders it.
  // Order: update check -> local scan -> cloud download (real per-column
  // progress) -> compare -> apply. An update found pauses the sequence:
  // the modal opens, and the merge runs after the user dismisses it.
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const startupRunRef = useRef(0);
  const mergePendingRef = useRef(false);
  const mergeDoneRef = useRef(false);
  const errorDecisionRef = useRef<((decision: 'retry' | 'continue') => void) | null>(null);
  const [syncState, setSyncState] = useState<SplashSyncState>({
    phase: 'checking-update',
    percent: 5,
    messageKey: 'checkingUpdate',
  });
  const [needsReevaluate, setNeedsReevaluate] = useState(false);

  const readLocalSnapshot = async (): Promise<LocalWorkspaceSnapshot> => {
    const [
      savedRef,
      savedComp,
      savedMappings,
      savedNorm,
      savedLayers,
      savedHoldCol,
      savedHoldVals,
      savedHoldReason,
      savedReleased,
      savedColConfigs,
    ] = await Promise.all([
      getFromIDB<WorkbookData>(StorageKeys.REFERENCE_WORKBOOK),
      getFromIDB<WorkbookData>(StorageKeys.COMPARISON_WORKBOOK),
      getFromIDB<ColumnMapping[]>(StorageKeys.COLUMN_MAPPINGS),
      getFromIDB<NormalizationRules>(StorageKeys.NORMALIZATION_RULES),
      getFromIDB<DecisionLayer[]>(StorageKeys.DECISION_LAYERS),
      getFromIDB<string>(StorageKeys.HOLD_COLUMN),
      getFromIDB<string[]>(StorageKeys.HOLD_VALUES),
      getFromIDB<string>(StorageKeys.HOLD_REASON),
      getFromIDB<string[]>(StorageKeys.RELEASED_ROWS),
      getFromIDB<StoredColumnSettings>(StorageKeys.COLUMN_CONFIGS),
    ]);
    return {
      referenceWb: savedRef ?? null,
      comparisonWb: savedComp ?? null,
      normalization: savedNorm ?? null,
      layers: savedLayers ?? null,
      mappings: savedMappings ?? null,
      holdColumn: savedHoldCol ?? null,
      holdValues: savedHoldVals ?? null,
      holdReason: savedHoldReason ?? null,
      releasedRowIds: savedReleased ?? null,
      columnConfigs: savedColConfigs ?? null,
    };
  };

  /** Applies merged state + IDB. Never pushes to the cloud (see runMerge). */
  const applyMergedState = async (merged: {
    referenceWb?: WorkbookData;
    comparisonWb?: WorkbookData;
    settings?: Partial<WorkspaceSettings>;
    results?: MatchedRow[];
    stats?: MatchingStats;
    settingsPulled: boolean;
    filesPulled: boolean;
  }) => {
    if (merged.referenceWb) {
      setReferenceWb(merged.referenceWb);
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, merged.referenceWb);
    }
    if (merged.comparisonWb) {
      setComparisonWb(merged.comparisonWb);
      await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, merged.comparisonWb);
    }
    if (merged.settings) {
      const s = merged.settings;
      if (s.normalization) {
        setNormalization(s.normalization);
        await saveToIDB(StorageKeys.NORMALIZATION_RULES, s.normalization);
      }
      if (s.layers) {
        setLayers(s.layers);
        await saveToIDB(StorageKeys.DECISION_LAYERS, s.layers);
      }
      if (s.mappings) {
        setMappings(s.mappings);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, s.mappings);
      }
      if (typeof s.holdColumn === 'string') {
        setHoldColumn(s.holdColumn);
        await saveToIDB(StorageKeys.HOLD_COLUMN, s.holdColumn);
      }
      if (s.holdValues) {
        setHoldValues(s.holdValues);
        await saveToIDB(StorageKeys.HOLD_VALUES, s.holdValues);
      }
      if (typeof s.holdReason === 'string') {
        setHoldReason(s.holdReason);
        await saveToIDB(StorageKeys.HOLD_REASON, s.holdReason);
      }
      if (s.releasedRowIds) {
        setReleasedRowIds(s.releasedRowIds);
        await saveToIDB(StorageKeys.RELEASED_ROWS, s.releasedRowIds);
      }
      if (s.columnConfigs && Array.isArray(s.columnConfigs.order)) {
        const cfg = s.columnConfigs;
        const restored: ColumnConfigItem[] = cfg.order.map((id: string) => ({
          id,
          label: id,
          category: 'data',
          showInTable: cfg.visibility?.[id]?.table !== false,
          showInExport: cfg.visibility?.[id]?.export !== false,
        }));
        setStudioColumnConfigs(restored);
        await saveToIDB(StorageKeys.COLUMN_CONFIGS, cfg);
      }
    }
    if (merged.results && merged.stats) {
      setResults(merged.results);
      setStats(merged.stats);
    }
    // Settings pulled while files are present leave results computed from
    // older settings — re-run matching once with merged settings, unless
    // results were pulled too (then they already match).
    if (
      (merged.settingsPulled || merged.filesPulled) &&
      merged.referenceWb &&
      merged.comparisonWb &&
      (merged.settings?.mappings?.length ?? 0) > 0 &&
      !(merged.results && merged.stats)
    ) {
      setNeedsReevaluate(true);
    }
  };

  const runMerge = async (runId: number, startedAt: number): Promise<void> => {
    const isCurrent = () => startupRunRef.current === runId;
    const ensureMinTime = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1500) await sleep(1500 - elapsed);
    };
    while (true) {
      if (!isCurrent()) return;
      setSyncState({ phase: 'scanning', percent: 20, messageKey: 'scanning' });
      const local = await readLocalSnapshot();
      if (!isCurrent()) return;

      let columns: Partial<FullWorkspacePayload> = {};
      let failed: string[] = [];
      try {
        const res = await fetchWorkspaceColumns(getEffectiveWorkspaceId(), (p) => {
          if (!isCurrent()) return;
          setSyncState({
            phase: 'downloading',
            percent: 20 + Math.round(60 * (p.done / p.total)),
            messageKey: 'downloading',
            downloadItem: p.item,
            downloadPercent: p.percent,
            downloadDone: p.done,
            downloadTotal: p.total,
          });
        });
        columns = res.columns;
        failed = res.failed;
      } catch {
        failed = ['Cloud workspace'];
      }
      if (!isCurrent()) return;

      if (failed.length > 0) {
        setSyncState({ phase: 'error', percent: 80, messageKey: 'cloudError', failedItems: failed });
        const decision = await new Promise<'retry' | 'continue'>((resolve) => {
          errorDecisionRef.current = resolve;
        });
        errorDecisionRef.current = null;
        if (!isCurrent()) return;
        if (decision === 'retry') continue;
        // Continue with local data: merge what did download, never push —
        // a failed column is unknown, not absent.
        const merged = mergeWorkspacePresence(local, columns, { allowPushBack: false });
        await applyMergedState(merged);
        setSyncState({ phase: 'complete', percent: 100, messageKey: 'continuedLocal' });
        await ensureMinTime();
        if (!isCurrent()) return;
        mergeDoneRef.current = true;
        setIsSplashVisible(false);
        return;
      }

      const hasCloudData = Object.keys(columns).length > 0;
      const merged = mergeWorkspacePresence(local, hasCloudData ? columns : undefined);
      if (merged.pulled.length === 0 && !merged.pushBack) {
        setSyncState({ phase: 'complete', percent: 100, messageKey: 'scanComplete' });
      } else {
        if (merged.pulled.length > 0) {
          setSyncState({ phase: 'found-missing', percent: 85, messageKey: 'foundMissing' });
        } else {
          setSyncState({ phase: 'uploading', percent: 85, messageKey: 'uploading' });
        }
        await sleep(700);
        if (!isCurrent()) return;
        if (merged.pulled.length > 0) {
          setSyncState({ phase: 'applying', percent: 92, messageKey: 'applying' });
          await applyMergedState(merged);
        }
        if (merged.pushBack) {
          setSyncState({ phase: 'uploading', percent: 92, messageKey: 'uploading' });
          await syncWorkspaceToSupabase(
            getEffectiveWorkspaceId(),
            merged.pushBack,
            'Startup sync: local data missing in cloud'
          );
        }
        setSyncState({ phase: 'complete', percent: 100, messageKey: 'syncComplete' });
      }
      await ensureMinTime();
      if (!isCurrent()) return;
      mergeDoneRef.current = true;
      setIsSplashVisible(false);
      return;
    }
  };

  const runStartup = async (opts: { checkOnly?: boolean; skipCheck?: boolean } = {}): Promise<void> => {
    // A new run supersedes any parked error decision from an older run.
    errorDecisionRef.current?.('continue');
    errorDecisionRef.current = null;
    const runId = ++startupRunRef.current;
    const startedAt = Date.now();
    const isCurrent = () => startupRunRef.current === runId;
    setIsSplashVisible(true);
    if (!opts.skipCheck) {
      setSyncState({ phase: 'checking-update', percent: 5, messageKey: 'checkingUpdate' });
      const update = await checkAppUpdate();
      if (!isCurrent()) return;
      if (update.hasUpdate && update.latest) {
        setSyncState({ phase: 'update-found', percent: 100, messageKey: 'updateFound' });
        setAvailableUpdate(update.latest);
        await sleep(900);
        if (!isCurrent()) return;
        setIsSplashVisible(false);
        setIsUpdateModalOpen(true);
        mergePendingRef.current = !opts.checkOnly;
        return;
      }
      setSyncState({ phase: 'up-to-date', percent: 15, messageKey: 'upToDate' });
      if (opts.checkOnly) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < 1500) await sleep(1500 - elapsed);
        if (!isCurrent()) return;
        setIsSplashVisible(false);
        return;
      }
    }
    // No cloud configured: nothing to scan or download — straight in.
    if (!isSupabaseConnected) {
      setSyncState({ phase: 'complete', percent: 100, messageKey: 'scanComplete' });
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1500) await sleep(1500 - elapsed);
      if (!isCurrent()) return;
      setIsSplashVisible(false);
      return;
    }
    await runMerge(runId, startedAt);
  };

  // Startup sequence on first open.
  useEffect(() => {
    runStartup({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If Supabase gets connected later (config modal), run the merge then —
  // but only if it never ran this session and no modal is in the way.
  const prevConnectedRef = useRef(isSupabaseConnected);
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = isSupabaseConnected;
    if (!wasConnected && isSupabaseConnected && !mergeDoneRef.current && !isUpdateModalOpen) {
      runStartup({ skipCheck: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseConnected, isUpdateModalOpen]);

  const handleSplashRetry = useCallback(() => {
    errorDecisionRef.current?.('retry');
  }, []);

  const handleSplashContinueLocal = useCallback(() => {
    errorDecisionRef.current?.('continue');
  }, []);

  const handleManualCheckUpdates = useCallback(() => {
    runStartup({ checkOnly: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Closing the prompt without updating dismisses THAT build only, so the
  // same deploy is not nagged about on every open — a newer deploy still prompts.
  // The paused merge then runs, since the user chose to stay on this build.
  const handleUpdateModalClose = useCallback(() => {
    if (availableUpdate) dismissVersion(availableUpdate.buildHash);
    setIsUpdateModalOpen(false);
    if (mergePendingRef.current) {
      mergePendingRef.current = false;
      runStartup({ skipCheck: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableUpdate]);

  // Initial Load: restore from local IndexedDB first for instant rendering
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [
          savedLang,
          savedRef,
          savedComp,
          savedMappings,
          savedNorm,
          savedLayers,
          savedHoldCol,
          savedHoldVals,
          savedHoldReason,
          savedReleased,
          savedColConfigs,
        ] = await Promise.all([
          getFromIDB<Language>(StorageKeys.LANGUAGE),
          getFromIDB<WorkbookData>(StorageKeys.REFERENCE_WORKBOOK),
          getFromIDB<WorkbookData>(StorageKeys.COMPARISON_WORKBOOK),
          getFromIDB<ColumnMapping[]>(StorageKeys.COLUMN_MAPPINGS),
          getFromIDB<NormalizationRules>(StorageKeys.NORMALIZATION_RULES),
          getFromIDB<DecisionLayer[]>(StorageKeys.DECISION_LAYERS),
          getFromIDB<string>(StorageKeys.HOLD_COLUMN),
          getFromIDB<string[]>(StorageKeys.HOLD_VALUES),
          getFromIDB<string>(StorageKeys.HOLD_REASON),
          getFromIDB<string[]>(StorageKeys.RELEASED_ROWS),
          getFromIDB<any>(StorageKeys.COLUMN_CONFIGS),
        ]);

        if (!isMounted) return;

        if (savedLang) setLanguage(savedLang);
        if (savedRef) setReferenceWb(savedRef);
        if (savedComp) setComparisonWb(savedComp);
        if (savedMappings) setMappings(savedMappings);
        if (savedNorm) setNormalization(savedNorm);
        if (savedLayers) setLayers(savedLayers);
        if (typeof savedHoldCol === 'string') setHoldColumn(savedHoldCol);
        if (savedHoldVals) setHoldValues(savedHoldVals);
        if (typeof savedHoldReason === 'string') setHoldReason(savedHoldReason);
        if (savedReleased) setReleasedRowIds(savedReleased);

        if (savedColConfigs && Array.isArray(savedColConfigs.order)) {
          const configs: ColumnConfigItem[] = savedColConfigs.order.map((id: string) => ({
            id,
            label: id,
            category: 'data',
            showInTable: savedColConfigs.visibility?.[id]?.table !== false,
            showInExport: savedColConfigs.visibility?.[id]?.export !== false,
          }));
          setStudioColumnConfigs(configs);
        }

        // Auto-run matching if files and rules were previously loaded
        if (savedRef && savedComp && savedMappings && savedMappings.length > 0) {
          try {
            const { results: evaluated, stats: evStats } = processMatching(
              savedRef,
              savedComp,
              savedMappings,
              savedNorm || defaultNormalizationRules,
              savedLayers || defaultDecisionLayers,
              savedHoldVals || [],
              savedReleased || [],
              savedHoldCol || ''
            );
            setResults(evaluated);
            setStats(evStats);
          } catch (e) {
            console.warn('Auto evaluation error on init', e);
          }
        }
      } catch (err) {
        console.warn('Failed to load local state from IndexedDB', err);
      } finally {
        if (isMounted) setIsStorageLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);


  // Debounced auto-sync to Supabase with human-readable reason
  const debouncedSyncToSupabase = useRef(
    debounce((uid: string, payload: any, reason?: string) => {
      syncWorkspaceToSupabase(uid, payload, reason).then((res) => {
        if (!res.success) {
          console.warn('Auto-sync to Supabase warning:', res.error);
        }
      });
    }, 2000)
  ).current;

  // Language Change
  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveToIDB(StorageKeys.LANGUAGE, lang);
  };

  // File Upload Handlers
  const handleSetReferenceWb = async (wb: WorkbookData | null) => {
    setReferenceWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, wb);
    } else {
      await deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK);
    }

    if (wb && comparisonWb) {
      const auto = autoMapColumns(wb.headers, comparisonWb.headers);
      setMappings(auto);
      await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
      handleExecuteMatching(wb, comparisonWb, auto, false);
    }

    if (isSupabaseConnected) {
      const reason = wb
        ? `Reference Workbook loaded: '${wb.name || wb.activeSheet || 'File'}' (${wb.rows?.length || 0} rows)`
        : 'Reference Workbook removed';
      debouncedSyncToSupabase(getEffectiveWorkspaceId(), { referenceWb: wb }, reason);
    }
  };

  const handleSetComparisonWb = async (wb: WorkbookData | null) => {
    setComparisonWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, wb);
    } else {
      await deleteFromIDB(StorageKeys.COMPARISON_WORKBOOK);
    }

    if (referenceWb && wb) {
      const auto = autoMapColumns(referenceWb.headers, wb.headers);
      setMappings(auto);
      await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
      handleExecuteMatching(referenceWb, wb, auto, false);
    }

    if (isSupabaseConnected) {
      const reason = wb
        ? `Comparison Workbook loaded: '${wb.name || wb.activeSheet || 'File'}' (${wb.rows?.length || 0} rows)`
        : 'Comparison Workbook removed';
      debouncedSyncToSupabase(getEffectiveWorkspaceId(), { comparisonWb: wb }, reason);
    }
  };

  const handleSelectReferenceSheet = async (sheetName: string) => {
    if (!referenceWb) return;
    try {
      const updated = changeWorkbookSheet(referenceWb, sheetName);
      setReferenceWb(updated);
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, updated);
      if (comparisonWb) {
        const auto = autoMapColumns(updated.headers, comparisonWb.headers);
        setMappings(auto);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
        handleExecuteMatching(updated, comparisonWb, auto);
      }
    } catch {
      showToast('Could not switch sheet', 'error');
    }
  };

  const handleSelectComparisonSheet = async (sheetName: string) => {
    if (!comparisonWb) return;
    try {
      const updated = changeWorkbookSheet(comparisonWb, sheetName);
      setComparisonWb(updated);
      await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, updated);
      if (referenceWb) {
        const auto = autoMapColumns(referenceWb.headers, updated.headers);
        setMappings(auto);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
        handleExecuteMatching(referenceWb, updated, auto);
      }
    } catch {
      showToast('Could not switch sheet', 'error');
    }
  };

  // Rule Handlers
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

  const handleHoldSettingsChange = async (col: string, vals: string[], reason: string) => {
    setHoldColumn(col);
    setHoldValues(vals);
    setHoldReason(reason);
    await Promise.all([
      saveToIDB(StorageKeys.HOLD_COLUMN, col),
      saveToIDB(StorageKeys.HOLD_VALUES, vals),
      saveToIDB(StorageKeys.HOLD_REASON, reason),
    ]);
  };

  const handleReleaseHoldKey = async (key: string): Promise<{ key: string; green: number; yellow: number; total: number }> => {
    const nextHoldValues = holdValues.filter((v) => v !== key);
    setHoldValues(nextHoldValues);
    await saveToIDB(StorageKeys.HOLD_VALUES, nextHoldValues);

    const targetRowIds = results
      .filter((r) => r.decisionColor === 'blue' && (r.matchKey === key || r.comparisonRow[holdColumn] === key))
      .map((r) => r.id);

    const nextReleased = Array.from(new Set([...releasedRowIds, ...targetRowIds]));
    setReleasedRowIds(nextReleased);
    await saveToIDB(StorageKeys.RELEASED_ROWS, nextReleased);

    handleExecuteMatching(referenceWb, comparisonWb, mappings, false, nextHoldValues, nextReleased);
    return { key, green: 0, yellow: 0, total: targetRowIds.length };
  };

  const handleSaveAllSettingsExplicit = async () => {
    await Promise.all([
      saveToIDB(StorageKeys.COLUMN_MAPPINGS, mappings),
      saveToIDB(StorageKeys.NORMALIZATION_RULES, normalization),
      saveToIDB(StorageKeys.DECISION_LAYERS, layers),
      saveToIDB(StorageKeys.HOLD_COLUMN, holdColumn),
      saveToIDB(StorageKeys.HOLD_VALUES, holdValues),
      saveToIDB(StorageKeys.HOLD_REASON, holdReason),
      saveToIDB(StorageKeys.RELEASED_ROWS, releasedRowIds),
    ]);

    if (isSupabaseConnected) {
      const settingsPayload: WorkspaceSettings = {
        normalization,
        layers,
        mappings,
        holdColumn,
        holdValues,
        holdReason,
        releasedRowIds,
        columnConfigs: buildStoredColConfigs(studioColumnConfigs),
        updatedAt: Date.now(),
      };
      await syncSettingsToSupabase(
        getEffectiveWorkspaceId(),
        settingsPayload,
        `Updated ${layers.length} decision layers & ${mappings.length} column mappings`
      );
      showToast(`${t.toastRulesSaved} (Synced to Supabase)`, 'success');
    } else {
      showToast(t.toastRulesSaved, 'success');
    }
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

        if (isSupabaseConnected) {
          debouncedSyncToSupabase(
            getEffectiveWorkspaceId(),
            {
              results: evaluatedResults,
              stats: evaluatedStats,
            },
            `Matching evaluated (${evaluatedStats.totalIncoming} rows: ${evaluatedStats.greenCount} Green, ${evaluatedStats.yellowCount} Yellow, ${evaluatedStats.redCount} Red)`
          );
        }

        if (notifySuccess) {
          showToast(
            t.toastEvaluatedSummary
              .replace('{total}', String(evaluatedStats.totalIncoming))
              .replace('{green}', String(evaluatedStats.greenCount))
              .replace('{yellow}', String(evaluatedStats.yellowCount))
              .replace('{red}', String(evaluatedStats.redCount)),
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

  const handleSupabaseSignOut = async () => {
    await signOutSupabase();
    setSupabaseUser(null);
    // Shared workspace: signing out changes no workspace id, so no
    // re-merge is needed (the old per-user pull reset is gone).
    showToast('Signed out of Supabase.', 'info');
  };

  const handleRestoreOriginalStage = async () => {
    setIsRestoring(true);
    try {
      if (isSupabaseConnected) {
        await wipeSupabaseWorkspace(getEffectiveWorkspaceId());
      }

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
        try { await deleteFromIDB(k); } catch {}
      }

      try {
        const lsKeys = Object.keys(localStorage);
        for (const k of lsKeys) {
          if (k.startsWith('excelmatch_') || k.startsWith('emp_')) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

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
      setStudioSession((n) => n + 1);

      showToast('Restored to original stage. All workspace data cleared.', 'success');
      setIsRestoreModalOpen(false);
    } catch (err: any) {
      showToast('Error restoring stage: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // Column view settings (StoredColumnSettings) shared by every settings sync.
  const buildStoredColConfigs = (
    configs: ColumnConfigItem[] | undefined
  ): StoredColumnSettings | undefined =>
    configs
      ? {
          order: configs.map((c) => c.id),
          visibility: configs.reduce(
            (acc, c) => ({ ...acc, [c.id]: { table: c.showInTable, export: c.showInExport } }),
            {} as Record<string, { table: boolean; export: boolean }>
          ),
          updatedAt: Date.now(),
        }
      : undefined;

  // Re-run matching once after startup reconciliation pulled newer settings
  // or files (results computed from older settings would otherwise linger).
  useEffect(() => {
    if (!needsReevaluate) return;
    if (!referenceWb || !comparisonWb || mappings.length === 0) {
      setNeedsReevaluate(false);
      return;
    }
    setNeedsReevaluate(false);
    handleExecuteMatching(undefined, undefined, undefined, false);
  }, [needsReevaluate, referenceWb, comparisonWb, mappings]);

  // Column view changes sync to the cloud like any other setting.
  const handleSaveColumnConfigs = (configs: ColumnConfigItem[]) => {
    setStudioColumnConfigs(configs);
    if (isSupabaseConnected) {
      debouncedSyncToSupabase(
        getEffectiveWorkspaceId(),
        {
          settings: {
            normalization,
            layers,
            mappings,
            holdColumn,
            holdValues,
            holdReason,
            releasedRowIds,
            columnConfigs: buildStoredColConfigs(configs),
            updatedAt: Date.now(),
          },
        },
        'Column view settings updated'
      );
    }
  };

  const handleTriggerManualSync = async () => {
    if (!isSupabaseConnected) {
      showToast('Please configure Supabase first.', 'error');
      return;
    }

    const storedColConfigs = buildStoredColConfigs(studioColumnConfigs);

    const settingsPayload: WorkspaceSettings = {
      normalization,
      layers,
      mappings,
      holdColumn,
      holdValues,
      holdReason,
      releasedRowIds,
      columnConfigs: storedColConfigs,
      updatedAt: Date.now(),
    };
    const payload = {
      referenceWb,
      comparisonWb,
      results,
      stats,
      settings: settingsPayload,
    };
    const res = await syncWorkspaceToSupabase(
      getEffectiveWorkspaceId(),
      payload,
      'Manual full cloud sync'
    );
    if (!res.success) {
      throw new Error(res.error || 'Failed to sync to Supabase');
    }
  };

  const handleTriggerManualPull = async () => {
    if (!isSupabaseConnected) {
      showToast('Please configure Supabase first.', 'error');
      return;
    }
    const { success, data, error } = await fetchWorkspaceFromSupabase(
      getEffectiveWorkspaceId(),
      'Manual workspace restore from cloud'
    );
    if (!success) {
      throw new Error(error || 'Failed to fetch from Supabase');
    }
    if (data) {
      if (data.referenceWb) {
        setReferenceWb(data.referenceWb);
        await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, data.referenceWb);
      }
      if (data.comparisonWb) {
        setComparisonWb(data.comparisonWb);
        await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, data.comparisonWb);
      }
      if (data.settings) {
        if (data.settings.normalization) {
          setNormalization(data.settings.normalization);
          await saveToIDB(StorageKeys.NORMALIZATION_RULES, data.settings.normalization);
        }
        if (data.settings.layers) {
          setLayers(data.settings.layers);
          await saveToIDB(StorageKeys.DECISION_LAYERS, data.settings.layers);
        }
        if (data.settings.mappings) {
          setMappings(data.settings.mappings);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, data.settings.mappings);
        }
        if (typeof data.settings.holdColumn === 'string') {
          setHoldColumn(data.settings.holdColumn);
          await saveToIDB(StorageKeys.HOLD_COLUMN, data.settings.holdColumn);
        }
        if (data.settings.holdValues) {
          setHoldValues(data.settings.holdValues);
          await saveToIDB(StorageKeys.HOLD_VALUES, data.settings.holdValues);
        }
        if (typeof data.settings.holdReason === 'string') {
          setHoldReason(data.settings.holdReason);
          await saveToIDB(StorageKeys.HOLD_REASON, data.settings.holdReason);
        }
        if (data.settings.releasedRowIds) {
          setReleasedRowIds(data.settings.releasedRowIds);
          await saveToIDB(StorageKeys.RELEASED_ROWS, data.settings.releasedRowIds);
        }
        if (data.settings.columnConfigs && Array.isArray(data.settings.columnConfigs.order)) {
          const cfg = data.settings.columnConfigs;
          const restored: ColumnConfigItem[] = cfg.order.map((id: string) => ({
            id,
            label: id,
            category: 'data',
            showInTable: cfg.visibility?.[id]?.table !== false,
            showInExport: cfg.visibility?.[id]?.export !== false,
          }));
          setStudioColumnConfigs(restored);
        }
      }
      if (data.results && data.stats) {
        setResults(data.results);
        setStats(data.stats);
      }
    }
  };

  // 1. Startup Splash Screen: App owns the sequence, SplashScreen renders it.
  if (isSplashVisible) {
    return (
      <SplashScreen
        language={language}
        syncState={syncState}
        onRetry={handleSplashRetry}
        onContinueLocal={handleSplashContinueLocal}
      />
    );
  }

  if (isStorageLoading) {
    return <GlobalLoadingSkeleton language={language} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-ui transition-colors duration-200">

      {/* 1. Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        onOpenRulesSetting={() => setIsRulesModalOpen(true)}
        onOpenRestoreConfirm={() => setIsRestoreModalOpen(true)}
        hasRefFile={!!referenceWb}
        hasCompFile={!!comparisonWb}
        hasResults={results.length > 0}
        supabaseUser={supabaseUser}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)}
        onOpenSyncHistory={() => setIsSyncHistoryOpen(true)}
        onSupabaseSignOut={handleSupabaseSignOut}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onCheckForUpdates={handleManualCheckUpdates}
        currentVersion={getRunningVersionInfo().version}
        currentBuildTime={formatBuildDisplay(getRunningVersionInfo().builtAt)}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
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

          {/* Filtered Results & Table Section */}
          {results.length > 0 && stats && (
            <div className="pt-2 border-t border-[var(--border)]">
              <ResultsDashboard
                key={`studio-${studioSession}`}
                results={results}
                stats={stats}
                comparisonWb={comparisonWb}
                language={language}
                onShowToast={showToast}
                initialFilter="all"
                initialOnlyAccept={true}
                initialSearchTerm=""
                initialColumnConfigs={studioColumnConfigs}
                onSaveColumnConfigs={handleSaveColumnConfigs}
                supabaseUser={supabaseUser}
                holdReason={holdReason}
                onReleaseHoldKey={handleReleaseHoldKey}
              />
            </div>
          )}
        </div>
      </main>

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseConfigOpen}
        onClose={() => setIsSupabaseConfigOpen(false)}
        onShowToast={showToast}
        onConfigChanged={(configured) => setIsSupabaseConnected(configured)}
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
        cloudUser={supabaseUser}
      />

      {/* Global Data Preview Modal (inspecting sheets from file cards) */}
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
                  Are you sure you want to restore? This will clear all files, rules, and matching results from local and cloud storage.
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

      {/* System Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={handleUpdateModalClose}
        updateInfo={availableUpdate || getRunningVersionInfo()}
        language={language}
      />

      {/* Cloud Upload & Sync History Modal */}
      <SyncHistoryModal
        isOpen={isSyncHistoryOpen}
        onClose={() => setIsSyncHistoryOpen(false)}
        onTriggerManualSync={handleTriggerManualSync}
        onTriggerManualPull={handleTriggerManualPull}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)}
        onShowToast={showToast}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} language={language} />
    </div>
  );
}
