import React, { useState, useEffect } from 'react';
import {
  Link2,
  Plus,
  Wand2,
  Trash2,
  Sliders,
  Check,
  Bookmark,
  History,
  Save,
  Clock,
  Sparkles,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  WorkbookData,
  ColumnMapping,
  NormalizationRules,
  Language,
  SavedMappingPreset,
} from '../types';
import { translations } from '../translations';
import { autoMapColumns } from '../utils/excel';
import {
  getSavedMappingPresets,
  saveMappingPreset,
  deleteMappingPreset,
  getRecentMappings,
  pushRecentMapping,
} from '../utils/storage';

interface ColumnMappingRulesProps {
  referenceWb: WorkbookData | null;
  comparisonWb: WorkbookData | null;
  mappings: ColumnMapping[];
  normalization: NormalizationRules;
  onUpdateMappings: (mappings: ColumnMapping[]) => void;
  onUpdateNormalization: (norm: NormalizationRules) => void;
  language: Language;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ColumnMappingRules: React.FC<ColumnMappingRulesProps> = ({
  referenceWb,
  comparisonWb,
  mappings,
  normalization,
  onUpdateMappings,
  onUpdateNormalization,
  language,
  onShowToast,
}) => {
  const t = translations[language];

  const refHeaders = referenceWb?.headers || [];
  const compHeaders = comparisonWb?.headers || [];

  // Saved Presets & Recent History State
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedMappingPreset[]>([]);
  const [recentHistory, setRecentHistory] = useState<
    { id: string; timestamp: number; mappings: ColumnMapping[]; summary: string }[]
  >([]);
  const [presetTab, setPresetTab] = useState<'saved' | 'recent' | 'templates'>('saved');

  // Load saved presets and recent history on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        const presets = await getSavedMappingPresets();
        setSavedPresets(presets);
        setRecentHistory(getRecentMappings());
      } catch (e) {
        console.warn('Failed to load mapping presets', e);
      }
    }
    loadPresets();
  }, []);

  // Whenever mappings change and have at least 1 rule, save to auto-recent history
  useEffect(() => {
    if (mappings.length > 0) {
      pushRecentMapping(mappings, t.mapSummaryMore);
      setRecentHistory(getRecentMappings());
    }
  }, [mappings]);

  const handleAddMapping = () => {
    const newMapping: ColumnMapping = {
      id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mainCol: refHeaders[0] || '',
      comparisonCol: compHeaders[0] || '',
    };
    onUpdateMappings([...mappings, newMapping]);
  };

  const handleDeleteMapping = (id: string) => {
    onUpdateMappings(mappings.filter((m) => m.id !== id));
  };

  const handleUpdateMappingItem = (
    id: string,
    field: 'mainCol' | 'comparisonCol',
    val: string
  ) => {
    onUpdateMappings(
      mappings.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleAutoMap = () => {
    if (!referenceWb || !comparisonWb) {
      onShowToast(t.mapNeedBothFiles, 'error');
      return;
    }
    const detected = autoMapColumns(refHeaders, compHeaders);
    if (detected.length > 0) {
      onUpdateMappings(detected);
      onShowToast(`${t.toastAutoMapped} ${t.mapAutoMappedCount.replace('{count}', String(detected.length))}`, 'success');
    } else {
      onShowToast(t.mapNoMatchesFound, 'info');
    }
  };

  // Save current mappings as a named preset
  const handleSaveCurrentPreset = async () => {
    if (mappings.length === 0) {
      onShowToast(t.mapNeedMappingFirst, 'error');
      return;
    }
    const name = newPresetName.trim() || t.mapDefaultPresetName.replace('{cols}', mappings.map(m => m.mainCol).slice(0, 2).join(', '));
    const newPreset: SavedMappingPreset = {
      id: `preset_map_${Date.now()}`,
      name,
      createdAt: Date.now(),
      mappings: mappings.map((m) => ({ mainCol: m.mainCol, comparisonCol: m.comparisonCol })),
      description: t.mapPairCount.replace('{count}', String(mappings.length)),
    };

    try {
      const updated = await saveMappingPreset(newPreset);
      setSavedPresets(updated);
      setNewPresetName('');
      setShowSaveDialog(false);
      onShowToast(t.mapPresetSaved.replace('{name}', name), 'success')
    } catch {
      onShowToast(t.mapPresetSaveFailed, 'error');
    }
  };

  // Apply a mapping preset or recent history item
  const handleApplyPreset = (targetMappings: { mainCol: string; comparisonCol: string }[], name: string) => {
    if (!targetMappings || targetMappings.length === 0) return;

    const newMappings: ColumnMapping[] = targetMappings.map((m, idx) => ({
      id: `map_preset_${Date.now()}_${idx}`,
      mainCol: m.mainCol,
      comparisonCol: m.comparisonCol,
    }));

    onUpdateMappings(newMappings);
    setShowPresetsModal(false);

    // Check how many columns match current files
    const mainFound = newMappings.filter(m => refHeaders.includes(m.mainCol)).length;
    const compFound = newMappings.filter(m => compHeaders.includes(m.comparisonCol)).length;

    onShowToast(t.mapPresetApplied.replace('{name}', name).replace('{total}', String(newMappings.length)).replace('{mainFound}', String(mainFound)).replace('{compFound}', String(compFound)), 'success')
  };

  const handleDeleteSavedPreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await deleteMappingPreset(id);
      setSavedPresets(updated);
      onShowToast(t.mapPresetDeleted, 'info');
    } catch {
      onShowToast(t.mapPresetDeleteFailed, 'error');
    }
  };

  // Built-in Industry Key Templates
  const industryTemplates: { name: string; desc: string; mappings: { mainCol: string; comparisonCol: string }[] }[] = [
    {
      name: t.mapTplPoName,
      desc: t.mapTplPoDesc,
      mappings: [
        { mainCol: 'PO Number', comparisonCol: 'PO Number' },
        { mainCol: 'Part Number', comparisonCol: 'Part Number' },
      ],
    },
    {
      name: t.mapTplSerialName,
      desc: t.mapTplSerialDesc,
      mappings: [
        { mainCol: 'Part Number', comparisonCol: 'Part Number' },
        { mainCol: 'Serial Number', comparisonCol: 'Serial Number' },
      ],
    },
    {
      name: t.mapTplInvoiceName,
      desc: t.mapTplInvoiceDesc,
      mappings: [
        { mainCol: 'Invoice ID', comparisonCol: 'Invoice ID' },
        { mainCol: 'Vendor Code', comparisonCol: 'Vendor Code' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Side-by-Side Column Mapping Interface */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">{t.columnMappings}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.columnMappingsDesc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Recent & Saved Mapping Presets Button */}
            <button
              onClick={() => setShowPresetsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-lg transition-colors select-none shadow-xs"
              title={t.mapPresetsBtnTitle}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.mapSavedRecentKeys}</span>
              {savedPresets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-200 text-amber-800 font-bold">
                  {savedPresets.length}
                </span>
              )}
            </button>

            {/* Save Current Preset Button */}
            {mappings.length > 0 && (
              <button
                onClick={() => {
                  setNewPresetName('');
                  setShowSaveDialog(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors select-none shadow-xs"
                title={t.mapSaveKeysBtnTitle}
              >
                <Save className="w-3.5 h-3.5 text-brand-600" />
                <span>{t.mapSaveKeys}</span>
              </button>
            )}

            <button
              onClick={handleAutoMap}
              disabled={!referenceWb || !comparisonWb}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100/80 border border-brand-200 rounded-lg transition-colors disabled:opacity-40 shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{t.autoMap}</span>
            </button>
            <button
              onClick={handleAddMapping}
              disabled={refHeaders.length === 0 || compHeaders.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-40 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addMapping}</span>
            </button>
          </div>
        </div>

        {/* Quick Recent Keys Recall Ribbon if history exists */}
        {recentHistory.length > 0 && (
          <div className="mt-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 truncate">
              <History className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-semibold text-slate-700 shrink-0">{t.mapRecentKeys}</span>
              <span className="text-slate-600 font-mono text-[11px] truncate">
                {recentHistory[0].summary}
              </span>
            </div>
            <button
              onClick={() => handleApplyPreset(recentHistory[0].mappings, t.mapRecentMappingName)}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
            >
              {t.mapRestoreLastUsed}
            </button>
          </div>
        )}

        {/* Mapping Rows */}
        <div className="mt-4 space-y-3">
          {mappings.length > 0 ? (
            mappings.map((mapping, idx) => (
              <div
                key={mapping.id}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                  {idx + 1}.
                </div>

                {/* Left: Main Reference Column */}
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.mainColumn}
                  </label>
                  <select
                    value={mapping.mainCol}
                    onChange={(e) =>
                      handleUpdateMappingItem(mapping.id, 'mainCol', e.target.value)
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 font-mono shadow-xs"
                  >
                    {refHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Equal / Match Icon */}
                <div className="flex flex-col items-center justify-center pt-5 text-slate-400 font-bold">
                  <span className="text-xs font-mono">⟷</span>
                </div>

                {/* Right: Comparison Column */}
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.compColumn}
                  </label>
                  <select
                    value={mapping.comparisonCol}
                    onChange={(e) =>
                      handleUpdateMappingItem(mapping.id, 'comparisonCol', e.target.value)
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
                  >
                    {compHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delete Button */}
                <div className="pt-5">
                  <button
                    onClick={() => handleDeleteMapping(mapping.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    aria-label={t.mapDeleteMappingAria}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {t.noMappingsYet}
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Normalization Toggles */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <Sliders className="w-5 h-5 text-sky-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.normalizationOptions}</h3>
            <p className="text-xs text-slate-500">{t.mapNormSectionDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Toggle 1: Trim edge spaces */}
          <div
            onClick={() =>
              onUpdateNormalization({
                ...normalization,
                trimSpaces: !normalization.trimSpaces,
              })
            }
            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              normalization.trimSpaces
                ? 'bg-brand-50/60 border-brand-300 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-800">{t.trimSpaces}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.trimSpacesDesc}</div>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                normalization.trimSpaces
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white'
              }`}
            >
              {normalization.trimSpaces && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Toggle 2: Ignore letter case */}
          <div
            onClick={() =>
              onUpdateNormalization({
                ...normalization,
                ignoreCase: !normalization.ignoreCase,
              })
            }
            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              normalization.ignoreCase
                ? 'bg-brand-50/60 border-brand-300 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-800">{t.ignoreCase}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.ignoreCaseDesc}</div>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                normalization.ignoreCase
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white'
              }`}
            >
              {normalization.ignoreCase && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Toggle 3: Remove spaces and hyphens */}
          <div
            onClick={() =>
              onUpdateNormalization({
                ...normalization,
                removeSpacesAndHyphens: !normalization.removeSpacesAndHyphens,
              })
            }
            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              normalization.removeSpacesAndHyphens
                ? 'bg-brand-50/60 border-brand-300 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-800">{t.removeHyphens}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.removeHyphensDesc}</div>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                normalization.removeSpacesAndHyphens
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white'
              }`}
            >
              {normalization.removeSpacesAndHyphens && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Toggle 4: Ignore leading zeros */}
          <div
            onClick={() =>
              onUpdateNormalization({
                ...normalization,
                ignoreLeadingZeros: !normalization.ignoreLeadingZeros,
              })
            }
            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              normalization.ignoreLeadingZeros
                ? 'bg-brand-50/60 border-brand-300 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-800">{t.ignoreLeadingZeros}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.ignoreLeadingZerosDesc}</div>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                normalization.ignoreLeadingZeros
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white'
              }`}
            >
              {normalization.ignoreLeadingZeros && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Toggle 5: Trim edge punctuation */}
          <div
            onClick={() =>
              onUpdateNormalization({
                ...normalization,
                trimPunctuation: !(normalization.trimPunctuation !== false),
              })
            }
            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
              normalization.trimPunctuation !== false
                ? 'bg-brand-50/60 border-brand-300 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-800">{t.trimPunctuation}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.trimPunctuationDesc}</div>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                normalization.trimPunctuation !== false
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white'
              }`}
            >
              {normalization.trimPunctuation !== false && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      </div>

      {/* Save Preset Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand-600" />
                <h4 className="text-sm font-bold text-slate-900">{t.mapSaveDialogTitle}</h4>
              </div>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.mapPresetNameLabel}
              </label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={t.mapPresetNamePh}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 font-medium"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                {t.mapWillSavePairs.replace('{count}', String(mappings.length))}:{' '}
                <span className="font-mono text-slate-700 font-semibold">
                  {mappings.map(m => `${m.mainCol} ↔ ${m.comparisonCol}`).join(', ')}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveCurrentPreset}
                className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm"
              >
                {t.mapSavePreset}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved & Recent Column Mapping Keys Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
                  <Bookmark className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Saved & Recent Column Mapping Keys
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quickly restore previously used column key pairs or standard templates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-slate-200">
              <button
                onClick={() => setPresetTab('saved')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  presetTab === 'saved'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Presets ({savedPresets.length})</span>
              </button>
              <button
                onClick={() => setPresetTab('recent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  presetTab === 'recent'
                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Recent History ({recentHistory.length})</span>
              </button>
              <button
                onClick={() => setPresetTab('templates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  presetTab === 'templates'
                    ? 'bg-brand-50 text-brand-800 border border-brand-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Industry Templates ({industryTemplates.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
              {/* 1. Saved Presets */}
              {presetTab === 'saved' && (
                <div className="space-y-2.5">
                  {savedPresets.length > 0 ? (
                    savedPresets.map((preset) => {
                      const matchedCount = preset.mappings.filter(
                        (m) => refHeaders.includes(m.mainCol) && compHeaders.includes(m.comparisonCol)
                      ).length;

                      return (
                        <div
                          key={preset.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {preset.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                {preset.mappings.length} column{preset.mappings.length > 1 ? 's' : ''}
                              </span>
                              {matchedCount === preset.mappings.length && preset.mappings.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-brand-50 text-brand-700 border border-brand-200 font-bold">
                                  100% in files
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-600 truncate">
                              {preset.mappings.map(m => `${m.mainCol} ↔ ${m.comparisonCol}`).join(' · ')}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Saved {new Date(preset.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              onClick={(e) => handleDeleteSavedPreset(preset.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={t.mapDeletePresetTitle}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApplyPreset(preset.mappings, preset.name)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs transition-colors"
                            >
                              Apply Preset
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center space-y-2">
                      <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-600 font-medium">No custom presets saved yet.</p>
                      <p className="text-[11px] text-slate-500">
                        Configure your columns above and click "Save Keys" to store them here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Recent History */}
              {presetTab === 'recent' && (
                <div className="space-y-2.5">
                  {recentHistory.length > 0 ? (
                    recentHistory.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Recent Session #{idx + 1}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                              Auto-Saved
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 truncate">
                            {item.summary}
                          </div>
                        </div>

                        <button
                          onClick={() => handleApplyPreset(item.mappings, `Recent Session #${idx + 1}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors shrink-0 self-end sm:self-auto"
                        >
                          {t.mapRestore}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-500">
                      {t.mapNoHistory}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Industry Templates */}
              {presetTab === 'templates' && (
                <div className="space-y-2.5">
                  {industryTemplates.map((template) => (
                    <div
                      key={template.name}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900">{template.name}</div>
                        <div className="text-[11px] text-slate-500">{template.desc}</div>
                        <div className="text-[11px] font-mono text-brand-700 font-semibold truncate">
                          {template.mappings.map(m => `${m.mainCol} ↔ ${m.comparisonCol}`).join(' · ')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyPreset(template.mappings, template.name)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-xs transition-colors shrink-0 self-end sm:self-auto"
                      >
                        {t.mapUseTemplate}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>{t.mapPresetsStoredNote}</span>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-xs"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
