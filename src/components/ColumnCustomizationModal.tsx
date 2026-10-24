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
import { ColumnConfigItem, Language } from '../types';
import { translations } from '../translations';

interface ColumnCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnConfigs: ColumnConfigItem[];
  onChangeConfigs: (newConfigs: ColumnConfigItem[]) => void;
  onSaveConfigs?: (newConfigs: ColumnConfigItem[]) => void;
  syncExportWithTable: boolean;
  onToggleSync: (sync: boolean) => void;
  onResetDefaults: () => void;
  language?: Language;
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
  language = 'en',
}) => {
  const t = translations[language];
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
        className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-[var(--bg-surface-alt)] rounded-lg transition-colors border border-transparent hover:border-[var(--border-light)]"
      >
        {/* Reorder Buttons & Column Name */}
        <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
          {/* Move Up / Down Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleMoveUp(col.id)}
              disabled={fullIndex <= 0}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title={t.colMoveUp}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMoveDown(col.id)}
              disabled={fullIndex >= safeConfigs.length - 1}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title={t.colMoveDown}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Position index badge */}
          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-surface-alt)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
            #{fullIndex + 1}
          </span>

          {/* Label */}
          <span
            className="text-xs font-mono text-[var(--text-primary)] font-medium truncate"
            title={String(col.label)}
          >
            {String(col.label)}
          </span>

          {/* Category Tag */}
          {col.category === 'system' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 font-bold">
              {t.colAudit}
            </span>
          )}
          {col.category === 'reference' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 font-bold">
              {t.colRef}
            </span>
          )}
          {isInspectionCol && col.category === 'data' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 font-bold">
              {t.colKeyRule}
            </span>
          )}
        </div>

        {/* Table View Checkbox */}
        <div className="col-span-3 sm:col-span-2 flex justify-center">
          <button
            onClick={() => handleToggleTable(col.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              col.showInTable
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'
                : 'bg-[var(--bg-surface-alt)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            {col.showInTable ? (
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
            <span className="hidden sm:inline">{t.colTable}</span>
          </button>
        </div>

        {/* Export Checkbox */}
        <div className="col-span-3 flex justify-center">
          <button
            onClick={() => handleToggleExport(col.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              col.showInExport
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs'
                : 'bg-[var(--bg-surface-alt)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            {col.showInExport ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
            <span className="hidden sm:inline">{t.colExport}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bulk-backdrop">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[var(--shadow-lg)] overflow-hidden text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-light)] bg-[var(--bg-surface-alt)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-soft-bd)] text-[var(--accent)] shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>{t.colTitle}</span>
                <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-soft-tx)] border border-[var(--accent-soft-bd)]">
                  {t.colBadge}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t.colDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] rounded-lg transition-colors cursor-pointer"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Quick Presets Bar */}
        <div className="p-3.5 sm:px-5 bg-[var(--bg-surface)] border-b border-[var(--border-light)] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Filter Inside Modal */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder={t.colSearchPh}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] font-mono shadow-xs"
              />
              {modalSearch && (
                <button
                  onClick={() => setModalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title={t.colClearSearch}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mirror / Sync Toggle */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--accent-light)] transition-colors shrink-0 select-none shadow-xs">
              <input
                type="checkbox"
                checked={syncExportWithTable}
                onChange={(e) => onToggleSync(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-primary)] font-semibold">
                {t.colSyncExport}
              </span>
            </label>
          </div>

          {/* Category Tabs & Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-light)]">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1">
              {(['all', 'data', 'reference', 'system'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                    activeCategoryFilter === cat
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]'
                  }`}
                >
                  {cat === 'all'
                    ? t.colTabAll
                    : cat === 'data'
                    ? t.colTabData
                    : cat === 'reference'
                    ? t.colTabRef
                    : t.colTabSystem}
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
                className="px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-soft)] hover:bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-md transition-colors cursor-pointer"
              >
                {t.colShowAll}
              </button>
              <button
                onClick={handleSelectDecisionOnly}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-soft-tx)] bg-[var(--accent-soft)] hover:opacity-90 border border-[var(--accent-soft-bd)] rounded-md transition-colors cursor-pointer"
                title={t.colKeepDecision}
              >
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                {t.colKeyOnly}
              </button>
              <button
                onClick={onResetDefaults}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-soft)] hover:bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-md transition-colors cursor-pointer"
                title={t.colRestoreDefaults}
              >
                <RotateCcw className="w-3 h-3" />
                {t.colReset}
              </button>
            </div>
          </div>
        </div>

        {/* Column Header Titles in Modal */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-[var(--bg-surface-alt)] border-b border-[var(--border-light)] text-[11px] font-bold text-[var(--text-secondary)] select-none shrink-0">
          <div className="col-span-6 sm:col-span-7 flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{t.colOrderName} ({filteredConfigs.length})</span>
          </div>
          <div className="col-span-3 sm:col-span-2 text-center flex items-center justify-center gap-1">
            <Table className="w-3.5 h-3.5 text-[var(--success)]" />
            <span>{t.colTable}</span>
            <button
              onClick={() => handleSetAllTable(tableVisibleCount < safeConfigs.length)}
              className="ml-1 text-[10px] text-[var(--accent)] hover:underline font-bold cursor-pointer"
              title={t.colToggleAllTable}
            >
              {tableVisibleCount < safeConfigs.length ? t.colAll : t.colNone}
            </button>
          </div>
          <div className="col-span-3 text-center flex items-center justify-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.colExcelExport}</span>
            <button
              onClick={() => handleSetAllExport(exportVisibleCount < safeConfigs.length)}
              className="ml-1 text-[10px] text-blue-500 hover:underline font-bold cursor-pointer"
              title={t.colToggleAllExport}
            >
              {exportVisibleCount < safeConfigs.length ? t.colAll : t.colNone}
            </button>
          </div>
        </div>

        {/* Scrollable Column List */}
        <div className="overflow-y-auto flex-1 p-3 sm:px-5 divide-y divide-[var(--border-faint)] space-y-1 bg-[var(--bg-surface)]">
          {filteredConfigs.length > 0 ? (
            filteredConfigs.map((col) => renderColumnItem(col))
          ) : (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-[var(--text-muted)]">
                {modalSearch
                  ? t.colNoMatch.replace('{q}', modalSearch)
                  : t.colNoCols}
              </p>
              <div className="flex justify-center gap-2">
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch('')}
                    className="px-3 py-1.5 text-xs font-semibold text-[var(--accent-soft-tx)] bg-[var(--accent-soft)] border border-[var(--accent-soft-bd)] rounded-lg hover:opacity-90 transition-colors cursor-pointer"
                  >
                    {t.colClearFilter}
                  </button>
                )}
                <button
                  onClick={onResetDefaults}
                  className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-soft)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-surface-alt)] transition-colors cursor-pointer"
                >
                  {t.colRestoreAll}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Save Button */}
        <div className="p-4 sm:px-5 border-t border-[var(--border-light)] bg-[var(--bg-surface-alt)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[var(--text-muted)] font-medium font-mono">
            {t.colActiveSummary.replace('{t}', String(tableVisibleCount)).replace('{e}', String(exportVisibleCount))}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="tbtn tbtn--neutral !h-9 !px-4"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveAndClose}
              className="tbtn tbtn--primary !h-9 !px-5"
            >
              <span className="tbtn__icon">
                <Save className="w-3.5 h-3.5 text-white" />
              </span>
              <span>{t.colSaveSync}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
