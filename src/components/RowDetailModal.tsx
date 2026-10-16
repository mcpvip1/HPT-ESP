import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  FileQuestion,
  GitCompare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Language, MatchedRow } from '../types';
import { translations } from '../translations';

interface RowDetailModalProps {
  row: MatchedRow | null;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const RowDetailModal: React.FC<RowDetailModalProps> = ({
  row,
  isOpen,
  onClose,
  language = 'en',
}) => {
  if (!isOpen || !row) return null;

  const t = translations[language];

  const compKeys = Object.keys(row.comparisonRow);
  const refKeys = row.matchedMainRow ? Object.keys(row.matchedMainRow) : [];
  const unmatched = row.unmatchedInfo;
  const closestRef = unmatched?.closestReferenceRow;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${
                row.decisionColor === 'green'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : row.decisionColor === 'yellow'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                  : row.decisionColor === 'red'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  : row.decisionColor === 'blue'
                  ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.7)]'
                  : 'bg-slate-400'
              }`}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{t.modalRowNum}{row.rowIndex} {t.modalInspectionTitle}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{t.modalMatchKey}</span>
                <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {row.matchKey || t.modalNotAvailable}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. UNMATCHED ROOT-CAUSE DIAGNOSIS BANNER */}
        {!row.isMatched ? (
          <div className="p-4 mx-5 sm:mx-6 mt-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 shrink-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {t.modalUnmatchedAnalysis}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 font-mono">
                    {t.modalWhichUnmatched}{' '}
                    <span className="text-amber-800 font-bold underline decoration-amber-400">
                      {unmatched?.primaryIdentifier || row.matchKey || t.modalThisRecord}
                    </span>
                  </h4>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                {unmatched?.matchType === 'partial_mismatch'
                  ? t.modalPartialMismatch
                  : t.modalMissingInRef}
              </span>
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 font-semibold shrink-0">{t.modalReason}</span>
                <span className="text-slate-900 font-medium">{unmatched?.reason || row.decisionReason}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 font-semibold shrink-0">{t.modalIncomingKeyValues}</span>
                <span className="font-mono text-amber-800 font-semibold">{unmatched?.unmatchedKeyDisplay || row.matchKey}</span>
              </div>
            </div>

            {/* Field Diff Breakdown */}
            {unmatched?.fieldDiffs && unmatched.fieldDiffs.length > 0 && (
              <div className="pt-2 border-t border-amber-200">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.modalKeyColStatus}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {unmatched.fieldDiffs.map((diff, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                        diff.isMatch
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans mb-1 font-semibold">
                        <span>{diff.comparisonCol}</span>
                        {diff.isMatch ? (
                          <span className="text-emerald-700 flex items-center gap-0.5 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> {t.modalMatch}
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-0.5 font-bold">
                            <X className="w-3 h-3" /> {t.modalDiffer}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-slate-800 truncate">
                          <span className="text-slate-500 font-sans text-[10px]">{t.modalIncoming}</span>{' '}
                          {String(diff.compValue ?? '—')}
                        </div>
                        <div className="text-slate-800 truncate">
                          <span className="text-slate-500 font-sans text-[10px]">{t.modalReference}</span>{' '}
                          {String(diff.refValue ?? t.modalNotFound)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 mx-5 sm:mx-6 mt-4 shrink-0">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t.modalMatchedSuccess}</span>
              </div>
              <div className="text-slate-700">
                <span className="text-slate-500 mr-1.5">{t.modalDecision}</span>
                <strong className="text-slate-900">{row.decisionReason}</strong>
              </div>
            </div>

            {row.supersededByAccept && (
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                    {t.modalReconciledCase}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">{t.modalReconcileTitle}</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {t.modalReconcileBody
                        .replace('{value}', row.reconciledPostponeInfo?.originalPostponeValue || 'Postpone')
                        .replace('{column}', row.reconciledPostponeInfo?.originalPostponeColumn || 'Inspection Status')
                        .replace('{key}', row.matchKey)}
                    </p>
                  </div>
                </div>
                {row.reconciledPostponeInfo?.source && (
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-white text-emerald-800 border border-emerald-200 shadow-xs whitespace-nowrap">
                    {t.modalOverridingSource} {row.reconciledPostponeInfo.source}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. Side-by-Side Data Comparison */}
        <div className="flex-1 overflow-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Comparison File Row */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>{t.modalIncomingRecord}</span>
              <span className="text-[11px] font-mono text-slate-500">{t.modalRowNum}{row.rowIndex}</span>
            </h4>
            <div className="space-y-2 text-xs overflow-y-auto flex-1 divide-y divide-slate-200/80">
              {compKeys.map((k) => {
                const val = row.comparisonRow[k];
                const isFailedKey = unmatched?.fieldDiffs.some(
                  (d) => d.comparisonCol === k && !d.isMatch
                );

                return (
                  <div
                    key={k}
                    className={`flex items-start justify-between py-1.5 gap-4 ${
                      isFailedKey ? 'bg-rose-50 px-2 rounded' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-slate-500 font-mono text-[11px] font-medium">{k}</span>
                      {isFailedKey && (
                        <span className="text-[10px] px-1 rounded bg-rose-100 text-rose-800 border border-rose-200 font-sans font-bold">
                          {t.modalMismatch}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-900 font-mono text-right break-all font-semibold">
                      {String(val ?? '—')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference File Row / Closest Candidate */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>
                {row.matchedMainRow
                  ? t.modalMatchedRefRecord
                  : closestRef
                  ? t.modalClosestCandidate
                  : t.modalRefRecord}
              </span>
              {closestRef && !row.matchedMainRow && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-sans font-bold">
                  {t.modalPartialMatch}
                </span>
              )}
            </h4>

            {row.matchedMainRow ? (
              <div className="space-y-2 text-xs overflow-y-auto flex-1 divide-y divide-slate-200/80">
                {refKeys.map((k) => (
                  <div
                    key={k}
                    className="flex items-start justify-between py-1.5 gap-4"
                  >
                    <span className="text-slate-500 font-mono text-[11px] font-medium shrink-0">{k}</span>
                    <span className="text-slate-900 font-mono text-right break-all font-semibold">
                      {String(row.matchedMainRow![k] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            ) : closestRef ? (
              <div className="space-y-2 text-xs overflow-y-auto flex-1 divide-y divide-slate-200/80">
                <div className="pb-2 text-[11px] text-amber-700 font-medium">
                  {t.modalClosestDesc}
                </div>
                {Object.keys(closestRef).map((k) => {
                  const val = closestRef[k];
                  const isMatchingCol = unmatched?.fieldDiffs.some(
                    (d) => d.mainCol === k && d.isMatch
                  );
                  const isDifferingCol = unmatched?.fieldDiffs.some(
                    (d) => d.mainCol === k && !d.isMatch
                  );

                  return (
                    <div
                      key={k}
                      className={`flex items-start justify-between py-1.5 gap-4 ${
                        isMatchingCol
                          ? 'bg-emerald-50 px-2 rounded'
                          : isDifferingCol
                          ? 'bg-rose-50 px-2 rounded'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-slate-500 font-mono text-[11px] font-medium">{k}</span>
                        {isMatchingCol && (
                          <span className="text-[10px] px-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                            {t.modalMatchedBadge}
                          </span>
                        )}
                        {isDifferingCol && (
                          <span className="text-[10px] px-1 rounded bg-rose-100 text-rose-800 border border-rose-200 font-sans">
                            {t.modalDiffersBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-900 font-mono text-right break-all font-semibold">
                        {String(val ?? '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs space-y-2">
                <FileQuestion className="w-10 h-10 text-slate-300" />
                <div className="font-semibold text-slate-700">
                  {t.modalZeroMatch}
                </div>
                <p className="max-w-xs text-slate-500 text-[11px]">
                  {t.modalZeroMatchDesc.replace('{id}', unmatched?.primaryIdentifier || row.matchKey)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 font-mono">
            {t.modalStatus} <span className="text-slate-900 font-bold">{row.isMatched ? t.modalMatched : t.modalUnmatchedNew}</span> · {t.modalLayer} <span className="text-emerald-700 font-bold">{row.decisionLayerName || 'Inspection'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
