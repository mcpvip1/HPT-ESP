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
} from './lib/cloudSync';
import {
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Save,
  Check,
  Settings,
  SlidersHorizontal,
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
  const [previewFilter, setPreviewFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'unmatched'>('all');
  const [previewSearchTerm, setPreviewSearchTerm] = useState<string>('');
  const [previewSearchColumn, setPreviewSearchColumn] = useState<string>('all');
  const [previewColumnConfigs, setPreviewColumnConfigs] = useState<ColumnConfigItem[] | undefined>(undefined);

  // Workbooks
  const [referenceWb, setReferenceWb] = useState<WorkbookData | null>(null);
  const [comparisonWb, setComparisonWb] = useState<WorkbookData | null>(null);

  // Rules & Configuration
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [normalization, setNormalization] = useState<NormalizationRules>(
    defaultNormalizationRules
  );
  const [layers, setLayers] = useState<DecisionLayer[]>(defaultDecisionLayers);

  // Cloud sync (Firebase): one shared workspace across every device
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const rulesStateRef = useRef({ normalization, layers, mappings });
  rulesStateRef.current = { normalization, layers, mappings };
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
      if (pData.searchTerm !== undefined) setPreviewSearchTerm(pData.searchTerm);
      if (pData.searchColumn) setPreviewSearchColumn(pData.searchColumn);
      if (pData.columnConfigs) setPreviewColumnConfigs(pData.columnConfigs);
      return true;
    }
    return false;
  }, []);

  // ---- Cloud sync: auth, shared rules, live preview -----------------------
  // Sign in: pull the shared rule settings so this device matches the others.
  // First sign-in on the account seeds the cloud with this device's settings.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCloudUser(u);
      if (!u) return;
      try {
        const cloud = await fetchRulesState(u.uid);
        if (cloud && cloud.updatedAt) {
          if (cloud.normalization) {
            setNormalization(cloud.normalization);
            await saveToIDB(StorageKeys.NORMALIZATION_RULES, cloud.normalization);
          }
          if (cloud.layers && cloud.layers.length > 0) {
            setLayers(cloud.layers);
            await saveToIDB(StorageKeys.DECISION_LAYERS, cloud.layers);
          }
          if (cloud.mappings) {
            setMappings(cloud.mappings);
            await saveToIDB(StorageKeys.COLUMN_MAPPINGS, cloud.mappings);
          }
          lastRulesPublishRef.current = JSON.stringify({
            n: cloud.normalization,
            l: cloud.layers,
            m: cloud.mappings,
          });
          showToast('Cloud workspace synced — rules & mappings match your other devices.', 'success');
        } else {
          const cur = rulesStateRef.current;
          await publishRulesState(u.uid, cur);
          lastRulesPublishRef.current = JSON.stringify({
            n: cur.normalization,
            l: cur.layers,
            m: cur.mappings,
          });
        }
      } catch (e) {
        console.warn('Cloud rules sync failed', e);
      }
    });
    return () => unsub();
  }, []);

  // Publish rule settings to the cloud whenever they change (debounced).
  const debouncedPublishRules = useRef(
    debounce((uid: string, st: { normalization: NormalizationRules; layers: DecisionLayer[]; mappings: ColumnMapping[] }) => {
      const key = JSON.stringify({ n: st.normalization, l: st.layers, m: st.mappings });
      if (key === lastRulesPublishRef.current) return;
      lastRulesPublishRef.current = key;
      publishRulesState(uid, st);
    }, 1500)
  ).current;

  useEffect(() => {
    if (!cloudUser || isPreviewMode) return;
    debouncedPublishRules(cloudUser.uid, rulesStateRef.current);
  }, [cloudUser, isPreviewMode, normalization, layers, mappings, debouncedPublishRules]);

  // Live public share: follow the shared snapshot in real time (no sign-in).
  // If the owner turns sharing off, the last received snapshot stays visible.
  useEffect(() => {
    if (!shareId || !isPreviewMode) return;
    const unsub = subscribeSharedSnapshot(shareId, async (meta) => {
      if (meta === null) {
        if (!shareRevokedToastShownRef.current) {
          shareRevokedToastShownRef.current = true;
          showToast('Live sharing was turned off — showing the last received snapshot.', 'info');
        }
        return;
      }
      if (!meta.updatedAt || meta.updatedAt <= lastCloudPreviewAtRef.current) return;
      lastCloudPreviewAtRef.current = meta.updatedAt;
      const pData = await fetchSharedSnapshot(shareId);
      if (pData && checkAndApplyPreview(pData)) {
        showToast('Preview synced with the latest changes.', 'success');
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
        showToast('Preview synced with the latest changes.', 'success');
      }
    });
    return () => unsub();
  }, [cloudUser, isPreviewMode, checkAndApplyPreview, showToast]);

  const handleCloudSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      showToast(e?.message || 'Google sign-in failed.', 'error');
    }
  };

  const handleCloudSignOut = async () => {
    try {
      await signOutGoogle();
      showToast('Signed out of cloud sync.', 'info');
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
        if (urlShareId) {
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
        if (isPreviewRoute) {
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

        const savedLang = await getFromIDB<Language>(StorageKeys.LANGUAGE);
        if (savedLang && isMounted) setLanguage(savedLang);

        const savedRef = await getFromIDB<WorkbookData>(
          StorageKeys.REFERENCE_WORKBOOK
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

        if (savedNorm && isMounted) setNormalization(savedNorm);
        if (savedLayers && savedLayers.length > 0 && isMounted) setLayers(savedLayers);

        if (savedRef && isMounted) {
          setReferenceWb(savedRef);
          if (savedMappings) setMappings(savedMappings);
        } else if (isMounted) {
          // Preload enterprise demo datasets on very first visit so user has immediate working experience
          const demo = generateSampleDatasets();
          setReferenceWb(demo.reference);
          setComparisonWb(demo.comparison);
          const auto = autoMapColumns(demo.reference.headers, demo.comparison.headers);
          setMappings(auto);
          await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, demo.reference);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
        }
      } catch (e) {
        console.error('Storage loading error:', e);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setIsStorageLoading(false);
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
  }, []);

  // Auto-save Reference Workbook to Persistent Storage
  const handleSetReferenceWb = async (wb: WorkbookData | null) => {
    setReferenceWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, wb);
      // Only auto-map if there are no existing saved mappings
      if (mappings.length === 0 && comparisonWb) {
        const auto = autoMapColumns(wb.headers, comparisonWb.headers);
        if (auto.length > 0) {
          setMappings(auto);
          await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
        }
      }
    } else {
      await deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK);
    }
  };

  const handleSetComparisonWb = async (wb: WorkbookData | null, autoEvaluate = true) => {
    setComparisonWb(wb);
    if (wb) {
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
        showToast(`Imported ${wb.name}! Generating Results & Export with saved Rules & Logic Settings...`, 'info');
        handleExecuteMatching(referenceWb, wb, effectiveMappings, true);
      }
    }
  };

  // Switch Active Sheet for Main Reference File
  const handleSelectReferenceSheet = async (sheetName: string) => {
    if (!referenceWb || referenceWb.activeSheet === sheetName) return;

    const updatedWb = changeWorkbookSheet(referenceWb, sheetName);
    setReferenceWb(updatedWb);
    await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, updatedWb);

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
        `Switched Main File sheet to "${sheetName}" (${updatedWb.rows.length.toLocaleString()} rows, ${updatedWb.headers.length} columns). Updating results...`,
        'info'
      );

      handleExecuteMatching(updatedWb, comparisonWb, effectiveMappings, true);
    } else {
      showToast(
        `Switched Main File sheet to "${sheetName}" (${updatedWb.rows.length.toLocaleString()} rows, ${updatedWb.headers.length} columns).`,
        'success'
      );
    }
  };

  // Switch Active Sheet for Incoming Comparison File
  const handleSelectComparisonSheet = async (sheetName: string) => {
    if (!comparisonWb || comparisonWb.activeSheet === sheetName) return;

    const updatedWb = changeWorkbookSheet(comparisonWb, sheetName);
    setComparisonWb(updatedWb);

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
        `Switched Incoming File sheet to "${sheetName}" (${updatedWb.rows.length.toLocaleString()} rows, ${updatedWb.headers.length} columns). Updating results...`,
        'info'
      );

      handleExecuteMatching(referenceWb, updatedWb, effectiveMappings, true);
    } else {
      showToast(
        `Switched Incoming File sheet to "${sheetName}" (${updatedWb.rows.length.toLocaleString()} rows, ${updatedWb.headers.length} columns).`,
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
    showToast('Exited Live Preview mode. Full studio controls restored.', 'info');
  };

  // Explicit Save Settings confirmation for user
  const handleSaveAllSettingsExplicit = async () => {
    await saveToIDB(StorageKeys.COLUMN_MAPPINGS, mappings);
    await saveToIDB(StorageKeys.NORMALIZATION_RULES, normalization);
    await saveToIDB(StorageKeys.DECISION_LAYERS, layers);
    showToast(
      'Rules & Logic Settings saved! Saved once, future file imports will automatically evaluate and show Results & Export directly.',
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

    showToast('Enterprise Procurement & Inspection Sample loaded! Evaluating...', 'success');
    handleExecuteMatching(demo.reference, demo.comparison, auto, true);
  };

  // Execute Matching & Decision Rules
  const handleExecuteMatching = (
    customRef?: WorkbookData | null,
    customComp?: WorkbookData | null,
    customMappings?: ColumnMapping[],
    notifySuccess = true
  ) => {
    const ref = customRef !== undefined ? customRef : referenceWb;
    const comp = customComp !== undefined ? customComp : comparisonWb;

    if (!ref || !comp) {
      showToast('Both Reference and Comparison workbooks are required.', 'error');
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
      showToast('Please specify at least one column mapping in Rules & Logic Setting.', 'error');
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
          layers
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
            `Evaluated ${evaluatedStats.totalIncoming} rows: ${evaluatedStats.greenCount} passed, ${evaluatedStats.yellowCount} review, ${evaluatedStats.redCount} rejected.`,
            'success'
          );
        }
      } catch (err: any) {
        showToast(err.message || 'Error occurred during matching.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  if (isStorageLoading) {
    return <GlobalLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header (Adapts cleanly to Studio or Preview mode) */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        cloudUser={cloudUser}
        onCloudSignIn={handleCloudSignIn}
        onCloudSignOut={handleCloudSignOut}
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
                initialSearchTerm={previewSearchTerm}
                initialSearchColumn={previewSearchColumn}
                initialColumnConfigs={previewColumnConfigs}
                onExitPreview={handleExitPreview}
                onRefresh={() => {
                  const pData = parsePreviewFromUrl();
                  if (pData) {
                    checkAndApplyPreview(pData);
                  }
                  showToast('Preview results refreshed', 'success');
                }}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  No Matching Results Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The shared result preview link does not contain results data, or the link expired.
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
                  results={results}
                  stats={stats}
                  comparisonWb={comparisonWb}
                  language={language}
                  onShowToast={showToast}
                  isPreviewMode={false}
                  initialColumnConfigs={previewColumnConfigs}
                  cloudUser={cloudUser}
                />
              </div>
            )}
          </div>
        )}
      </main>

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
      />



      {/* Global Data Preview Modal */}
      <DataPreviewModal
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
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
