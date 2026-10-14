import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Link2,
  Layers,
  Save,
  Check,
  ArrowRight,
  Database,
  Sparkles,
} from 'lucide-react';
import {
  WorkbookData,
  ColumnMapping,
  NormalizationRules,
  DecisionLayer,
  Language,
} from '../types';
import { ColumnMappingRules } from './ColumnMappingRules';
import { DecisionLayers } from './DecisionLayers';
import { translations } from '../translations';

interface RulesLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceWb: WorkbookData | null;
  comparisonWb: WorkbookData | null;
  mappings: ColumnMapping[];
  normalization: NormalizationRules;
  layers: DecisionLayer[];
  onUpdateMappings: (mappings: ColumnMapping[]) => void;
  onUpdateNormalization: (norm: NormalizationRules) => void;
  onUpdateLayers: (layers: DecisionLayer[]) => void;
  onSaveSettings: () => void;
  onExecuteMatching: () => void;
  isProcessing: boolean;
  language: Language;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const RulesLogicModal: React.FC<RulesLogicModalProps> = ({
  isOpen,
  onClose,
  referenceWb,
  comparisonWb,
  mappings,
  normalization,
  layers,
  onUpdateMappings,
  onUpdateNormalization,
  onUpdateLayers,
  onSaveSettings,
  onExecuteMatching,
  isProcessing,
  language,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'mapping' | 'decision'>('mapping');
  const [justSaved, setJustSaved] = useState(false);
  const t = translations[language];

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleSaveAndApply = () => {
    onSaveSettings();
    onClose();
    onExecuteMatching();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Rules & Logic Setting
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  <Check className="w-3 h-3" />
                  Saved Once
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                Configure your key matching and evaluation logic once. Applied automatically whenever a file is imported.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-sm ${
                justSaved
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-emerald-950/50'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800/90 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'mapping'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Column Mapping & Normalization</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-900 text-emerald-400 font-bold border border-slate-700">
                {mappings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('decision')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'decision'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Decision Layers & Rules</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-900 text-amber-400 font-bold border border-slate-700">
                {layers.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:block">
            Permanent Browser Storage (IndexedDB)
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'mapping' ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              <ColumnMappingRules
                referenceWb={referenceWb}
                comparisonWb={comparisonWb}
                mappings={mappings}
                normalization={normalization}
                onUpdateMappings={onUpdateMappings}
                onUpdateNormalization={onUpdateNormalization}
                language={language}
                onShowToast={onShowToast}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-150">
              <DecisionLayers
                referenceWb={referenceWb}
                comparisonWb={comparisonWb}
                layers={layers}
                onUpdateLayers={onUpdateLayers}
                onExecuteMatching={onExecuteMatching}
                isProcessing={isProcessing}
                language={language}
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Saved settings persist across refreshes and apply automatically on file import.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Settings</span>
            </button>

            {referenceWb && comparisonWb && (
              <button
                onClick={handleSaveAndApply}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-950 transition-all hover:translate-x-0.5"
              >
                <span>{isProcessing ? 'Evaluating...' : 'Save & Show Results'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
