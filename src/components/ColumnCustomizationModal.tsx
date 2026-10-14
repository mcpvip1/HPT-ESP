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
} from 'lucide-react';
import { ColumnConfigItem } from '../types';

interface ColumnCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnConfigs: ColumnConfigItem[];
  onChangeConfigs: (newConfigs: ColumnConfigItem[]) => void;
  syncExportWithTable: boolean;
  onToggleSync: (sync: boolean) => void;
  onResetDefaults: () => void;
}

export const ColumnCustomizationModal: React.FC<ColumnCustomizationModalProps> = ({
  isOpen,
  onClose,
  columnConfigs = [],
  onChangeConfigs,
  syncExportWithTable,
  onToggleSync,
  onResetDefaults,
}) => {
  const [modalSearch, setModalSearch] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'system' | 'data' | 'reference'>('all');

  if (!isOpen) return null;

  // Safe configs array guaranteed to never be null/undefined
  const safeConfigs: ColumnConfigItem[] = Array.isArray(columnConfigs) ? columnConfigs : [];

  const filteredConfigs = useMemo(() => {
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
  }, [safeConfigs, modalSearch, activeCategoryFilter]);

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

  // Group by category for structured display
  const systemCols = filteredConfigs.filter((c) => c.category === 'system');
  const dataCols = filteredConfigs.filter((c) => c.category === 'data');
  const refCols = filteredConfigs.filter((c) => c.category === 'reference');
  const otherCols = filteredConfigs.filter(
    (c) => c.category !== 'system' && c.category !== 'data' && c.category !== 'reference'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Choose Columns to Show</span>
                <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Table & Export
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select which columns appear in the Results Table and in the exported Excel spreadsheet.
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
              {(['all', 'system', 'data', 'reference'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                    activeCategoryFilter === cat
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat === 'system' ? 'Audit' : cat === 'data' ? 'Dataset' : 'Reference'}
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
                title="Keep Decision + Inspection + Key Columns"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Key Only
              </button>
              <button
                onClick={onResetDefaults}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                title="Restore all default columns"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Column Header Titles in Modal */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 select-none shrink-0">
          <div className="col-span-6 sm:col-span-7 flex items-center gap-1.5">
            <span>Column Name ({filteredConfigs.length})</span>
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
        <div className="overflow-y-auto flex-1 p-3 sm:px-5 divide-y divide-slate-800/60 space-y-4">
          {/* 1. System / Audit Columns */}
          {systemCols.length > 0 && (
            <div className="space-y-1 pt-1 first:pt-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 py-1 px-2 bg-slate-950/50 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Decision & System Audit Columns ({systemCols.length})</span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {systemCols.map((col) => (
                  <div
                    key={col.id}
                    className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-slate-800/40 rounded-lg transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-slate-200 truncate" title={String(col.label)}>
                        {String(col.label)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-900/60 shrink-0">
                        System
                      </span>
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
                ))}
              </div>
            </div>
          )}

          {/* 2. Incoming Data Columns */}
          {dataCols.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 py-1 px-2 bg-slate-950/50 rounded">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Dataset Data Columns ({dataCols.length})</span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {dataCols.map((col) => {
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
                      className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-slate-800/40 rounded-lg transition-colors"
                    >
                      <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-slate-200 truncate" title={String(col.label)}>
                          {String(col.label)}
                        </span>
                        {isInspectionCol && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-amber-950 text-amber-300 border border-amber-900/60 shrink-0">
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
                })}
              </div>
            </div>
          )}

          {/* 3. Reference Columns */}
          {refCols.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 py-1 px-2 bg-slate-950/50 rounded">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Reference Joined Columns ({refCols.length})</span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {refCols.map((col) => (
                  <div
                    key={col.id}
                    className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-slate-800/40 rounded-lg transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-purple-200 truncate" title={String(col.label)}>
                        {String(col.label)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-950 text-purple-300 border border-purple-900/60 shrink-0">
                        Ref
                      </span>
                    </div>

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
                ))}
              </div>
            </div>
          )}

          {/* 4. Other Columns if any */}
          {otherCols.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 py-1 px-2 bg-slate-950/50 rounded">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Other Columns ({otherCols.length})</span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {otherCols.map((col) => (
                  <div
                    key={col.id}
                    className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-slate-800/40 rounded-lg transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-slate-200 truncate" title={String(col.label)}>
                        {String(col.label)}
                      </span>
                    </div>

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
                ))}
              </div>
            </div>
          )}

          {/* Empty fallback state */}
          {filteredConfigs.length === 0 && (
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

        {/* Modal Footer */}
        <div className="p-4 sm:px-5 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Active: <span className="text-emerald-400 font-semibold">{tableVisibleCount} columns</span> in table,{' '}
            <span className="text-sky-400 font-semibold">{exportVisibleCount} columns</span> in export
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply & View Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};
