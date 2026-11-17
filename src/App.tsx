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
  changeWorkbookSheet,
  ensureResultsSearchBlob,
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
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { playSuccessChime, playNotifyChime } from './utils/audioFeedback';
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
  wipeSupabaseWorkspace,
  mergeWorkspacePresence,
  areCloudResultsFresh,
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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

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
  // progress) -> compare -> reconcile & apply. An update found pauses the sequence:
  // the modal opens, and the merge runs after the user dismisses it.
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const startupRunRef = useRef(0);
  const reconcileSeqRef = useRef(0);
  const mergePendingRef = useRef(false);
  const mergeDoneRef = useRef(false);
  const errorDecisionRef = useRef<((decision: 'retry' | 'continue') => void) | null>(null);
  const settingsUpdatedAtRef = useRef<number>(Date.now());
  const latestStateRef = useRef({
    referenceWb,
    comparisonWb,
    mappings,
    normalization,
    layers,
    holdColumn,
    holdValues,
    holdReason,
    releasedRowIds,
    studioColumnConfigs,
  });
  latestStateRef.current = {
    referenceWb,
    comparisonWb,
    mappings,
    normalization,
    layers,
    holdColumn,
    holdValues,
    holdReason,
    releasedRowIds,
    studioColumnConfigs,
  };
  const [syncState, setSyncState] = useState<SplashSyncState>({
    phase: 'checking-update',
    percent: 5,
    messageKey: 'checkingUpdate',
  });

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

  const stampEvaluatedStats = (
    baseStats: MatchingStats,
    ref: WorkbookData,
    comp: WorkbookData,
    settingsTimestamp?: number
  ): MatchingStats => ({
    ...baseStats,
    evaluatedAt: Date.now(),
    evaluatedRefId: ref.id,
    evaluatedRefSheet: ref.activeSheet,
    evaluatedCompId: comp.id,
    evaluatedCompSheet: comp.activeSheet,
    evaluatedSettingsAt: settingsTimestamp ?? settingsUpdatedAtRef.current,
  });

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
      savedMappingPresets,
      savedDecisionPresets,
      savedLastCloudSyncAt,
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
      getFromIDB<SavedMappingPreset[]>(StorageKeys.SAVED_MAPPING_PRESETS),
      getFromIDB<SavedDecisionPreset[]>(StorageKeys.SAVED_DECISION_PRESETS),
      getFromIDB<number>(StorageKeys.LAST_CLOUD_SYNC_AT),
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
      mappingPresets: savedMappingPresets ?? null,
      decisionPresets: savedDecisionPresets ?? null,
      lastCloudSyncedAt: savedLastCloudSyncAt ?? null,
    };
  };

  /**
   * Reconciles local IndexedDB, localStorage column layout, React state, and
   * matching results atomically in one pass so UI never requires secondary
   * clicks ("Save & Show Results" / repeated pulls) to show current results.
   */
  const commitReconciledWorkspace = async (input: {
    source: 'startup' | 'pull';
    referenceWb?: WorkbookData | null;
    comparisonWb?: WorkbookData | null;
    settings?: Partial<WorkspaceSettings> | null;
    cloudResults?: MatchedRow[] | null;
    cloudStats?: MatchingStats | null;
    clearMissingKeys?: boolean;
    bumpStudioSession?: boolean;
  }): Promise<{
    finalResults: MatchedRow[];
    finalStats: MatchingStats | null;
    recomputedResults: boolean;
    effRef: WorkbookData | null;
    effComp: WorkbookData | null;
  }> => {
    const cur = latestStateRef.current;
    const s = input.settings ?? undefined;

    const effRef =
      input.referenceWb !== undefined
        ? input.referenceWb
        : input.clearMissingKeys
        ? null
        : cur.referenceWb;
    const effComp =
      input.comparisonWb !== undefined
        ? input.comparisonWb
        : input.clearMissingKeys
        ? null
        : cur.comparisonWb;

    const effNorm =
      s?.normalization ?? (input.clearMissingKeys ? defaultNormalizationRules : cur.normalization);
    const effLayers =
      s?.layers ?? (input.clearMissingKeys ? defaultDecisionLayers : cur.layers);
    const effMappings = Array.isArray(s?.mappings)
      ? s.mappings
      : input.clearMissingKeys
      ? []
      : cur.mappings;
    const effHoldCol =
      typeof s?.holdColumn === 'string'
        ? s.holdColumn
        : input.clearMissingKeys
        ? ''
        : cur.holdColumn;
    const effHoldVals = Array.isArray(s?.holdValues)
      ? s.holdValues
      : input.clearMissingKeys
      ? []
      : cur.holdValues;
    const effHoldReason =
      typeof s?.holdReason === 'string'
        ? s.holdReason
        : input.clearMissingKeys
        ? ''
        : cur.holdReason;
    const effReleased = Array.isArray(s?.releasedRowIds)
      ? s.releasedRowIds
      : input.clearMissingKeys
      ? []
      : cur.releasedRowIds;

    const effSettingsTs =
      typeof s?.updatedAt === 'number' && s.updatedAt > 0
        ? s.updatedAt
        : input.clearMissingKeys
        ? Date.now()
        : settingsUpdatedAtRef.current;

    const hasValidColConfigs = Boolean(s?.columnConfigs && Array.isArray(s.columnConfigs.order));
    const effColConfigRaw: StoredColumnSettings | undefined = hasValidColConfigs
      ? (s!.columnConfigs as StoredColumnSettings)
      : input.clearMissingKeys
      ? undefined
      : buildStoredColConfigs(cur.studioColumnConfigs);

    const restoredColConfigs: ColumnConfigItem[] | undefined = effColConfigRaw
      ? effColConfigRaw.order.map((id: string) => ({
          id,
          label: id,
          category: 'data',
          showInTable: effColConfigRaw.visibility?.[id]?.table !== false,
          showInExport: effColConfigRaw.visibility?.[id]?.export !== false,
        }))
      : undefined;

    let finalResults: MatchedRow[] = [];
    let finalStats: MatchingStats | null = null;
    let recomputedResults = false;

    const canUseCloudResults =
      Boolean(input.cloudResults && input.cloudStats && effRef && effComp) &&
      areCloudResultsFresh(
        effRef,
        effComp,
        { updatedAt: effSettingsTs },
        input.cloudStats,
        input.cloudResults?.length
      );

    if (canUseCloudResults && input.cloudResults && input.cloudStats) {
      finalResults = ensureResultsSearchBlob([...input.cloudResults]);
      finalStats = input.cloudStats;
    } else if (effRef && effComp && effMappings.length > 0) {
      try {
        const evaluated = processMatching(
          effRef,
          effComp,
          effMappings,
          effNorm,
          effLayers,
          effHoldVals,
          effReleased,
          effHoldCol
        );
        finalResults = evaluated.results;
        finalStats = stampEvaluatedStats(evaluated.stats, effRef, effComp, effSettingsTs);
        recomputedResults = true;
      } catch (e) {
        console.warn('Immediate reconciliation matching failed:', e);
      }
    }

    const syncTimestamp = Date.now();
    const idbWrites: Promise<void>[] = [
      effRef
        ? saveToIDB(StorageKeys.REFERENCE_WORKBOOK, effRef)
        : deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK),
      effComp
        ? saveToIDB(StorageKeys.COMPARISON_WORKBOOK, effComp)
        : deleteFromIDB(StorageKeys.COMPARISON_WORKBOOK),
      saveToIDB(StorageKeys.NORMALIZATION_RULES, effNorm),
      saveToIDB(StorageKeys.DECISION_LAYERS, effLayers),
      saveToIDB(StorageKeys.COLUMN_MAPPINGS, effMappings),
      saveToIDB(StorageKeys.HOLD_COLUMN, effHoldCol),
      saveToIDB(StorageKeys.HOLD_VALUES, effHoldVals),
      saveToIDB(StorageKeys.HOLD_REASON, effHoldReason),
      saveToIDB(StorageKeys.RELEASED_ROWS, effReleased),
      saveToIDB(StorageKeys.LAST_CLOUD_SYNC_AT, syncTimestamp),
    ];

    if (effColConfigRaw) {
      idbWrites.push(saveToIDB(StorageKeys.COLUMN_CONFIGS, effColConfigRaw));
    } else if (input.clearMissingKeys) {
      idbWrites.push(deleteFromIDB(StorageKeys.COLUMN_CONFIGS));
    }

    if (Array.isArray(s?.mappingPresets)) {
      idbWrites.push(saveToIDB(StorageKeys.SAVED_MAPPING_PRESETS, s.mappingPresets));
    } else if (input.clearMissingKeys) {
      idbWrites.push(deleteFromIDB(StorageKeys.SAVED_MAPPING_PRESETS));
    }

    if (Array.isArray(s?.decisionPresets)) {
      idbWrites.push(saveToIDB(StorageKeys.SAVED_DECISION_PRESETS, s.decisionPresets));
    } else if (input.clearMissingKeys) {
      idbWrites.push(deleteFromIDB(StorageKeys.SAVED_DECISION_PRESETS));
    }

    await Promise.all(idbWrites);

    try {
      if (effColConfigRaw) {
        const serialized = JSON.stringify(effColConfigRaw);
        localStorage.setItem('excelmatch_column_settings_v2', serialized);
        localStorage.setItem('emp_column_configs', serialized);
      } else if (input.clearMissingKeys) {
        localStorage.removeItem('excelmatch_column_settings_v2');
        localStorage.removeItem('emp_column_configs');
      }
    } catch {}

    reconcileSeqRef.current += 1;
    settingsUpdatedAtRef.current = effSettingsTs;
    latestStateRef.current = {
      referenceWb: effRef,
      comparisonWb: effComp,
      mappings: effMappings,
      normalization: effNorm,
      layers: effLayers,
      holdColumn: effHoldCol,
      holdValues: effHoldVals,
      holdReason: effHoldReason,
      releasedRowIds: effReleased,
      studioColumnConfigs: restoredColConfigs,
    };

    setReferenceWb(effRef);
    setComparisonWb(effComp);
    setNormalization(effNorm);
    setLayers(effLayers);
    setMappings(effMappings);
    setHoldColumn(effHoldCol);
    setHoldValues(effHoldVals);
    setHoldReason(effHoldReason);
    setReleasedRowIds(effReleased);
    setStudioColumnConfigs(restoredColConfigs);
    setResults(finalResults);
    setStats(finalStats);
    if (input.bumpStudioSession) {
      setStudioSession((n) => n + 1);
    }

    return { finalResults, finalStats, recomputedResults, effRef, effComp };
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
        await commitReconciledWorkspace({
          source: 'startup',
          referenceWb: merged.referenceWb ?? null,
          comparisonWb: merged.comparisonWb ?? null,
          settings: merged.settings ?? null,
          cloudResults: merged.results ?? null,
          cloudStats: merged.stats ?? null,
          clearMissingKeys: true,
          bumpStudioSession: merged.filesPulled || merged.settingsPulled || !merged.results,
        });
        setSyncState({ phase: 'complete', percent: 100, messageKey: 'continuedLocal' });
        await ensureMinTime();
        if (!isCurrent()) return;
        mergeDoneRef.current = true;
        setIsSplashVisible(false);
        return;
      }

      const hasCloudData = Boolean(
        columns.cloudExists ||
          columns.referenceWb ||
          columns.comparisonWb ||
          columns.settings ||
          columns.results ||
          columns.stats
      );
      const merged = mergeWorkspacePresence(local, hasCloudData ? columns : undefined);

      if (merged.pulled.length > 0) {
        setSyncState({ phase: 'found-missing', percent: 85, messageKey: 'foundMissing' });
        await sleep(400);
        if (!isCurrent()) return;
        setSyncState({ phase: 'applying', percent: 92, messageKey: 'applying' });
      } else if (merged.pushBack) {
        setSyncState({ phase: 'uploading', percent: 85, messageKey: 'uploading' });
      }

      const committed = await commitReconciledWorkspace({
        source: 'startup',
        referenceWb: merged.referenceWb ?? null,
        comparisonWb: merged.comparisonWb ?? null,
        settings: merged.settings ?? null,
        cloudResults: merged.results ?? null,
        cloudStats: merged.stats ?? null,
        clearMissingKeys: true,
        bumpStudioSession: merged.pulled.length > 0 || !merged.results,
      });
      if (!isCurrent()) return;

      const shouldSyncRecomputedResults =
        committed.recomputedResults &&
        committed.finalResults.length > 0 &&
        Boolean(committed.finalStats) &&
        !merged.results;

      if (merged.pushBack || (shouldSyncRecomputedResults && (hasCloudData || committed.effRef))) {
        const pushPayload: FullWorkspacePayload = merged.pushBack ? { ...merged.pushBack } : {};
        if (shouldSyncRecomputedResults && committed.finalStats) {
          pushPayload.results = committed.finalResults;
          pushPayload.stats = committed.finalStats;
        }
        setSyncState({ phase: 'uploading', percent: 94, messageKey: 'uploading' });
        await syncWorkspaceToSupabase(
          getEffectiveWorkspaceId(),
          pushPayload,
          merged.pushBack
            ? 'Startup sync: local data missing in cloud'
            : 'Startup sync: cached fresh matching results'
        );
      }

      setSyncState({
        phase: 'complete',
        percent: 100,
        messageKey: merged.pulled.length > 0 || merged.pushBack ? 'syncComplete' : 'scanComplete',
      });
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
    if (!isSupabaseConnected) {
      mergeDoneRef.current = false;
      return;
    }
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

  // Initial Load: restore from local IndexedDB first for fast UI rendering,
  // guarded by reconcileSeqRef so cloud startup reconciliation cannot be
  // overwritten if IndexedDB settles afterwards.
  useEffect(() => {
    let isMounted = true;
    const seqAtStart = reconcileSeqRef.current;
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

        // If cloud reconciliation or user mutation already committed newer state, do not overwrite.
        if (reconcileSeqRef.current !== seqAtStart) return;

        let restoredColConfigs: ColumnConfigItem[] | undefined;
        if (savedColConfigs && Array.isArray(savedColConfigs.order)) {
          restoredColConfigs = savedColConfigs.order.map((id: string) => ({
            id,
            label: id,
            category: 'data',
            showInTable: savedColConfigs.visibility?.[id]?.table !== false,
            showInExport: savedColConfigs.visibility?.[id]?.export !== false,
          }));
          setStudioColumnConfigs(restoredColConfigs);
        }

        if (savedRef) setReferenceWb(savedRef);
        if (savedComp) setComparisonWb(savedComp);
        if (savedMappings) setMappings(savedMappings);
        if (savedNorm) setNormalization(savedNorm);
        if (savedLayers) setLayers(savedLayers);
        if (typeof savedHoldCol === 'string') setHoldColumn(savedHoldCol);
        if (savedHoldVals) setHoldValues(savedHoldVals);
        if (typeof savedHoldReason === 'string') setHoldReason(savedHoldReason);
        if (savedReleased) setReleasedRowIds(savedReleased);

        latestStateRef.current = {
          referenceWb: savedRef ?? null,
          comparisonWb: savedComp ?? null,
          mappings: savedMappings ?? [],
          normalization: savedNorm || defaultNormalizationRules,
          layers: savedLayers || defaultDecisionLayers,
          holdColumn: typeof savedHoldCol === 'string' ? savedHoldCol : '',
          holdValues: savedHoldVals || [],
          holdReason: typeof savedHoldReason === 'string' ? savedHoldReason : '',
          releasedRowIds: savedReleased || [],
          studioColumnConfigs: restoredColConfigs,
        };

        // Auto-run matching if files and rules were previously loaded and Supabase is offline
        if (savedRef && savedComp && savedMappings && savedMappings.length > 0 && !isSupabaseConfigured()) {
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
            setStats(stampEvaluatedStats(evStats, savedRef, savedComp));
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


  // Coalescing cloud sync queue: merges concurrent payloads within a short window
  // so uploading Reference + Comparison + Results never drops earlier fields.
  const pendingSyncRef = useRef<{
    userId: string;
    payload: FullWorkspacePayload;
    reasons: string[];
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const clearPendingSync = useCallback(() => {
    const cur = pendingSyncRef.current;
    if (cur?.timer) clearTimeout(cur.timer);
    pendingSyncRef.current = null;
  }, []);

  const flushPendingSync = useCallback(() => {
    const cur = pendingSyncRef.current;
    if (!cur) return;
    if (cur.timer) clearTimeout(cur.timer);
    pendingSyncRef.current = null;
    const reason = cur.reasons[cur.reasons.length - 1] || 'Auto-sync workspace state';
    syncWorkspaceToSupabase(cur.userId, cur.payload, reason).then((res) => {
      if (!res.success) {
        console.warn('Auto-sync to Supabase warning:', res.error);
      }
    });
  }, []);

  const debouncedSyncToSupabase = useCallback(
    (uid: string, payload: FullWorkspacePayload, reason?: string) => {
      const prev = pendingSyncRef.current;
      if (prev?.timer) clearTimeout(prev.timer);
      const mergedPayload: FullWorkspacePayload =
        prev && prev.userId === uid
          ? {
              ...prev.payload,
              ...payload,
            }
          : { ...payload };
      const reasons = prev && prev.userId === uid ? [...prev.reasons] : [];
      if (reason) reasons.push(reason);

      const entry = {
        userId: uid,
        payload: mergedPayload,
        reasons,
        timer: setTimeout(() => {
          flushPendingSync();
        }, 450),
      };
      pendingSyncRef.current = entry;
    },
    [flushPendingSync]
  );

  // Flush any queued sync immediately if the user switches tabs or closes the page
  useEffect(() => {
    const handleVisibilityOrHide = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSync();
      }
    };
    window.addEventListener('pagehide', flushPendingSync);
    document.addEventListener('visibilitychange', handleVisibilityOrHide);
    return () => {
      window.removeEventListener('pagehide', flushPendingSync);
      document.removeEventListener('visibilitychange', handleVisibilityOrHide);
    };
  }, [flushPendingSync]);

  // Language Change
  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveToIDB(StorageKeys.LANGUAGE, lang);
  };

  // File Upload Handlers
  // Saved mapping key survives a file replace: mappings are matched by
  // header name, so any mapping whose columns still exist in the new file
  // is kept. Only mappings pointing at removed columns are dropped, and
  // auto-map runs only when nothing survives (e.g. renamed columns).
  // The kept mappings are saved locally AND pushed to the cloud together
  // with the file and the fresh results in one combined sync.
  const buildCompleteSettings = async (
    nextMappings: ColumnMapping[],
    overrides?: {
      holdColumn?: string;
      holdValues?: string[];
      holdReason?: string;
      releasedRowIds?: string[];
      columnConfigs?: ColumnConfigItem[];
      normalization?: NormalizationRules;
      layers?: DecisionLayer[];
    }
  ): Promise<WorkspaceSettings> => {
    const cur = latestStateRef.current;
    const [savedMapPresets, savedDecPresets, savedColConfigs] = await Promise.all([
      getFromIDB<SavedMappingPreset[]>(StorageKeys.SAVED_MAPPING_PRESETS),
      getFromIDB<SavedDecisionPreset[]>(StorageKeys.SAVED_DECISION_PRESETS),
      getFromIDB<StoredColumnSettings>(StorageKeys.COLUMN_CONFIGS),
    ]);
    const now = Date.now();
    settingsUpdatedAtRef.current = now;
    const colConfigs =
      overrides?.columnConfigs || cur.studioColumnConfigs
        ? buildStoredColConfigs(overrides?.columnConfigs ?? cur.studioColumnConfigs)
        : savedColConfigs ?? undefined;

    return {
      normalization: overrides?.normalization ?? cur.normalization,
      layers: overrides?.layers ?? cur.layers,
      mappings: nextMappings,
      holdColumn: overrides?.holdColumn ?? cur.holdColumn,
      holdValues: overrides?.holdValues ?? cur.holdValues,
      holdReason: overrides?.holdReason ?? cur.holdReason,
      releasedRowIds: overrides?.releasedRowIds ?? cur.releasedRowIds,
      mappingPresets: savedMapPresets ?? undefined,
      decisionPresets: savedDecPresets ?? undefined,
      columnConfigs: colConfigs,
      updatedAt: now,
    };
  };

  const handleSetReferenceWb = async (wb: WorkbookData | null) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.referenceWb = wb;
    setReferenceWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, wb);
    } else {
      await deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK);
      setResults([]);
      setStats(null);
      setStudioSession((n) => n + 1);
    }

    const curComp = latestStateRef.current.comparisonWb;
    const curMappings = latestStateRef.current.mappings;
    if (wb && curComp) {
      const kept = curMappings.filter(
        (m) => wb.headers.includes(m.mainCol) && curComp.headers.includes(m.comparisonCol)
      );
      latestStateRef.current.mappings = kept;
      setMappings(kept);
      await saveToIDB(StorageKeys.COLUMN_MAPPINGS, kept);
      const completeSettings = await buildCompleteSettings(kept);
      if (kept.length > 0) {
        handleExecuteMatching(wb, curComp, kept, false, undefined, undefined, undefined, {
          referenceWb: wb,
          settings: completeSettings,
        });
      } else {
        setResults([]);
        setStats(null);
        setStudioSession((n) => n + 1);
        showToast(t.toastMappingRequired, 'info');
        if (isSupabaseConnected) {
          debouncedSyncToSupabase(
            getEffectiveWorkspaceId(),
            { referenceWb: wb, results: null, stats: null, settings: completeSettings },
            `Reference Workbook loaded: '${wb.name || wb.activeSheet || 'File'}' (mapping required)`
          );
        }
      }
    } else if (isSupabaseConnected) {
      const reason = wb
        ? `Reference Workbook loaded: '${wb.name || wb.activeSheet || 'File'}' (${wb.rows?.length || 0} rows)`
        : 'Reference Workbook removed';
      debouncedSyncToSupabase(
        getEffectiveWorkspaceId(),
        wb ? { referenceWb: wb } : { referenceWb: null, results: null, stats: null },
        reason
      );
    }
  };

  const handleSetComparisonWb = async (wb: WorkbookData | null) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.comparisonWb = wb;
    setComparisonWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, wb);
    } else {
      await deleteFromIDB(StorageKeys.COMPARISON_WORKBOOK);
      setResults([]);
      setStats(null);
      setStudioSession((n) => n + 1);
    }

    const curRef = latestStateRef.current.referenceWb;
    const curMappings = latestStateRef.current.mappings;
    if (curRef && wb) {
      const kept = curMappings.filter(
        (m) => curRef.headers.includes(m.mainCol) && wb.headers.includes(m.comparisonCol)
      );
      latestStateRef.current.mappings = kept;
      setMappings(kept);
      await saveToIDB(StorageKeys.COLUMN_MAPPINGS, kept);
      const completeSettings = await buildCompleteSettings(kept);
      if (kept.length > 0) {
        handleExecuteMatching(curRef, wb, kept, false, undefined, undefined, undefined, {
          comparisonWb: wb,
          settings: completeSettings,
        });
      } else {
        setResults([]);
        setStats(null);
        setStudioSession((n) => n + 1);
        showToast(t.toastMappingRequired, 'info');
        if (isSupabaseConnected) {
          debouncedSyncToSupabase(
            getEffectiveWorkspaceId(),
            { comparisonWb: wb, results: null, stats: null, settings: completeSettings },
            `Comparison Workbook loaded: '${wb.name || wb.activeSheet || 'File'}' (mapping required)`
          );
        }
      }
    } else if (isSupabaseConnected) {
      const reason = wb
        ? `Comparison Workbook loaded: '${wb.name || wb.activeSheet || 'File'}' (${wb.rows?.length || 0} rows)`
        : 'Comparison Workbook removed';
      debouncedSyncToSupabase(
        getEffectiveWorkspaceId(),
        wb ? { comparisonWb: wb } : { comparisonWb: null, results: null, stats: null },
        reason
      );
    }
  };

  const handleSelectReferenceSheet = async (sheetName: string) => {
    const curRef = latestStateRef.current.referenceWb;
    if (!curRef) return;
    try {
      const updated = changeWorkbookSheet(curRef, sheetName);
      reconcileSeqRef.current += 1;
      latestStateRef.current.referenceWb = updated;
      setReferenceWb(updated);
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, updated);
      const curComp = latestStateRef.current.comparisonWb;
      const curMappings = latestStateRef.current.mappings;
      if (curComp) {
        const kept = curMappings.filter(
          (m) => updated.headers.includes(m.mainCol) && curComp.headers.includes(m.comparisonCol)
        );
        latestStateRef.current.mappings = kept;
        setMappings(kept);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, kept);
        const completeSettings = await buildCompleteSettings(kept);
        if (kept.length > 0) {
          handleExecuteMatching(updated, curComp, kept, false, undefined, undefined, undefined, {
            referenceWb: updated,
            settings: completeSettings,
          });
        } else {
          setResults([]);
          setStats(null);
          setStudioSession((n) => n + 1);
          showToast(t.toastMappingRequired, 'info');
          if (isSupabaseConnected) {
            debouncedSyncToSupabase(
              getEffectiveWorkspaceId(),
              { referenceWb: updated, results: null, stats: null, settings: completeSettings },
              `Switched Reference sheet to '${sheetName}' (mapping required)`
            );
          }
        }
      } else if (isSupabaseConnected) {
        debouncedSyncToSupabase(
          getEffectiveWorkspaceId(),
          { referenceWb: updated },
          `Switched Reference sheet to '${sheetName}'`
        );
      }
    } catch {
      showToast('Could not switch sheet', 'error');
    }
  };

  const handleSelectComparisonSheet = async (sheetName: string) => {
    const curComp = latestStateRef.current.comparisonWb;
    if (!curComp) return;
    try {
      const updated = changeWorkbookSheet(curComp, sheetName);
      reconcileSeqRef.current += 1;
      latestStateRef.current.comparisonWb = updated;
      setComparisonWb(updated);
      await saveToIDB(StorageKeys.COMPARISON_WORKBOOK, updated);
      const curRef = latestStateRef.current.referenceWb;
      const curMappings = latestStateRef.current.mappings;
      if (curRef) {
        const kept = curMappings.filter(
          (m) => curRef.headers.includes(m.mainCol) && updated.headers.includes(m.comparisonCol)
        );
        latestStateRef.current.mappings = kept;
        setMappings(kept);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, kept);
        const completeSettings = await buildCompleteSettings(kept);
        if (kept.length > 0) {
          handleExecuteMatching(curRef, updated, kept, false, undefined, undefined, undefined, {
            comparisonWb: updated,
            settings: completeSettings,
          });
        } else {
          setResults([]);
          setStats(null);
          setStudioSession((n) => n + 1);
          showToast(t.toastMappingRequired, 'info');
          if (isSupabaseConnected) {
            debouncedSyncToSupabase(
              getEffectiveWorkspaceId(),
              { comparisonWb: updated, results: null, stats: null, settings: completeSettings },
              `Switched Comparison sheet to '${sheetName}' (mapping required)`
            );
          }
        }
      } else if (isSupabaseConnected) {
        debouncedSyncToSupabase(
          getEffectiveWorkspaceId(),
          { comparisonWb: updated },
          `Switched Comparison sheet to '${sheetName}'`
        );
      }
    } catch {
      showToast('Could not switch sheet', 'error');
    }
  };

  // Rule Handlers
  const handleUpdateMappings = async (newMappings: ColumnMapping[]) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.mappings = newMappings;
    setMappings(newMappings);
    await saveToIDB(StorageKeys.COLUMN_MAPPINGS, newMappings);
  };

  const handleUpdateNormalization = async (newNorm: NormalizationRules) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.normalization = newNorm;
    setNormalization(newNorm);
    await saveToIDB(StorageKeys.NORMALIZATION_RULES, newNorm);
  };

  const handleUpdateLayers = async (newLayers: DecisionLayer[]) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.layers = newLayers;
    setLayers(newLayers);
    await saveToIDB(StorageKeys.DECISION_LAYERS, newLayers);
  };

  const handleHoldSettingsChange = async (col: string, vals: string[], reason: string) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.holdColumn = col;
    latestStateRef.current.holdValues = vals;
    latestStateRef.current.holdReason = reason;
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
    const cur = latestStateRef.current;
    const keyLower = key.trim().toLowerCase();
    const nextHoldValues = cur.holdValues.filter((v) => v.trim().toLowerCase() !== keyLower);
    reconcileSeqRef.current += 1;
    latestStateRef.current.holdValues = nextHoldValues;
    setHoldValues(nextHoldValues);
    await saveToIDB(StorageKeys.HOLD_VALUES, nextHoldValues);

    const targetRowIds = results
      .filter((r) => {
        if (r.decisionColor !== 'blue') return false;
        if (r.holdKey && r.holdKey.trim().toLowerCase() === keyLower) return true;
        if (r.matchKey && r.matchKey.trim().toLowerCase() === keyLower) return true;
        if (cur.holdColumn && String(r.comparisonRow[cur.holdColumn] ?? '').trim().toLowerCase() === keyLower) return true;
        return false;
      })
      .map((r) => r.id);

    const targetSet = new Set(targetRowIds);
    const nextReleased = Array.from(new Set([...cur.releasedRowIds, ...targetRowIds]));
    latestStateRef.current.releasedRowIds = nextReleased;
    setReleasedRowIds(nextReleased);
    await saveToIDB(StorageKeys.RELEASED_ROWS, nextReleased);

    let green = 0;
    let yellow = 0;
    if (cur.referenceWb && cur.comparisonWb && cur.mappings.length > 0) {
      const { results: evaluatedResults, stats: evaluatedStats } = processMatching(
        cur.referenceWb,
        cur.comparisonWb,
        cur.mappings,
        cur.normalization,
        cur.layers,
        nextHoldValues,
        nextReleased,
        cur.holdColumn
      );
      const stampedStats = stampEvaluatedStats(evaluatedStats, cur.referenceWb, cur.comparisonWb);
      setResults(evaluatedResults);
      setStats(stampedStats);

      for (const r of evaluatedResults) {
        if (targetSet.has(r.id)) {
          if (r.decisionColor === 'green') green++;
          else yellow++;
        }
      }

      if (isSupabaseConnected) {
        const completeSettings = await buildCompleteSettings(cur.mappings, {
          holdValues: nextHoldValues,
          releasedRowIds: nextReleased,
        });
        stampedStats.evaluatedSettingsAt = completeSettings.updatedAt;
        debouncedSyncToSupabase(
          getEffectiveWorkspaceId(),
          { results: evaluatedResults, stats: stampedStats, settings: completeSettings },
          `Released hold key "${key}" (${targetRowIds.length} rows: ${green} green, ${yellow} yellow)`
        );
      }
    }

    return { key, green, yellow, total: targetRowIds.length };
  };

  const handleSaveAllSettingsExplicit = async (
    holdOverrides?: {
      holdColumn?: string;
      holdValues?: string[];
      holdReason?: string;
    },
    options?: { skipReevaluate?: boolean; skipCloudSync?: boolean }
  ) => {
    const cur = latestStateRef.current;
    const effHoldCol = holdOverrides?.holdColumn ?? cur.holdColumn;
    const effHoldVals = holdOverrides?.holdValues ?? cur.holdValues;
    const effHoldReason = holdOverrides?.holdReason ?? cur.holdReason;

    reconcileSeqRef.current += 1;
    latestStateRef.current.holdColumn = effHoldCol;
    latestStateRef.current.holdValues = effHoldVals;
    latestStateRef.current.holdReason = effHoldReason;

    await Promise.all([
      saveToIDB(StorageKeys.COLUMN_MAPPINGS, cur.mappings),
      saveToIDB(StorageKeys.NORMALIZATION_RULES, cur.normalization),
      saveToIDB(StorageKeys.DECISION_LAYERS, cur.layers),
      saveToIDB(StorageKeys.HOLD_COLUMN, effHoldCol),
      saveToIDB(StorageKeys.HOLD_VALUES, effHoldVals),
      saveToIDB(StorageKeys.HOLD_REASON, effHoldReason),
      saveToIDB(StorageKeys.RELEASED_ROWS, cur.releasedRowIds),
    ]);

    const settingsPayload = await buildCompleteSettings(cur.mappings, {
      holdColumn: effHoldCol,
      holdValues: effHoldVals,
      holdReason: effHoldReason,
    });

    let evaluatedResults: MatchedRow[] | undefined;
    let evaluatedStats: MatchingStats | undefined;

    if (!options?.skipReevaluate && cur.referenceWb && cur.comparisonWb && cur.mappings.length > 0) {
      try {
        const res = processMatching(
          cur.referenceWb,
          cur.comparisonWb,
          cur.mappings,
          cur.normalization,
          cur.layers,
          effHoldVals,
          cur.releasedRowIds,
          effHoldCol
        );
        evaluatedResults = res.results;
        evaluatedStats = stampEvaluatedStats(
          res.stats,
          cur.referenceWb,
          cur.comparisonWb,
          settingsPayload.updatedAt
        );
        setResults(evaluatedResults);
        setStats(evaluatedStats);
      } catch (e) {
        console.warn('Auto-reevaluation after saving settings failed:', e);
      }
    }

    if (options?.skipCloudSync) {
      return;
    }

    if (isSupabaseConnected) {
      clearPendingSync();
      const syncPayload: FullWorkspacePayload = { settings: settingsPayload };
      if (evaluatedResults && evaluatedStats) {
        syncPayload.results = evaluatedResults;
        syncPayload.stats = evaluatedStats;
      }
      const res = await syncWorkspaceToSupabase(
        getEffectiveWorkspaceId(),
        syncPayload,
        `Updated ${cur.layers.length} decision layers & ${cur.mappings.length} column mappings`
      );
      if (res.success) {
        showToast(`${t.toastRulesSaved} (Synced to Supabase)`, 'success');
      } else {
        showToast(
          `${t.toastRulesSaved} (Cloud sync warning: ${res.error || 'Unknown error'})`,
          'error'
        );
      }
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
    customHoldColumn?: string,
    // Extra columns for the results sync (e.g. a replaced file + its
    // complete settings), so one coalesced call carries everything.
    extraSync?: {
      referenceWb?: WorkbookData | null;
      comparisonWb?: WorkbookData | null;
      settings?: WorkspaceSettings;
    },
    skipCloudSync = false,
    customHoldReason?: string
  ) => {
    const cur = latestStateRef.current;
    const ref = customRef !== undefined ? customRef : cur.referenceWb;
    const comp = customComp !== undefined ? customComp : cur.comparisonWb;

    if (!ref || !comp) {
      showToast(t.toastBothFilesRequired, 'error');
      return;
    }

    const effectiveMappings = customMappings || cur.mappings;

    if (effectiveMappings.length === 0) {
      showToast(t.toastMappingRequired, 'error');
      setIsRulesModalOpen(true);
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const latest = latestStateRef.current;
        const effHoldVals = customHoldValues !== undefined ? customHoldValues : latest.holdValues;
        const effReleased = customReleasedRowIds !== undefined ? customReleasedRowIds : latest.releasedRowIds;
        const effHoldCol = customHoldColumn !== undefined ? customHoldColumn : latest.holdColumn;
        const effHoldReason = customHoldReason !== undefined ? customHoldReason : latest.holdReason;

        const { results: evaluatedResults, stats: evaluatedStats } = processMatching(
          ref,
          comp,
          effectiveMappings,
          latest.normalization,
          latest.layers,
          effHoldVals,
          effReleased,
          effHoldCol
        );

        let syncSettings = extraSync?.settings;
        if (isSupabaseConnected && !skipCloudSync && !syncSettings) {
          syncSettings = await buildCompleteSettings(effectiveMappings, {
            holdColumn: effHoldCol,
            holdValues: effHoldVals,
            holdReason: effHoldReason,
            releasedRowIds: effReleased,
          });
        }

        const stampedStats = stampEvaluatedStats(
          evaluatedStats,
          ref,
          comp,
          syncSettings?.updatedAt ?? settingsUpdatedAtRef.current
        );

        setResults(evaluatedResults);
        setStats(stampedStats);

        if (isSupabaseConnected && !skipCloudSync) {
          debouncedSyncToSupabase(
            getEffectiveWorkspaceId(),
            {
              results: evaluatedResults,
              stats: stampedStats,
              ...extraSync,
              ...(syncSettings ? { settings: syncSettings } : {}),
            },
            `Matching evaluated (${stampedStats.totalIncoming} rows: ${stampedStats.greenCount} Green, ${stampedStats.yellowCount} Yellow, ${stampedStats.redCount} Red)`
          );
        }

        if (notifySuccess) {
          playSuccessChime();
          showToast(
            t.toastEvaluatedSummary
              .replace('{total}', String(stampedStats.totalIncoming))
              .replace('{green}', String(stampedStats.greenCount))
              .replace('{yellow}', String(stampedStats.yellowCount))
              .replace('{red}', String(stampedStats.redCount)),
            'success'
          );
        }
        if (stampedStats.blueCount > 0) {
          showToast(
            t.toastHoldFound.replace('{n}', String(stampedStats.blueCount)),
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

  const executeMatchingRef = useRef(handleExecuteMatching);
  executeMatchingRef.current = handleExecuteMatching;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      const isInputActive =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Close modal on Escape
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (previewModal.isOpen) {
          setPreviewModal({ isOpen: false, workbook: null, title: '' });
          return;
        }
        if (isRulesModalOpen) {
          setIsRulesModalOpen(false);
          return;
        }
        if (isSupabaseConfigOpen) {
          setIsSupabaseConfigOpen(false);
          return;
        }
        if (isSyncHistoryOpen) {
          setIsSyncHistoryOpen(false);
          return;
        }
        if (isRestoreModalOpen && !isRestoring) {
          setIsRestoreModalOpen(false);
          return;
        }
      }

      // Open Shortcuts Guide: '?' (Shift + /)
      if (e.key === '?' && !isInputActive) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Open / Toggle Rules: Ctrl/Cmd + M
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm' && !isInputActive) {
        e.preventDefault();
        setIsRulesModalOpen((prev) => !prev);
        return;
      }

      // Run Matching: Ctrl/Cmd + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (referenceWb && comparisonWb) {
          executeMatchingRef.current();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isShortcutsOpen,
    previewModal.isOpen,
    isRulesModalOpen,
    isSupabaseConfigOpen,
    isSyncHistoryOpen,
    isRestoreModalOpen,
    isRestoring,
    referenceWb,
    comparisonWb,
  ]);

  const handleSupabaseSignOut = async () => {
    await signOutSupabase();
    setSupabaseUser(null);
    // Shared workspace: signing out changes no workspace id, so no
    // re-merge is needed (the old per-user pull reset is gone).
    showToast('Signed out of Supabase.', 'info');
  };

  const handleRestoreOriginalStage = async () => {
    clearPendingSync();
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
        StorageKeys.LAST_CLOUD_SYNC_AT,
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

      reconcileSeqRef.current += 1;
      latestStateRef.current = {
        referenceWb: null,
        comparisonWb: null,
        mappings: [],
        normalization: defaultNormalizationRules,
        layers: defaultDecisionLayers,
        holdColumn: '',
        holdValues: [],
        holdReason: '',
        releasedRowIds: [],
        studioColumnConfigs: undefined,
      };
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

  // Column view changes sync to the cloud like any other setting.
  const handleSaveColumnConfigs = async (configs: ColumnConfigItem[]) => {
    reconcileSeqRef.current += 1;
    latestStateRef.current.studioColumnConfigs = configs;
    setStudioColumnConfigs(configs);
    if (isSupabaseConnected) {
      const settingsPayload = await buildCompleteSettings(latestStateRef.current.mappings, {
        columnConfigs: configs,
      });
      debouncedSyncToSupabase(
        getEffectiveWorkspaceId(),
        { settings: settingsPayload },
        'Column view settings updated'
      );
    }
  };

  const handleTriggerManualSync = async () => {
    if (!isSupabaseConnected) {
      showToast('Please configure Supabase first.', 'error');
      return;
    }

    clearPendingSync();
    const cur = latestStateRef.current;
    const settingsPayload = await buildCompleteSettings(cur.mappings);
    const payload = {
      referenceWb: cur.referenceWb,
      comparisonWb: cur.comparisonWb,
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
    playNotifyChime();
  };

  const handleTriggerManualPull = async () => {
    if (!isSupabaseConnected) {
      showToast('Please configure Supabase first.', 'error');
      return;
    }
    clearPendingSync();
    const { success, data, error } = await fetchWorkspaceFromSupabase(
      getEffectiveWorkspaceId(),
      'Manual workspace restore from cloud'
    );
    if (!success) {
      throw new Error(error || 'Failed to fetch from Supabase');
    }
    if (!data) {
      throw new Error('No cloud workspace snapshot found in Supabase yet.');
    }

    await commitReconciledWorkspace({
      source: 'pull',
      referenceWb: data.referenceWb ?? null,
      comparisonWb: data.comparisonWb ?? null,
      settings: data.settings ?? null,
      cloudResults: data.results ?? null,
      cloudStats: data.stats ?? null,
      clearMissingKeys: true,
      bumpStudioSession: true,
    });
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
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
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
        onExecuteMatching={(holdOverrides) =>
          handleExecuteMatching(
            undefined,
            undefined,
            undefined,
            true,
            holdOverrides?.holdValues,
            undefined,
            holdOverrides?.holdColumn,
            undefined,
            false,
            holdOverrides?.holdReason
          )
        }
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

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        language={language}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} language={language} />
    </div>
  );
}
