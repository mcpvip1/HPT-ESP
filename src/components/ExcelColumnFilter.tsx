import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../types';
import { translations } from '../translations';
import {
  Filter,
  ArrowUp,
  ArrowDown,
  Search,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

export interface UniqueValueItem {
  value: string;
  count: number;
}

interface ExcelColumnFilterProps {
  columnId: string;
  columnLabel: string;
  uniqueValues: UniqueValueItem[];
  selectedValues?: string[]; // If undefined, all values are currently selected (no filter)
  anchorRect?: DOMRect | null; // Trigger button coordinates to prevent clipping
  onApply: (selectedValues: string[] | undefined) => void;
  onClear: () => void;
  onSort: (direction: 'asc' | 'desc') => void;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const ExcelColumnFilter: React.FC<ExcelColumnFilterProps> = ({
  columnLabel,
  uniqueValues,
  selectedValues,
  anchorRect,
  onApply,
  onClear,
  onSort,
  isOpen,
  onClose,
  language = 'en',
}) => {
  const t = translations[language];
  const popoverRef = useRef<HTMLDivElement>(null);
  const [filterSearch, setFilterSearch] = useState('');
  
  // Local state for checkboxes in the popover
  const allValuesList = useMemo(() => uniqueValues.map((u) => u.value), [uniqueValues]);
  const [localSelected, setLocalSelected] = useState<string[]>(() => {
    return selectedValues !== undefined ? selectedValues : allValuesList;
  });

  // Re-sync local selection when popover opens or selectedValues changes
  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedValues !== undefined ? selectedValues : allValuesList);
      setFilterSearch('');
    }
  }, [isOpen, selectedValues, allValuesList]);

  // Click outside, escape, or window scroll to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleScroll = (e: Event) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  // Viewport position calculation ensuring NO CLIPPING on left, right, or bottom
  const popoverStyle = useMemo<React.CSSProperties>(() => {
    const popoverWidth = 265;
    const popoverEstimatedHeight = 360;

    if (!anchorRect) {
      return {
        position: 'fixed',
        top: '120px',
        left: '20px',
        zIndex: 99999,
      };
    }

    let top = anchorRect.bottom + 6;

    // Flip above or clamp if not enough room below
    if (top + popoverEstimatedHeight > window.innerHeight) {
      if (anchorRect.top > popoverEstimatedHeight + 20) {
        top = Math.max(12, anchorRect.top - popoverEstimatedHeight - 6);
      } else {
        top = Math.max(12, window.innerHeight - popoverEstimatedHeight - 12);
      }
    }

    // Align left with button, clamped between 12px and (window.innerWidth - width - 12)
    let left = anchorRect.left - 20;
    if (left < 12) {
      left = 12; // Prevents left-edge clipping
    } else if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    return {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${popoverWidth}px`,
      maxHeight: 'calc(100vh - 24px)',
      zIndex: 99999,
    };
  }, [anchorRect]);

  if (!isOpen) return null;

  const filteredItems = uniqueValues.filter((item) =>
    item.value.toLowerCase().includes(filterSearch.trim().toLowerCase())
  );

  const areAllFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => localSelected.includes(item.value));

  const handleToggleSelectAll = () => {
    if (areAllFilteredSelected) {
      // Unselect all visible in filter
      const visibleVals = new Set(filteredItems.map((i) => i.value));
      setLocalSelected((prev) => prev.filter((v) => !visibleVals.has(v)));
    } else {
      // Select all visible in filter
      const next = new Set(localSelected);
      filteredItems.forEach((i) => next.add(i.value));
      setLocalSelected(Array.from(next));
    }
  };

  const handleToggleItem = (val: string) => {
    setLocalSelected((prev) => {
      if (prev.includes(val)) {
        return prev.filter((v) => v !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleApply = () => {
    // If all items are selected or nothing was filtered, clear filter
    if (
      localSelected.length === allValuesList.length ||
      localSelected.length === 0
    ) {
      if (localSelected.length === 0) {
        onApply([]);
      } else {
        onApply(undefined);
      }
    } else {
      onApply(localSelected);
    }
    onClose();
  };

  const isFiltered = selectedValues !== undefined && selectedValues.length < allValuesList.length;

  const content = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      onClick={(e) => e.stopPropagation()}
      className="rounded-xl bg-white border border-slate-200 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-100 overflow-hidden font-sans font-normal ring-1 ring-black/5"
    >
      {/* Header */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 truncate max-w-[200px]">
          <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate font-bold">{t.filterHeaderPrefix} {columnLabel.replace('[Ref] ', '')}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          title={t.filterCloseMenu}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sorting Shortcuts */}
      <div className="p-2 border-b border-slate-200 flex items-center gap-1.5 bg-slate-50/60">
        <button
          type="button"
          onClick={() => {
            onSort('asc');
            onClose();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-semibold bg-white hover:bg-slate-100 hover:text-slate-900 rounded-md border border-slate-200 text-slate-700 shadow-xs transition-colors"
        >
          <ArrowUp className="w-3 h-3 text-emerald-600" />
          <span>{t.filterSortAsc}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSort('desc');
            onClose();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-semibold bg-white hover:bg-slate-100 hover:text-slate-900 rounded-md border border-slate-200 text-slate-700 shadow-xs transition-colors"
        >
          <ArrowDown className="w-3 h-3 text-emerald-600" />
          <span>{t.filterSortDesc}</span>
        </button>
      </div>

      {/* Values Search */}
      <div className="p-2 border-b border-slate-200">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder={t.filterSearchValues}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono shadow-xs"
            autoFocus
          />
          {filterSearch && (
            <button
              type="button"
              onClick={() => setFilterSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Checklist of distinct values */}
      <div className="p-2 max-h-48 overflow-y-auto space-y-0.5 font-mono text-xs">
        {/* Select All */}
        <label className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-700 select-none">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={areAllFilteredSelected}
              onChange={handleToggleSelectAll}
              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="font-semibold text-slate-800 font-sans text-xs">
              {t.filterSelectAll}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans font-semibold">
            {filteredItems.length}
          </span>
        </label>

        {filteredItems.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs font-sans">
            {t.filterNoMatchingValues}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isChecked = localSelected.includes(item.value);
            return (
              <label
                key={item.value}
                className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleItem(item.value)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span
                    className={`truncate text-xs ${
                      item.value === t.dashValueBlanks || item.value === t.dashValueEmpty
                        ? 'text-slate-400 italic'
                        : isChecked
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-600'
                    }`}
                    title={item.value}
                  >
                    {item.value}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded shrink-0 tabular-nums font-mono">
                  {item.count}
                </span>
              </label>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onClear();
            onClose();
          }}
          disabled={!isFiltered}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.filterClearFilter}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>{t.filterApply}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};
