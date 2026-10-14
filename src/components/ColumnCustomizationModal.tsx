import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  RotateCcw,
  SlidersHorizontal,
  Table,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  Database,
  Layers,
  Check,
  ChevronUp,
  ChevronDown,
  Save,
  ArrowUpDown,
} from 'lucide-react';
import { ColumnConfigItem } from '../types';

interface ColumnCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnConfigs: ColumnConfigItem[];
  onChangeConfigs: (newConfigs: ColumnConfigItem[]) => void;
  onSaveConfigs?: (newConfigs: ColumnConfigItem[]) => void;
  syncExportWithTable: boolean;
  onToggleSync: (sync: boolean) => void;
  onResetDefaults: () => void;
}

export const ColumnCustomizationModal: React.FC<ColumnCustomizationModalProps> = ({
  isOpen,
  onClose,
  columnConfigs = [],
  onChangeConfigs,
  onSaveConfigs,
  syncExportWithTable,
  onToggleSync,
  onResetDefaults,
}) => {
  const [modalSearch, setModalSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'all' | 'data' | 'reference' | 'system'
  >('all');

  // Safe configs array guaranteed to never be null/undefined
  const safeConfigs: ColumnConfigItem[] = useMemo(
    () => (Array.isArray(columnConfigs) ? columnConfigs : []),
    [columnConfigs]
  );

  const filteredConfigs = useMemo(() => {
    if (!isOpen) return [];
    const q = modalSearch.trim().toLowerCase();
    return safeConfigs.filter((c) => {
      if (!c) return false;
      const labelStr = String(c.label ?? '').toLowerCase();
      const idStr = String(c.id ?? '').toLowerCase();
      const catStr = String(c.category ?? '').toLowerCase();

      // Category tab filter
      if (activeCategoryFilter !== 'all' && c.category !== activeCategoryFilter) {
        return false;
      }

      if (!q) return true;
      return labelStr.includes(q) || idStr.includes(q) || catStr.includes(q);
    });
  }, [safeConfigs, modalSearch, activeCategoryFilter, isOpen]);

  if (!isOpen) return null;

  const tableVisibleCount = safeConfigs.filter((c) => c?.showInTable).length;
  const exportVisibleCount = safeConfigs.filter((c) => c?.showInExport).length;

  const handleToggleTable = (id: string) => {
    const next = safeConfigs.map((c) => {
      if (c.id === id) {
        const newTable = !c.showInTable;
        return {
          ...c,
          showInTable: newTable,
          showInExport: syncExportWithTable ? newTable : c.showInExport,
        };
      }
      return c;
    });
    onChangeConfigs(next);
  };

  const handleToggleExport = (id: string) => {
    const next = safeConfigs.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          showInExport: !c.showInExport,
        };
      }
      return c;
    });
    onChangeConfigs(next);
  };

  const handleMoveUp = (id: string) => {
    const idx = safeConfigs.findIndex((c) => c.id === id);
    if (idx <= 0) return;
    const next = [...safeConfigs];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    onChangeConfigs(next);
  };

  const handleMoveDown = (id: string) => {
    const idx = safeConfigs.findIndex((c) => c.id === id);
    if (idx === -1 || idx >= safeConfigs.length - 1) return;
    const next = [...safeConfigs];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    onChangeConfigs(next);
  };

  const handleSetAllTable = (value: boolean) => {
    const next = safeConfigs.map((c) => ({
      ...c,
      showInTable: value,
      showInExport: syncExportWithTable ? value : c.showInExport,
    }));
    onChangeConfigs(next);
  };

  const handleSetAllExport = (value: boolean) => {
    const next = safeConfigs.map((c) => ({
      ...c,
      showInExport: value,
    }));
    onChangeConfigs(next);
  };

  const handleSelectDecisionOnly = () => {
    const next = safeConfigs.map((c) => {
      const isSystem = c.category === 'system';
      const labelLower = String(c.label ?? '').toLowerCase();
      const isInspection =
        labelLower.includes('inspect') ||
        labelLower.includes('status') ||
        labelLower.includes('result') ||
        labelLower.includes('waive') ||
        labelLower.includes('accept') ||
        labelLower.includes('order') ||
        labelLower.includes('po');
      const shouldShow = isSystem || isInspection;
      return {
        ...c,
        showInTable: shouldShow,
        showInExport: shouldShow,
      };
    });
    onChangeConfigs(next);
  };

  const handleSaveAndClose = () => {
    if (onSaveConfigs) {
      onSaveConfigs(safeConfigs);
    } else {
      onChangeConfigs(safeConfigs);
    }
    onClose();
  };

  const renderColumnItem = (col: ColumnConfigItem) => {
    const fullIndex = safeConfigs.findIndex((c) => c.id === col.id);
    const labelStr = String(col.label ?? '').toLowerCase();
    const isInspectionCol =
      labelStr.includes('inspect') ||
      labelStr.includes('waive') ||
      labelStr.includes('accept') ||
      labelStr.includes('status') ||
      labelStr.includes('result');

    return (
      <div
        key={col.id}
        className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-800"
      >
        {/* Reorder Buttons & Column Name */}
        <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
          {/* Move Up / Down Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleMoveUp(col.id)}
              disabled={fullIndex <= 0}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
              title="Move column earlier / left"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMoveDown(col.id)}
              disabled={fullIndex >= safeConfigs.length - 1}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
              title="Move column later / right"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Position index badge */}
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
            #{fullIndex + 1}
          </span>

          {/* Label */}
          <span
            className="text-xs font-mono text-slate-200 truncate"
            title={String(col.label)}
          >
            {String(col.label)}
          </span>

          {/* Category Tag */}
          {col.category === 'system' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 shrink-0">
              Audit
            </span>
          )}
          {col.category === 'reference' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-950/80 text-purple-300 border border-purple-900/60 shrink-0">
              Ref
            </span>
          )}
          {isInspectionCol && col.category === 'data' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-950/80 text-amber-300 border border-amber-900/60 shrink-0">
              Key Rule
            </span>
          )}
        </div>

        {/* Table View Checkbox */}
        <div className="col-span-3 sm:col-span-2 flex justify-center">
          <button
            onClick={() => handleToggleTable(col.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              col.showInTable
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-sm'
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            {col.showInTable ? (
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden sm:inline">Show</span>
          </button>
        </div>

        {/* Export Checkbox */}
        <div className="col-span-3 flex justify-center">
          <button
            onClick={() => handleToggleExport(col.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              col.showInExport
                ? 'bg-sky-950/80 text-sky-300 border border-sky-700/80 shadow-sm'
                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
            }`}
          >
            {col.showInExport ? (
              <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Column View Settings</span>
                <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Move & Visibility
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reorder columns with ↑ / ↓ arrows and toggle visibility for Results Table and Export.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Quick Presets Bar */}
        <div className="p-3.5 sm:px-5 bg-slate-950/60 border-b border-slate-800/80 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Filter Inside Modal */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search column names..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              {modalSearch && (
                <button
                  onClick={() => setModalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Clear column search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mirror / Sync Toggle */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors shrink-0 select-none">
              <input
                type="checkbox"
                checked={syncExportWithTable}
                onChange={(e) => onToggleSync(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
              />
              <span className="text-xs text-slate-300 font-medium">
                Sync Export with Table
              </span>
            </label>
          </div>

          {/* Category Tabs & Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1">
              {(['all', 'data', 'reference', 'system'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                    activeCategoryFilter === cat
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {cat === 'all'
                    ? 'All Columns'
                    : cat === 'data'
                    ? 'Dataset'
                    : cat === 'reference'
                    ? 'Reference'
                    : 'Decision & Audit'}
                </button>
              ))}
            </div>

            {/* Preset Actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  handleSetAllTable(true);
                  handleSetAllExport(true);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
              >
                Show All
              </button>
              <button
                onClick={handleSelectDecisionOnly}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-md transition-colors"
                title="Keep Decision + Key Columns"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Key Only
              </button>
              <button
                onClick={onResetDefaults}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                title="Restore all default columns and initial order"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Column Header Titles in Modal */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 select-none shrink-0">
          <div className="col-span-6 sm:col-span-7 flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Order & Column Name ({filteredConfigs.length})</span>
          </div>
          <div className="col-span-3 sm:col-span-2 text-center flex items-center justify-center gap-1">
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span>Table</span>
            <button
              onClick={() => handleSetAllTable(tableVisibleCount < safeConfigs.length)}
              className="ml-1 text-[10px] text-slate-500 hover:text-emerald-400 underline"
              title="Toggle all in table"
            >
              {tableVisibleCount < safeConfigs.length ? 'all' : 'none'}
            </button>
          </div>
          <div className="col-span-3 text-center flex items-center justify-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>Excel Export</span>
            <button
              onClick={() => handleSetAllExport(exportVisibleCount < safeConfigs.length)}
              className="ml-1 text-[10px] text-slate-500 hover:text-sky-400 underline"
              title="Toggle all in export"
            >
              {exportVisibleCount < safeConfigs.length ? 'all' : 'none'}
            </button>
          </div>
        </div>

        {/* Scrollable Column List */}
        <div className="overflow-y-auto flex-1 p-3 sm:px-5 divide-y divide-slate-800/40 space-y-1">
          {filteredConfigs.length > 0 ? (
            filteredConfigs.map((col) => renderColumnItem(col))
          ) : (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-slate-400">
                {modalSearch
                  ? `No columns match "${modalSearch}"`
                  : 'No columns are available in this view.'}
              </p>
              <div className="flex justify-center gap-2">
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch('')}
                    className="px-3 py-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-lg hover:bg-emerald-900/60 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  onClick={onResetDefaults}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:text-white transition-colors"
                >
                  Restore All Default Columns
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Save Button */}
        <div className="p-4 sm:px-5 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Active: <span className="text-emerald-400 font-semibold">{tableVisibleCount} columns</span> in table,{' '}
            <span className="text-sky-400 font-semibold">{exportVisibleCount} columns</span> in export
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm transition-all hover:scale-[1.02]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Sync Column View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
