import { useState, useEffect, useCallback } from 'react';
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
  SharedPreviewPayload,
} from './utils/previewSharing';
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

  // Live Preview Mode State (activated via #preview=... or ?preview=...)
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      return hash.includes('preview') || search.includes('preview');
    }
    return false;
  });
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

  // Initial Load from Persistent Storage & Live Preview Link Handling
  useEffect(() => {
    let isMounted = true;
    // Safety guard: max 1200ms loading skeleton time
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsStorageLoading(false);
    }, 1200);

    async function loadSavedState() {
      try {
        // Priority 1: Check if page was loaded via a Live Preview Link (#preview=... or ?preview=...)
        const previewData = parsePreviewFromUrl();
        if (previewData && isMounted) {
          const applied = checkAndApplyPreview(previewData);
          if (applied) {
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

    // Listen to hash changes (e.g. clicking shared links or exiting preview)
    const handleHashChange = () => {
      const pData = parsePreviewFromUrl();
      if (pData) {
        checkAndApplyPreview(pData);
      } else if (!window.location.hash.includes('preview') && !window.location.search.includes('preview')) {
        setIsPreviewMode(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener('hashchange', handleHashChange);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header (Adapts cleanly to Studio or Preview mode) */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  No Matching Results Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The shared result preview link does not contain results data, or the link expired.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleExitPreview}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                  >
                    Open Studio Mode
                  </button>
                </div>
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
              onPreviewWb={(wb, title) =>
                setPreviewModal({ isOpen: true, workbook: wb, title })
              }
              language={language}
              onShowToast={showToast}
            />

            {/* Filtered Results & Table Section (Immediately shown below after import) */}
            {results.length > 0 && stats && (
              <div className="pt-2 border-t border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{t.step3Title || 'Evaluation Results'}</span>
                      <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                        {stats.totalIncoming.toLocaleString()} rows
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filtered results based on your Rules & Logic Setting. Reorder columns, filter, and share preview links.
                    </p>
                  </div>
                </div>

                <ResultsDashboard
                  results={results}
                  stats={stats}
                  comparisonWb={comparisonWb}
                  language={language}
                  onShowToast={showToast}
                  isPreviewMode={false}
                  initialColumnConfigs={previewColumnConfigs}
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ExcelMatch Pro</span>
            <span aria-hidden="true">·</span>
            <span>Enterprise Multi-Column Auto-Sorting & Decision Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Client-side Secure Processing</span>
            <span aria-hidden="true">·</span>
            <span>Zero Data Leakage</span>
          </div>
        </div>
      </footer>

      {/* Global Data Preview Modal */}
      <DataPreviewModal
        workbook={previewModal.workbook}
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, workbook: null, title: '' })
        }
        title={previewModal.title}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
