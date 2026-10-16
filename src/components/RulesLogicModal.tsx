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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Rules & Logic Setting
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  <Check className="w-3 h-3" />
                  Saved Once
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Configure your key matching and evaluation logic once. Applied automatically whenever a file is imported.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-xs ${
                justSaved
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
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
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'mapping'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Column Mapping & Normalization</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {mappings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('decision')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'decision'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Decision Layers & Rules</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-50 text-amber-700 font-bold border border-amber-200">
                {layers.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:block">
            Permanent Browser Storage (IndexedDB)
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/60">
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
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Saved settings persist across refreshes and apply automatically on file import.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span>Save Settings</span>
            </button>

            {referenceWb && comparisonWb && (
              <button
                onClick={handleSaveAndApply}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all hover:translate-x-0.5"
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
