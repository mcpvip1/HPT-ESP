import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Play,
  Bookmark,
  History,
  Save,
  Clock,
  Sparkles,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  WorkbookData,
  DecisionLayer,
  ValueRule,
  RuleCondition,
  ResultColor,
  Language,
  SavedDecisionPreset,
} from '../types';
import { translations } from '../translations';
import {
  getSavedDecisionPresets,
  saveDecisionPreset,
  deleteDecisionPreset,
  getRecentDecisionLayers,
  pushRecentDecisionLayers,
} from '../utils/storage';

interface DecisionLayersProps {
  referenceWb: WorkbookData | null;
  comparisonWb: WorkbookData | null;
  layers: DecisionLayer[];
  onUpdateLayers: (layers: DecisionLayer[]) => void;
  onExecuteMatching: () => void;
  isProcessing: boolean;
  language: Language;
}

export const DecisionLayers: React.FC<DecisionLayersProps> = ({
  referenceWb,
  comparisonWb,
  layers,
  onUpdateLayers,
  onExecuteMatching,
  isProcessing,
  language,
}) => {
  const t = translations[language];

  // Presets & Recent History State
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedDecisionPreset[]>([]);
  const [recentHistory, setRecentHistory] = useState<
    { id: string; timestamp: number; layers: DecisionLayer[]; summary: string }[]
  >([]);
  const [presetTab, setPresetTab] = useState<'saved' | 'recent' | 'templates'>('saved');

  // Load saved presets on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        const presets = await getSavedDecisionPresets();
        setSavedPresets(presets);
        setRecentHistory(getRecentDecisionLayers());
      } catch (e) {
        console.warn('Failed to load decision presets', e);
      }
    }
    loadPresets();
  }, []);

  // Auto-record to recent history whenever layers change
  useEffect(() => {
    if (layers.length > 0) {
      pushRecentDecisionLayers(layers);
      setRecentHistory(getRecentDecisionLayers());
    }
  }, [layers]);

  // Compute available columns based on layer source
  const getColumnsForSource = (source: 'main' | 'comparison' | 'merged'): string[] => {
    const mainCols = referenceWb?.headers || [];
    const compCols = comparisonWb?.headers || [];

    if (source === 'main') return mainCols;
    if (source === 'comparison') return compCols;

    // Merged: comp headers + ref headers
    const set = new Set<string>([...compCols, ...mainCols]);
    return Array.from(set);
  };

  const isColumnInSource = (colName: string, source: 'main' | 'comparison' | 'merged'): boolean => {
    if (!colName) return false;
    const available = getColumnsForSource(source);
    return available.includes(colName);
  };

  const handleAddLayer = () => {
    const defaultCols = getColumnsForSource('merged');
    const newLayer: DecisionLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: t.layerDefaultName.replace('{n}', String(layers.length + 1)),
      source: 'merged',
      primaryColumn: defaultCols[0] || '',
      rules: [
        {
          id: `r_${Date.now()}_1`,
          condition: 'contains',
          value: 'Accept',
          color: 'green',
          label: t.layerRuleAccepted,
        },
        {
          id: `r_${Date.now()}_2`,
          condition: 'contains',
          value: 'Review',
          color: 'yellow',
          label: t.layerRuleReview,
        },
        {
          id: `r_${Date.now()}_3`,
          condition: 'contains',
          value: 'Reject',
          color: 'red',
          label: t.layerRuleRejected,
        },
      ],
      fallbackToOriginalFill: false,
      fallbackColor: 'none',
    };
    onUpdateLayers([...layers, newLayer]);
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;
    const reordered = [...layers];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    onUpdateLayers(reordered);
  };

  const handleDeleteLayer = (layerId: string) => {
    onUpdateLayers(layers.filter((l) => l.id !== layerId));
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<DecisionLayer>) => {
    onUpdateLayers(
      layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l))
    );
  };

  const handleAddRule = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newRule: ValueRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      condition: 'contains',
      value: '',
      color: 'green',
      label: t.layerRuleDefinition,
    };

    handleUpdateLayer(layerId, {
      rules: [...layer.rules, newRule],
    });
  };

  const handleUpdateRule = (
    layerId: string,
    ruleId: string,
    updates: Partial<ValueRule>
  ) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const updatedRules = layer.rules.map((r) =>
      r.id === ruleId ? { ...r, ...updates } : r
    );

    handleUpdateLayer(layerId, { rules: updatedRules });
  };

  const handleDeleteRule = (layerId: string, ruleId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    handleUpdateLayer(layerId, {
      rules: layer.rules.filter((r) => r.id !== ruleId),
    });
  };

  const handleApplyInspectionPreset = () => {
    const available = getColumnsForSource('merged');
    const findCol = (pattern: RegExp, fallback: string) =>
      available.find((c) => pattern.test(c)) || fallback;

    const pri = findCol(/status/i, available[0] || 'Inspection Status');
    const sec = findCol(/result/i, available[1] || 'Inspection Result');

    const presetLayer: DecisionLayer = {
      id: `layer_preset_${Date.now()}`,
      name: t.layerInspectionPresetName,
      source: 'merged',
      primaryColumn: pri,
      secondaryColumn: sec,
      matchLogic: 'or',
      rules: [
        {
          id: `r_waive_${Date.now()}`,
          targetColumn: 'primary',
          condition: 'contains',
          value: 'Waive',
          color: 'green',
          label: t.layerRuleContains.replace('{col}', pri).replace('{val}', 'Waive'),
        },
        {
          id: `r_accept_${Date.now()}`,
          targetColumn: 'secondary',
          condition: 'contains',
          value: 'Accept',
          color: 'green',
          label: t.layerRuleContains.replace('{col}', sec).replace('{val}', 'Accept'),
        },
        {
          id: `r_any_waive_${Date.now()}`,
          targetColumn: 'any',
          condition: 'contains',
          value: 'Waive',
          color: 'green',
          label: t.layerRuleEitherContains.replace('{val}', 'Waive'),
        },
        {
          id: `r_any_accept_${Date.now()}`,
          targetColumn: 'any',
          condition: 'contains',
          value: 'Accept',
          color: 'green',
          label: t.layerRuleEitherContains.replace('{val}', 'Accept'),
        },
      ],
      fallbackToOriginalFill: false,
      fallbackColor: 'yellow',
    };

    onUpdateLayers([presetLayer]);
  };

  // Save current layers as preset
  const handleSaveCurrentPreset = async () => {
    if (layers.length === 0) return;
    const name = newPresetName.trim() || t.layerDefaultPresetName.replace('{name}', layers[0].name);
    const preset: SavedDecisionPreset = {
      id: `preset_dec_${Date.now()}`,
      name,
      createdAt: Date.now(),
      layers: JSON.parse(JSON.stringify(layers)),
      description: t.layerPresetDesc.replace('{layers}', String(layers.length)).replace('{rules}', String(layers.reduce((sum, l) => sum + l.rules.length, 0))),
    };

    try {
      const updated = await saveDecisionPreset(preset);
      setSavedPresets(updated);
      setNewPresetName('');
      setShowSaveDialog(false);
    } catch (e) {
      console.warn('Failed to save decision preset', e);
    }
  };

  const handleApplyPreset = (targetLayers: DecisionLayer[]) => {
    if (!targetLayers || targetLayers.length === 0) return;
    onUpdateLayers(JSON.parse(JSON.stringify(targetLayers)));
    setShowPresetsModal(false);
  };

  const handleDeleteSavedPreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await deleteDecisionPreset(id);
      setSavedPresets(updated);
    } catch {}
  };

  // Built-in Industry Decision Templates
  const industryDecisionTemplates: { name: string; desc: string; layers: DecisionLayer[] }[] = [
    {
      name: t.layerInspectionPresetName,
      desc: t.layerTplInspectionDesc,
      layers: [
        {
          id: `tpl_waive_accept_${Date.now()}`,
          name: t.layerInspectionPresetName,
          source: 'merged',
          primaryColumn: 'Inspection Status',
          secondaryColumn: 'Inspection Result',
          matchLogic: 'or',
          rules: [
            {
              id: 'tpl_r_waive',
              targetColumn: 'primary',
              condition: 'contains',
              value: 'Waive',
              color: 'green',
              label: t.layerRuleContains.replace('{col}', 'Inspection Status').replace('{val}', 'Waive'),
            },
            {
              id: 'tpl_r_accept',
              targetColumn: 'secondary',
              condition: 'contains',
              value: 'Accept',
              color: 'green',
              label: t.layerRuleContains.replace('{col}', 'Inspection Result').replace('{val}', 'Accept'),
            },
            {
              id: 'tpl_r_any_w',
              targetColumn: 'any',
              condition: 'contains',
              value: 'Waive',
              color: 'green',
              label: t.layerRuleEitherContains.replace('{val}', 'Waive'),
            },
            {
              id: 'tpl_r_any_a',
              targetColumn: 'any',
              condition: 'contains',
              value: 'Accept',
              color: 'green',
              label: t.layerRuleEitherContains.replace('{val}', 'Accept'),
            },
          ],
          fallbackToOriginalFill: false,
          fallbackColor: 'yellow',
        },
      ],
    },
    {
      name: t.layerTplQaName,
      desc: t.layerTplQaDesc,
      layers: [
        {
          id: `tpl_3tier_${Date.now()}`,
          name: t.layerTplQaLayerName,
          source: 'merged',
          primaryColumn: 'Inspection Result',
          rules: [
            { id: 'r_acc', condition: 'contains', value: 'Accept', color: 'green', label: t.layerTplAcceptedPass },
            { id: 'r_rev', condition: 'contains', value: 'Review', color: 'yellow', label: t.layerTplNeedsReview },
            { id: 'r_rej', condition: 'contains', value: 'Reject', color: 'red', label: t.layerRuleRejected },
          ],
          fallbackToOriginalFill: false,
          fallbackColor: 'yellow',
        },
      ],
    },
    {
      name: t.layerTplStrictName,
      desc: t.layerTplStrictDesc,
      layers: [
        {
          id: `tpl_strict_${Date.now()}`,
          name: t.layerTplStrictLayerName,
          source: 'merged',
          primaryColumn: 'Inspection Status',
          rules: [
            { id: 'r_pass', condition: 'contains', value: 'Pass', color: 'green', label: t.layerTplPassed },
            { id: 'r_app', condition: 'contains', value: 'Approved', color: 'green', label: t.layerTplApproved },
          ],
          fallbackToOriginalFill: false,
          fallbackColor: 'red',
        },
      ],
    },
  ];

  const conditionLabels: Record<RuleCondition, string> = {
    contains: t.conditionContains,
    equals: t.conditionEquals,
    starts_with: t.conditionStartsWith,
    ends_with: t.conditionEndsWith,
    is_empty: t.conditionIsEmpty,
    is_not_empty: t.conditionIsNotEmpty,
    greater_than: t.conditionGreaterThan,
    less_than: t.conditionLessThan,
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{t.decisionLayers}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t.decisionLayersDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Saved & Recent Rule Presets Button */}
          <button
            onClick={() => setShowPresetsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-lg transition-colors select-none shadow-xs"
            title={t.layerPresetsBtnTitle}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.layerSavedRecentRules}</span>
            {savedPresets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-200 text-amber-800 font-bold">
                {savedPresets.length}
              </span>
            )}
          </button>

          {/* Save Current Rules Button */}
          {layers.length > 0 && (
            <button
              onClick={() => {
                setNewPresetName('');
                setShowSaveDialog(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors select-none shadow-xs"
              title={t.layerSaveRulesBtnTitle}
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.layerSaveRules}</span>
            </button>
          )}

          <button
            onClick={handleAddLayer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addLayer}</span>
          </button>
        </div>
      </div>

      {/* Quick Inspection Decision Preset Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-amber-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t.layerActiveRuleTitle}
          </div>
          <p className="text-[11px] text-slate-600">
            {t.layerActiveRuleDesc1.replace('{col}', 'Inspection Status').replace('{val}', '"Waive"')}{' '}
            {t.layerActiveRuleDesc2.replace('{col}', 'Inspection Result').replace('{val}', '"Accept"')}{' '}
            {t.layerActiveRuleDesc3}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApplyInspectionPreset}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs"
          >
            {t.layerResetStandardRule}
          </button>
        </div>
      </div>

      {/* Layer Cards */}
      <div className="space-y-6">
        {layers.map((layer, lIdx) => {
          const availableCols = getColumnsForSource(layer.source);
          const isPrimaryReady = isColumnInSource(layer.primaryColumn, layer.source);
          const isSecondaryReady = layer.secondaryColumn
            ? isColumnInSource(layer.secondaryColumn, layer.source)
            : true;

          return (
            <div
              key={layer.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 relative"
            >
              {/* Layer Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-mono font-bold text-slate-700 border border-slate-200">
                    {lIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, { name: e.target.value })
                    }
                    className="bg-transparent font-bold text-sm text-slate-900 hover:bg-slate-50 focus:bg-white px-2 py-1 rounded border border-transparent focus:border-slate-300 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMoveLayer(lIdx, 'up')}
                    disabled={lIdx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                    title={t.layerMoveUpTitle}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveLayer(lIdx, 'down')}
                    disabled={lIdx === layers.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                    title={t.layerMoveDownTitle}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors ml-2"
                    title={t.layerDeleteLayerTitle}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Source & Target Column Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                {/* Column 1: Primary Target Column */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.layerPrimaryColumn}
                  </label>
                  <select
                    value={layer.primaryColumn}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, { primaryColumn: e.target.value })
                    }
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono shadow-xs ${
                      !isPrimaryReady ? 'border-amber-500 text-amber-800' : 'border-slate-200'
                    }`}
                  >
                    {availableCols.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column 2: Secondary Evaluation Column */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.layerSecondaryColumn}
                  </label>
                  <select
                    value={layer.secondaryColumn || ''}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, {
                        secondaryColumn: e.target.value || undefined,
                      })
                    }
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono shadow-xs ${
                      !isSecondaryReady ? 'border-amber-500 text-amber-800' : 'border-slate-200'
                    }`}
                  >
                    <option value="">{t.layerNoSecondary}</option>
                    {availableCols.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column 3: Multi-column logic */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t.layerComboLogic}
                  </label>
                  <select
                    value={layer.matchLogic || 'or'}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, {
                        matchLogic: e.target.value as 'and' | 'or',
                      })
                    }
                    disabled={!layer.secondaryColumn}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-40 font-mono shadow-xs"
                  >
                    <option value="or">{t.layerLogicOr}</option>
                    <option value="and">{t.layerLogicAnd}</option>
                  </select>
                </div>
              </div>

              {/* Value Rules List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {t.layerValueRules.replace('{count}', String(layer.rules.length))}
                  </span>
                  <button
                    onClick={() => handleAddRule(layer.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.addRule}</span>
                  </button>
                </div>

                {layer.rules.map((rule, rIdx) => (
                  <div
                    key={rule.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300"
                  >
                    {/* Index */}
                    <div className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                      {rIdx + 1}.
                    </div>

                    {/* Column Target (if multi-column) */}
                    {layer.secondaryColumn && (
                      <select
                        value={rule.targetColumn || 'any'}
                        onChange={(e) =>
                          handleUpdateRule(layer.id, rule.id, {
                            targetColumn: e.target.value as any,
                          })
                        }
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none shadow-xs"
                      >
                        <option value="any">{t.layerTargetAny}</option>
                        <option value="primary">{t.layerTargetPrimary}</option>
                        <option value="secondary">{t.layerTargetSecondary}</option>
                      </select>
                    )}

                    {/* Condition */}
                    <select
                      value={rule.condition}
                      onChange={(e) =>
                        handleUpdateRule(layer.id, rule.id, {
                          condition: e.target.value as RuleCondition,
                        })
                      }
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none shadow-xs"
                    >
                      {Object.entries(conditionLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>

                    {/* Value */}
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) =>
                        handleUpdateRule(layer.id, rule.id, {
                          value: e.target.value,
                        })
                      }
                      placeholder={t.layerValuePlaceholder}
                      className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono shadow-xs"
                    />

                    {/* Color Output */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={rule.color}
                        onChange={(e) =>
                          handleUpdateRule(layer.id, rule.id, {
                            color: e.target.value as ResultColor,
                          })
                        }
                        className={`border rounded px-2.5 py-1 text-xs font-bold focus:outline-none shadow-xs ${
                          rule.color === 'green'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : rule.color === 'yellow'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-rose-600 text-white border-rose-600'
                        }`}
                      >
                        <option value="green" className="bg-white text-emerald-700">{t.layerColorGreen}</option>
                        <option value="yellow" className="bg-white text-amber-700">{t.layerColorYellow}</option>
                        <option value="red" className="bg-white text-rose-700">{t.layerColorRed}</option>
                      </select>
                    </div>

                    {/* Delete Rule */}
                    <button
                      onClick={() => handleDeleteRule(layer.id, rule.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 self-end sm:self-auto"
                      title={t.layerDeleteRuleTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Fallback Behavior */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`fallback_${layer.id}`}
                    checked={layer.fallbackToOriginalFill}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, {
                        fallbackToOriginalFill: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor={`fallback_${layer.id}`} className="cursor-pointer text-slate-700 font-medium">
                    {t.layerUseOriginalFill}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{t.layerIfNoRuleMatch}</span>
                  <select
                    value={layer.fallbackColor || 'none'}
                    onChange={(e) =>
                      handleUpdateLayer(layer.id, {
                        fallbackColor: e.target.value as any,
                      })
                    }
                    className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 focus:outline-none shadow-xs"
                  >
                    <option value="none">{t.layerFallbackNone}</option>
                    <option value="yellow">{t.layerFallbackYellow}</option>
                    <option value="red">{t.layerFallbackRed}</option>
                    <option value="green">{t.layerFallbackGreen}</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Execution Button */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>{t.layerHierarchyHint}</span>
        </div>

        <button
          onClick={onExecuteMatching}
          disabled={isProcessing || !referenceWb || !comparisonWb}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all hover:scale-[1.01]"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isProcessing ? t.matchingInProgress : t.runMatching}</span>
        </button>
      </div>

      {/* Save Preset Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">{t.layerSaveDialogTitle}</h4>
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
                {t.layerPresetNameLabel}
              </label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={t.layerPresetNamePh}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                {t.layerWillSave.replace('{layers}', String(layers.length)).replace('{rules}', String(layers.reduce((acc, l) => acc + l.rules.length, 0)))}
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
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm"
              >
                {t.layerSavePreset}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved & Recent Decision Layers Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
                  <Bookmark className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t.layerPresetsModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.layerPresetsModalDesc}
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
                <span>{t.layerTabSaved.replace('{count}', String(savedPresets.length))}</span>
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
                <span>{t.layerTabRecent.replace('{count}', String(recentHistory.length))}</span>
              </button>
              <button
                onClick={() => setPresetTab('templates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  presetTab === 'templates'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.layerTabStandard.replace('{count}', String(industryDecisionTemplates.length))}</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
              {/* 1. Saved Presets */}
              {presetTab === 'saved' && (
                <div className="space-y-2.5">
                  {savedPresets.length > 0 ? (
                    savedPresets.map((preset) => (
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
                              {t.layerCountBadge.replace('{count}', String(preset.layers.length))}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate font-mono">
                            {preset.layers.map((l) => `${l.name} (${l.primaryColumn})`).join(' → ')}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{t.layerSavedOn.replace('{date}', new Date(preset.createdAt).toLocaleDateString())}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={(e) => handleDeleteSavedPreset(preset.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t.layerDeletePresetTitle}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApplyPreset(preset.layers)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs transition-colors"
                          >
                            {t.layerApplyRules}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center space-y-2">
                      <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-600 font-medium">{t.layerNoPresets}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.layerNoPresetsHint}
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
                              {t.layerRecentState.replace('{n}', String(idx + 1))}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                              {t.layerAutoSaved}
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
                          onClick={() => handleApplyPreset(item.layers)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors shrink-0 self-end sm:self-auto"
                        >
                          {t.mapRestore}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-500">
                      {t.layerNoHistory}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Standard Industry Rule Templates */}
              {presetTab === 'templates' && (
                <div className="space-y-2.5">
                  {industryDecisionTemplates.map((template) => (
                    <div
                      key={template.name}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-emerald-800">{template.name}</div>
                        <div className="text-[11px] text-slate-600">{template.desc}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {t.layerTemplateMeta.replace('{layers}', String(template.layers.length)).replace('{rules}', String(template.layers[0]?.rules.length ?? 0))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyPreset(template.layers)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors shrink-0 self-end sm:self-auto"
                      >
                        {t.layerApplyRule}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>{t.layerFooterNote}</span>
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
