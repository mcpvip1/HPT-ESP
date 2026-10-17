import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Check,
  CheckSquare,
  Square,
  ArrowUpAZ,
  ArrowDownZA,
  FilterX,
  Filter,
} from 'lucide-react';

interface ExcelColumnFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  columnLabel: string;
  uniqueValues: { value: string; count: number }[];
  selectedValues: string[] | null; // null means no filter (all selected)
  onApplyFilter: (columnId: string, selected: string[] | null) => void;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  anchorRect: DOMRect | null;
}

export const ExcelColumnFilterPopover: React.FC<ExcelColumnFilterPopoverProps> = ({
  isOpen,
  onClose,
  columnId,
  columnLabel,
  uniqueValues,
  selectedValues,
  onApplyFilter,
  onSort,
  anchorRect,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Local temporary set of selected values
  const [tempSelected, setTempSelected] = useState<Set<string>>(() => {
    if (selectedValues && selectedValues.length > 0) {
      return new Set(selectedValues);
    }
    return new Set(uniqueValues.map((v) => v.value));
  });

  // Reset local state when popover opens or columnId changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (selectedValues && selectedValues.length > 0) {
        setTempSelected(new Set(selectedValues));
      } else {
        setTempSelected(new Set(uniqueValues.map((v) => v.value)));
      }
    }
  }, [isOpen, columnId, selectedValues, uniqueValues]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered unique values by search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return uniqueValues;
    return uniqueValues.filter((item) =>
      item.value.toLowerCase().includes(q)
    );
  }, [uniqueValues, searchQuery]);

  if (!isOpen || !anchorRect) return null;

  // Calculate coordinates to keep popover within viewport
  const popoverWidth = 280;
  let top = anchorRect.bottom + 6;
  let left = anchorRect.left;

  if (left + popoverWidth > window.innerWidth - 16) {
    left = window.innerWidth - popoverWidth - 16;
  }
  if (left < 16) {
    left = 16;
  }
  if (top + 400 > window.innerHeight) {
    top = Math.max(16, anchorRect.top - 410);
  }

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => tempSelected.has(item.value));

  const someFilteredSelected =
    filteredItems.some((item) => tempSelected.has(item.value)) &&
    !allFilteredSelected;

  const handleToggleSelectAll = () => {
    setTempSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredItems.forEach((item) => next.delete(item.value));
      } else {
        filteredItems.forEach((item) => next.add(item.value));
      }
      return next;
    });
  };

  const handleToggleItem = (value: string) => {
    setTempSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleApply = () => {
    // If every unique value is selected, treat as NO filter (null)
    if (tempSelected.size === uniqueValues.length) {
      onApplyFilter(columnId, null);
    } else {
      onApplyFilter(columnId, Array.from(tempSelected));
    }
    onClose();
  };

  const handleClear = () => {
    onApplyFilter(columnId, null);
    onClose();
  };

  const isFiltered = Boolean(selectedValues && selectedValues.length < uniqueValues.length);

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999,
      }}
      className="bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[460px]"
    >
      {/* Popover Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Filter className="w-3 h-3" />
          </div>
          <span className="font-semibold text-white truncate font-mono text-[11px]" title={columnLabel}>
            {columnLabel.replace('[Ref] ', '')}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close filter"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Excel Quick Sort Actions */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-900/60 space-y-1">
        <button
          onClick={() => {
            onSort(columnId, 'asc');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
        >
          <ArrowUpAZ className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Sort A to Z (Ascending)</span>
        </button>
        <button
          onClick={() => {
            onSort(columnId, 'desc');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
        >
          <ArrowDownZA className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Sort Z to A (Descending)</span>
        </button>
      </div>

      {/* Excel Value Search Box */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search values in column..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Select All Checkbox */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
        <label
          onClick={handleToggleSelectAll}
          className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white font-medium"
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
              allFilteredSelected
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : someFilteredSelected
                ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                : 'border-slate-700 bg-slate-950 text-transparent'
            }`}
          >
            {allFilteredSelected && <Check className="w-3 h-3 stroke-[3]" />}
            {someFilteredSelected && <div className="w-2 h-0.5 bg-emerald-400 rounded-sm" />}
          </div>
          <span>(Select All)</span>
        </label>
        <span className="text-[10px] text-slate-500 font-mono">
          {tempSelected.size}/{uniqueValues.length}
        </span>
      </div>

      {/* Unique Values Checkbox List */}
      <div className="flex-1 overflow-y-auto max-h-[190px] p-1.5 space-y-0.5 divide-y divide-slate-800/40">
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No matching values found
          </div>
        ) : (
          filteredItems.map((item) => {
            const isChecked = tempSelected.has(item.value);
            return (
              <label
                key={item.value}
                onClick={() => handleToggleItem(item.value)}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-slate-800/60 cursor-pointer select-none transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-700 bg-slate-950 text-transparent'
                    }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`font-mono text-xs truncate ${
                      item.value === '(Blanks)'
                        ? 'text-slate-500 italic'
                        : isChecked
                        ? 'text-slate-100 font-medium'
                        : 'text-slate-400'
                    }`}
                    title={item.value}
                  >
                    {item.value}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800/60 shrink-0">
                  {item.count.toLocaleString()}
                </span>
              </label>
            );
          })
        )}
      </div>

      {/* Popover Footer Buttons */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
        <button
          onClick={handleClear}
          disabled={!isFiltered}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-colors"
          title="Clear filter for this column"
        >
          <FilterX className="w-3 h-3 text-rose-400" />
          <span>Clear Filter</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
