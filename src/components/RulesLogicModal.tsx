import React, { useState, useMemo, useEffect } from 'react';
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
  PauseCircle,
  Search,
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
import { SuggestionEnginePanel } from './SuggestionEnginePanel';
import { analyzeColumnSuggestions } from '../utils/suggestionEngine';
import { translations } from '../translations';
import type { User } from 'firebase/auth';

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
  holdColumn: string;
  holdValues: string[];
  holdReason: string;
  onHoldSettingsChange: (column: string, values: string[], reason: string) => void;
  cloudUser?: User | null;
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
  holdColumn,
  holdValues,
  holdReason,
  onHoldSettingsChange,
  cloudUser,
}) => {
  const [activeTab, setActiveTab] = useState<'mapping' | 'suggestions' | 'decision' | 'hold'>('mapping');
  const [holdValueSearch, setHoldValueSearch] = useState('');
  const [holdReasonDraft, setHoldReasonDraft] = useState(holdReason);
  const [holdLegacyDraft, setHoldLegacyDraft] = useState(holdValues.join('\n'));

  // Calculate unmapped column suggestions based on industry terminology
  const unmappedSuggestionsCount = useMemo(() => {
    if (!referenceWb || !comparisonWb) return 0;
    const analysis = analyzeColumnSuggestions(
      referenceWb.headers,
      comparisonWb.headers,
      mappings
    );
    return analysis.unmappedSuggestionsCount;
  }, [referenceWb, comparisonWb, mappings]);

  // Sync drafts whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setHoldReasonDraft(holdReason);
      setHoldLegacyDraft(holdValues.join('\n'));
      setHoldValueSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Distinct values of the chosen hold column from the Incoming workbook
  const holdDistinctValues = useMemo(() => {
    if (!comparisonWb || !holdColumn) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of comparisonWb.rows) {
      const v = String(row[holdColumn] ?? '').trim();
      if (!v || v === '-') continue;
      const k = v.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(v);
      }
    }
    return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [comparisonWb, holdColumn]);

  const updateHold = (column: string, values: string[], reason: string) => {
    onHoldSettingsChange(column, values, reason);
  };

  const toggleHoldValue = (v: string) => {
    const nv = holdValues.includes(v)
      ? holdValues.filter((x) => x !== v)
      : [...holdValues, v];
    updateHold(holdColumn, nv, holdReason);
  };

  const filteredHoldValues = useMemo(() => {
    const q = holdValueSearch.trim().toLowerCase();
    if (!q) return holdDistinctValues;
    return holdDistinctValues.filter((v) => v.toLowerCase().includes(q));
  }, [holdDistinctValues, holdValueSearch]);
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
    <div className="bulk-backdrop flex items-center justify-center p-3 sm:p-6">
      <div className="bulk-modal !max-w-5xl !w-full h-[90vh] flex flex-col overflow-hidden !p-0">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  {t.rulesModalTitle}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                  <Check className="w-3 h-3" />
                  {t.rulesSavedOnce}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 hidden sm:block">
                {t.rulesModalDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              className={`tbtn tbtn--excel !h-9 !px-3.5 cursor-pointer ${
                justSaved ? 'opacity-90' : ''
              }`}
            >
              <span className="tbtn__icon">
                {justSaved ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
              </span>
              <span>{justSaved ? t.rulesSavedShort : t.rulesSaveSettings}</span>
            </button>

            <button
              onClick={onClose}
              className="tbtn tbtn--neutral !h-9 !w-9 !p-0 justify-center"
              aria-label={t.close}
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--bg-surface-soft)] rounded-xl border border-[var(--border-light)]">
            <button
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'mapping'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.rulesTabMapping}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {mappings.length}
              </span>
            </button>

            {/* Intelligent Suggestion Engine Tab */}
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.suggestionEngineTitle || 'Suggestion Engine'}</span>
              {unmappedSuggestionsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700 animate-pulse">
                  {unmappedSuggestionsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--bg-surface-alt)] text-[var(--text-muted)]">
                  0
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('decision')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'decision'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.rulesTabDecision}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                {layers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hold')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'hold'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.rulesTabHold}</span>
              {holdValues.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-600 text-white font-bold">
                  {holdValues.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] hidden md:block font-mono">
            {t.rulesStorageNote}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[var(--bg-surface-alt)]">
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
                cloudUser={cloudUser}
              />
            </div>
          ) : activeTab === 'suggestions' ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              <SuggestionEnginePanel
                refHeaders={referenceWb?.headers || []}
                compHeaders={comparisonWb?.headers || []}
                mappings={mappings}
                onApplyAll={(newMappings) => {
                  onUpdateMappings(newMappings);
                }}
                onApplyOne={(mainCol, compCol) => {
                  const exists = mappings.some(
                    (m) =>
                      m.mainCol.toLowerCase() === mainCol.toLowerCase() &&
                      m.comparisonCol.toLowerCase() === compCol.toLowerCase()
                  );
                  if (!exists) {
                    const newMapping: ColumnMapping = {
                      id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      mainCol,
                      comparisonCol: compCol,
                    };
                    onUpdateMappings([...mappings, newMapping]);
                    onShowToast?.(`Mapped "${mainCol}" ↔ "${compCol}"`, 'success');
                  }
                }}
                language={language}
                onShowToast={onShowToast}
                isCollapsible={false}
              />
            </div>
          ) : activeTab === 'decision' ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              <DecisionLayers
                referenceWb={referenceWb}
                comparisonWb={comparisonWb}
                layers={layers}
                onUpdateLayers={onUpdateLayers}
                onExecuteMatching={onExecuteMatching}
                isProcessing={isProcessing}
                language={language}
                cloudUser={cloudUser}
              />
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Hold column picker */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">{t.rulesTabHold}</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">{t.rulesHoldColumnLabel}</label>
                  <select
                    value={holdColumn}
                    onChange={(e) => {
                      setHoldValueSearch('');
                      updateHold(e.target.value, [], holdReason);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">{t.rulesHoldColumnLegacy}</option>
                    {(comparisonWb?.headers || []).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {holdColumn ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        {t.rulesHoldValuesLabel}
                        {holdValues.length > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-600 text-white font-bold">
                            {holdValues.length}
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateHold(holdColumn, holdDistinctValues, holdReason)}
                          className="text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          {t.rulesHoldSelectAll}
                        </button>
                        <button
                          onClick={() => updateHold(holdColumn, [], holdReason)}
                          className="text-[11px] font-semibold text-slate-500 hover:underline"
                        >
                          {t.rulesHoldClearSel}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={holdValueSearch}
                        onChange={(e) => setHoldValueSearch(e.target.value)}
                        placeholder={t.rulesHoldValuesSearch}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/60 divide-y divide-slate-100">
                      {filteredHoldValues.length === 0 && (
                        <div className="px-3 py-4 text-xs text-slate-400 text-center">
                          {comparisonWb ? t.rulesHoldNoValues : t.rulesHoldNoData}
                        </div>
                      )}
                      {filteredHoldValues.map((v) => (
                        <label
                          key={v}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50/60 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={holdValues.includes(v)}
                            onChange={() => toggleHoldValue(v)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-800 font-mono truncate">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">{t.rulesHoldLegacyLabel}</label>
                    <p className="text-[11px] text-slate-500">{t.rulesHoldLegacyDesc}</p>
                    <textarea
                      value={holdLegacyDraft}
                      onChange={(e) => setHoldLegacyDraft(e.target.value)}
                      onBlur={() => {
                        const vals = holdLegacyDraft.split(/\n/).map((x) => x.trim()).filter((x) => x.length > 0);
                        updateHold('', Array.from(new Set(vals)), holdReason);
                      }}
                      rows={4}
                      placeholder={t.rulesHoldLegacyPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700">{t.dashHoldReasonLabel}</label>
                  <input
                    value={holdReasonDraft}
                    onChange={(e) => setHoldReasonDraft(e.target.value)}
                    onBlur={() => {
                      if (holdReasonDraft.trim() !== holdReason) {
                        updateHold(holdColumn, holdValues, holdReasonDraft.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    placeholder={t.dashHoldReasonPlaceholder}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{t.rulesPersistNote}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="tbtn tbtn--neutral !h-9 !px-4 cursor-pointer"
            >
              {t.close}
            </button>

            <button
              onClick={handleSave}
              className="tbtn tbtn--excel !h-9 !px-4 cursor-pointer"
            >
              <span className="tbtn__icon">
                <Save className="w-3.5 h-3.5" />
              </span>
              <span>{t.rulesSaveSettings}</span>
            </button>

            {referenceWb && comparisonWb && (
              <button
                onClick={handleSaveAndApply}
                disabled={isProcessing}
                className="tbtn tbtn--primary !h-9 !px-5 cursor-pointer disabled:opacity-50"
              >
                <span className="tbtn__icon">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span>{isProcessing ? t.rulesEvaluating : t.rulesSaveShowResults}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
