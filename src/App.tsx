import { useState, useEffect, useCallback } from 'react';
import {
  WorkbookData,
  ColumnMapping,
  NormalizationRules,
  DecisionLayer,
  Language,
  MatchedRow,
  MatchingStats,
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
import { ColumnMappingRules } from './components/ColumnMappingRules';
import { DecisionLayers } from './components/DecisionLayers';
import { ResultsDashboard } from './components/ResultsDashboard';
import { DataPreviewModal } from './components/DataPreviewModal';
import { Toast, ToastMessage } from './components/Toast';
import { translations } from './translations';
import {
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // Initial Load from Persistent Storage
  useEffect(() => {
    async function loadSavedState() {
      try {
        const savedLang = await getFromIDB<Language>(StorageKeys.LANGUAGE);
        if (savedLang) setLanguage(savedLang);

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

        if (savedNorm) setNormalization(savedNorm);
        if (savedLayers && savedLayers.length > 0) setLayers(savedLayers);

        if (savedRef) {
          setReferenceWb(savedRef);
          if (savedMappings) setMappings(savedMappings);
        } else {
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
      }
    }

    loadSavedState();
  }, []);

  // Auto-save Reference Workbook to Persistent Storage
  const handleSetReferenceWb = async (wb: WorkbookData | null) => {
    setReferenceWb(wb);
    if (wb) {
      await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, wb);
      if (comparisonWb) {
        const auto = autoMapColumns(wb.headers, comparisonWb.headers);
        setMappings(auto);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
      }
    } else {
      await deleteFromIDB(StorageKeys.REFERENCE_WORKBOOK);
      setMappings([]);
      await deleteFromIDB(StorageKeys.COLUMN_MAPPINGS);
    }
  };

  const handleSetComparisonWb = async (wb: WorkbookData | null) => {
    setComparisonWb(wb);
    if (wb && referenceWb) {
      const auto = autoMapColumns(referenceWb.headers, wb.headers);
      if (auto.length > 0) {
        setMappings(auto);
        await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);
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

  // Load Built-in Demo Data
  const handleLoadSampleData = async () => {
    const demo = generateSampleDatasets();
    setReferenceWb(demo.reference);
    setComparisonWb(demo.comparison);
    const auto = autoMapColumns(demo.reference.headers, demo.comparison.headers);
    setMappings(auto);

    await saveToIDB(StorageKeys.REFERENCE_WORKBOOK, demo.reference);
    await saveToIDB(StorageKeys.COLUMN_MAPPINGS, auto);

    showToast('Enterprise Procurement & Inspection Sample loaded!', 'success');
  };

  // Execute Matching & Decision Rules
  const handleExecuteMatching = () => {
    if (!referenceWb || !comparisonWb) {
      showToast('Both Reference and Comparison workbooks are required.', 'error');
      return;
    }

    if (mappings.length === 0) {
      showToast('Please specify at least one column mapping in Step 2.', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const { results: evaluatedResults, stats: evaluatedStats } = processMatching(
          referenceWb,
          comparisonWb,
          mappings,
          normalization,
          layers
        );

        setResults(evaluatedResults);
        setStats(evaluatedStats);
        setCurrentStep(3); // Jump to results tab
        showToast(
          `Evaluated ${evaluatedStats.totalIncoming} rows: ${evaluatedStats.greenCount} passed, ${evaluatedStats.yellowCount} review, ${evaluatedStats.redCount} rejected.`,
          'success'
        );
      } catch (err: any) {
        showToast(err.message || 'Error occurred during matching.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header (Follows Top Bar Contract) */}
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoadSampleData={handleLoadSampleData}
        hasRefFile={!!referenceWb}
        hasCompFile={!!comparisonWb}
        hasResults={results.length > 0}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step Indicator Strip */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-1 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {/* Step 1 Button */}
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentStep === 1
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] ${
                  currentStep === 1
                    ? 'bg-emerald-600 text-white'
                    : referenceWb
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {referenceWb ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span>{t.step1}</span>
            </button>

            <span className="text-slate-700 text-sm hidden sm:inline">→</span>

            {/* Step 2 Button */}
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!referenceWb && !comparisonWb}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                currentStep === 2
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] ${
                  currentStep === 2
                    ? 'bg-emerald-600 text-white'
                    : mappings.length > 0
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {mappings.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span>{t.step2}</span>
            </button>

            <span className="text-slate-700 text-sm hidden sm:inline">→</span>

            {/* Step 3 Button */}
            <button
              onClick={() => setCurrentStep(3)}
              disabled={results.length === 0}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                currentStep === 3
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] ${
                  currentStep === 3
                    ? 'bg-emerald-600 text-white'
                    : results.length > 0
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {results.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
              </div>
              <span>{t.step3}</span>
            </button>
          </div>

          {/* Quick Action Button on the Right */}
          {referenceWb && comparisonWb && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {currentStep !== 3 && (
                <button
                  onClick={handleExecuteMatching}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-950 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{isProcessing ? 'Evaluating...' : 'Run Match Engine'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: File Management */}
        {currentStep === 1 && (
          <FilesManagement
            referenceWb={referenceWb}
            comparisonWb={comparisonWb}
            onSetReferenceWb={handleSetReferenceWb}
            onSetComparisonWb={handleSetComparisonWb}
            onPreviewWb={(wb, title) =>
              setPreviewModal({ isOpen: true, workbook: wb, title })
            }
            onProceedToStep2={() => setCurrentStep(2)}
            language={language}
            onShowToast={showToast}
          />
        )}

        {/* Tab 2: Column Mapping & Decision Rules */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t.step2Title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{t.step2Desc}</p>
            </div>

            {/* Column Mapping & Normalization */}
            <ColumnMappingRules
              referenceWb={referenceWb}
              comparisonWb={comparisonWb}
              mappings={mappings}
              normalization={normalization}
              onUpdateMappings={handleUpdateMappings}
              onUpdateNormalization={handleUpdateNormalization}
              language={language}
              onShowToast={showToast}
            />

            {/* Decision Layers Builder */}
            <DecisionLayers
              referenceWb={referenceWb}
              comparisonWb={comparisonWb}
              layers={layers}
              onUpdateLayers={handleUpdateLayers}
              onExecuteMatching={handleExecuteMatching}
              isProcessing={isProcessing}
              language={language}
            />
          </div>
        )}

        {/* Tab 3: Evaluation Results Dashboard & Export */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t.step3Title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{t.step3Desc}</p>
            </div>

            {results.length > 0 && stats ? (
              <ResultsDashboard
                results={results}
                stats={stats}
                comparisonWb={comparisonWb}
                language={language}
                onShowToast={showToast}
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
                  Upload both files and execute the matching engine in Step 2 to generate
                  evaluated row results.
                </p>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Go to Step 2: Rules
                </button>
              </div>
            )}
          </div>
        )}
      </main>

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
