import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import {
  WorkbookData,
  ExcelRow,
  ColumnMapping,
  NormalizationRules,
  DecisionLayer,
  MatchedRow,
  MatchingStats,
  ResultColor,
  RuleCondition,
  UnmatchedInfo,
  UnmatchedFieldDiff,
} from '../types';

/**
 * Clamps a worksheet !ref to only cells that actually contain data.
 * This prevents SheetJS from creating 1,048,576 empty rows when an Excel file
 * has whole-column formatting or empty trailing rows.
 */
export function clampWorksheetRange(worksheet: XLSX.WorkSheet): void {
  if (!worksheet || typeof worksheet !== 'object') return;
  const currentRef = worksheet['!ref'];
  if (!currentRef) return;

  let minR = Infinity;
  let maxR = -1;
  let minC = Infinity;
  let maxC = -1;

  // Object.keys(worksheet) contains only instantiated cells and metadata like '!ref'
  const keys = Object.keys(worksheet);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    // Metadata properties start with '!'
    if (k.charCodeAt(0) === 33) continue;

    try {
      const cell = XLSX.utils.decode_cell(k);
      // Check if cell actually has a value
      const cellObj = worksheet[k];
      if (cellObj && cellObj.v !== undefined && cellObj.v !== null && cellObj.v !== '') {
        if (cell.r < minR) minR = cell.r;
        if (cell.r > maxR) maxR = cell.r;
        if (cell.c < minC) minC = cell.c;
        if (cell.c > maxC) maxC = cell.c;
      }
    } catch {
      // Ignore unparseable keys
    }
  }

  // If we found valid cells with data, clamp the range
  if (maxR >= 0 && maxC >= 0 && minR !== Infinity && minC !== Infinity) {
    worksheet['!ref'] = XLSX.utils.encode_range({
      s: { r: minR, c: minC },
      e: { r: maxR, c: maxC },
    });
  } else {
    // If no data cells found, reset to single cell to avoid allocating 1M rows
    worksheet['!ref'] = 'A1:A1';
  }
}

/**
 * High-performance, non-blocking Excel and CSV parser.
 * Yields to the event loop in chunks to prevent "Page Unresponsive" errors.
 */
export async function parseExcelFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<WorkbookData> {
  onProgress?.(10, 'Reading file buffer...');
  // Small delay to allow UI to render spinner
  await new Promise((r) => setTimeout(r, 20));

  const data = await file.arrayBuffer();
  const uint8 = new Uint8Array(data);

  onProgress?.(30, 'Decompressing spreadsheet...');
  await new Promise((r) => setTimeout(r, 10));

  // Suppress non-fatal SheetJS cfb zip warnings during parsing
  const originalError = console.error;
  let workbook: XLSX.WorkBook;
  try {
    console.error = (...args: any[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        msg.includes('Bad uncompressed size') ||
        msg.includes('Bad compressed size') ||
        msg.includes('Bad CRC32 checksum')
      ) {
        // Non-fatal streaming ZIP warning from SheetJS cfb
        return;
      }
      originalError.apply(console, args);
    };

    workbook = XLSX.read(uint8, {
      type: 'array',
      cellStyles: false,
      cellFormula: false,
      cellHTML: false,
      cellText: false,
      raw: true,
    });
  } catch (readErr: any) {
    // Fallback: If array read failed, try reading as UTF-8 string for CSV / TSV
    try {
      const text = new TextDecoder('utf-8').decode(uint8);
      workbook = XLSX.read(text, { type: 'string' });
    } catch {
      throw readErr;
    }
  } finally {
    console.error = originalError;
  }

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('No sheets found in workbook.');
  }

  const activeSheet = sheetNames[0];
  const worksheet = workbook.Sheets[activeSheet];

  onProgress?.(50, 'Optimizing sheet bounds...');
  // Critical fix: clamp range to prevent SheetJS from iterating 1,048,576 rows
  clampWorksheetRange(worksheet);

  onProgress?.(65, 'Extracting tabular data...');
  await new Promise((r) => setTimeout(r, 10));

  // Convert to 2D array with blankrows omitted
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    raw: true,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Sheet contains no readable data rows.');
  }

  // Header row is index 0
  const headerRow: string[] = (rawRows[0] || []).map((h: any, idx: number) => {
    const str = h !== undefined && h !== null ? String(h).trim() : '';
    return str !== '' ? str : `Column_${idx + 1}`;
  });

  const totalRaw = rawRows.length;
  const rows: ExcelRow[] = [];

  // Non-blocking row conversion: yields every 500 rows
  for (let r = 1; r < totalRaw; r++) {
    if (r % 500 === 0) {
      const pct = 65 + Math.round((r / totalRaw) * 30);
      onProgress?.(pct, `Processing row ${r.toLocaleString()} of ${totalRaw.toLocaleString()}...`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const rowArray = rawRows[r];
    if (!rowArray || rowArray.length === 0) continue;

    // Fast check: verify at least one cell has content
    let hasContent = false;
    for (let c = 0; c < rowArray.length; c++) {
      const val = rowArray[c];
      if (val !== undefined && val !== null && val !== '') {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) continue;

    const rowObj: ExcelRow = {};
    for (let c = 0; c < headerRow.length; c++) {
      const colName = headerRow[c];
      const val = rowArray[c];
      rowObj[colName] = val !== undefined && val !== null ? val : '';
    }
    rows.push(rowObj);
  }

  onProgress?.(100, 'Done');

  return {
    id: `wb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    headers: headerRow,
    rows,
    sheetNames,
    activeSheet,
  };
}

/**
 * Normalizes a key string based on chosen rules
 */
export function normalizeValue(val: any, rules: NormalizationRules): string {
  if (val === null || val === undefined) return '';
  let str = String(val);

  if (rules.trimSpaces) {
    str = str.trim();
  }

  if (rules.ignoreCase) {
    str = str.toLowerCase();
  }

  if (rules.removeSpacesAndHyphens) {
    str = str.replace(/[\s\-_/]/g, '');
  }

  if (rules.ignoreLeadingZeros) {
    str = str.replace(/^0+(?=\d)/, '');
  }

  return str;
}

/**
 * Generates composite normalized key for a row based on column list
 */
export function generateRowKey(
  row: ExcelRow,
  columns: string[],
  rules: NormalizationRules
): string {
  return columns
    .map((col) => normalizeValue(row[col], rules))
    .join('|||');
}

/**
 * Auto-maps columns based on string similarity / token overlap
 */
export function autoMapColumns(
  mainHeaders: string[],
  compHeaders: string[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedCompHeaders = new Set<string>();

  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const mainCol of mainHeaders) {
    const mainClean = clean(mainCol);
    if (!mainClean) continue;

    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const compCol of compHeaders) {
      if (usedCompHeaders.has(compCol)) continue;
      const compClean = clean(compCol);
      if (!compClean) continue;

      // Exact clean match
      if (mainClean === compClean) {
        bestMatch = compCol;
        highestScore = 1.0;
        break;
      }

      // Enterprise synonym pairs
      const synonyms: [string, string][] = [
        ['po', 'purchaseorder'],
        ['ponumber', 'orderid'],
        ['part', 'item'],
        ['partnumber', 'itemcode'],
        ['batch', 'lot'],
        ['batchnumber', 'lotno'],
        ['status', 'result'],
        ['inspectionstatus', 'inspectionresult'],
        ['quality', 'grade'],
        ['supplier', 'vendor'],
      ];

      const isSynonym = synonyms.some(
        ([s1, s2]) =>
          (mainClean.includes(s1) && compClean.includes(s2)) ||
          (mainClean.includes(s2) && compClean.includes(s1))
      );

      if (isSynonym && highestScore < 0.8) {
        bestMatch = compCol;
        highestScore = 0.8;
      } else if (
        mainClean.length >= 3 &&
        compClean.length >= 3 &&
        (mainClean.includes(compClean) || compClean.includes(mainClean)) &&
        highestScore < 0.6
      ) {
        bestMatch = compCol;
        highestScore = 0.6;
      }
    }

    if (bestMatch && highestScore >= 0.6) {
      mappings.push({
        id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        mainCol,
        comparisonCol: bestMatch,
      });
      usedCompHeaders.add(bestMatch);
    }
  }

  // If none matched, pair first column
  if (mappings.length === 0 && mainHeaders.length > 0 && compHeaders.length > 0) {
    mappings.push({
      id: `map_default_1`,
      mainCol: mainHeaders[0],
      comparisonCol: compHeaders[0],
    });
  }

  return mappings;
}

/**
 * Checks if a cell value satisfies a condition
 */
function testCondition(cellVal: any, condition: RuleCondition, targetVal: string): boolean {
  const strVal = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
  const searchVal = (targetVal || '').trim();

  switch (condition) {
    case 'contains':
      return strVal.toLowerCase().includes(searchVal.toLowerCase());
    case 'equals':
      return strVal.toLowerCase() === searchVal.toLowerCase();
    case 'starts_with':
      return strVal.toLowerCase().startsWith(searchVal.toLowerCase());
    case 'ends_with':
      return strVal.toLowerCase().endsWith(searchVal.toLowerCase());
    case 'is_empty':
      return strVal === '';
    case 'is_not_empty':
      return strVal !== '';
    case 'greater_than': {
      const num1 = parseFloat(strVal);
      const num2 = parseFloat(searchVal);
      return !isNaN(num1) && !isNaN(num2) && num1 > num2;
    }
    case 'less_than': {
      const num1 = parseFloat(strVal);
      const num2 = parseFloat(searchVal);
      return !isNaN(num1) && !isNaN(num2) && num1 < num2;
    }
    default:
      return false;
  }
}

/**
 * Helper to fetch a field value from a row flexibly:
 * Checks direct key, [Ref] prefix, and case/spacing-insensitive matches.
 */
export function getRowFieldValue(row: ExcelRow | undefined, colName: string): any {
  if (!row || !colName) return undefined;
  if (row[colName] !== undefined && row[colName] !== '') return row[colName];
  if (row[`[Ref] ${colName}`] !== undefined && row[`[Ref] ${colName}`] !== '') return row[`[Ref] ${colName}`];

  const cleanTarget = colName.trim().toLowerCase();
  for (const [k, v] of Object.entries(row)) {
    const cleanK = k.replace(/^\[Ref\]\s*/i, '').trim().toLowerCase();
    if (cleanK === cleanTarget && v !== undefined && v !== '') {
      return v;
    }
  }

  // Also match normalized alphanumeric token
  const alphaTarget = cleanTarget.replace(/[^a-z0-9]/g, '');
  if (alphaTarget.length >= 3) {
    for (const [k, v] of Object.entries(row)) {
      const alphaK = k.replace(/^\[Ref\]\s*/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (alphaK === alphaTarget && v !== undefined && v !== '') {
        return v;
      }
    }
  }

  return undefined;
}

/**
 * Resolves a column value across source datasets
 */
export function resolveColumnValue(
  colName: string | undefined,
  source: 'main' | 'comparison' | 'merged',
  context: { mainRow?: ExcelRow; compRow: ExcelRow; mergedRow: ExcelRow }
): { value: any; foundCol: string } {
  if (!colName) return { value: '', foundCol: '' };

  let val: any = undefined;
  let foundCol = colName;

  if (source === 'main' && context.mainRow) {
    val = getRowFieldValue(context.mainRow, colName);
  } else if (source === 'comparison') {
    val = getRowFieldValue(context.compRow, colName);
  } else {
    // Merged: check mergedRow, compRow, then mainRow
    val = getRowFieldValue(context.mergedRow, colName);
    if (val === undefined || val === '') {
      val = getRowFieldValue(context.compRow, colName);
    }
    if ((val === undefined || val === '') && context.mainRow) {
      val = getRowFieldValue(context.mainRow, colName);
    }
  }

  // Fallback: check if any row key contains the column name
  if (val === undefined || val === '') {
    const rows = [context.compRow, context.mergedRow, context.mainRow].filter(Boolean);
    const targetClean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const r of rows) {
      for (const [k, v] of Object.entries(r!)) {
        const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (kClean.includes(targetClean) || targetClean.includes(kClean)) {
          if (v !== undefined && v !== '') {
            val = v;
            foundCol = k;
            break;
          }
        }
      }
      if (val !== undefined && val !== '') break;
    }
  }

  return { value: val !== undefined ? val : '', foundCol };
}

/**
 * Evaluates decision layers on a merged or single row
 */
export function evaluateDecisionLayers(
  rowContext: {
    mainRow?: ExcelRow;
    compRow: ExcelRow;
    mergedRow: ExcelRow;
  },
  layers: DecisionLayer[]
): {
  color: ResultColor | 'none';
  reason: string;
  layerName?: string;
} {
  for (const layer of layers) {
    const primaryCol = layer.primaryColumn;
    const secondaryCol = layer.secondaryColumn;

    const { value: primaryVal, foundCol: resolvedPriCol } = resolveColumnValue(
      primaryCol,
      layer.source,
      rowContext
    );

    const { value: secondaryVal, foundCol: resolvedSecCol } = resolveColumnValue(
      secondaryCol,
      layer.source,
      rowContext
    );

    for (const rule of layer.rules) {
      let ruleMatched = false;
      let matchedCol = resolvedPriCol || primaryCol;
      let matchedVal = primaryVal;

      const target = rule.targetColumn || 'any';

      // 1. Target specific column
      if (target === 'primary') {
        ruleMatched = testCondition(primaryVal, rule.condition, rule.value);
        matchedCol = resolvedPriCol || primaryCol;
        matchedVal = primaryVal;
      } else if (target === 'secondary' && secondaryCol) {
        ruleMatched = testCondition(secondaryVal, rule.condition, rule.value);
        matchedCol = resolvedSecCol || secondaryCol;
        matchedVal = secondaryVal;
      } else {
        // 'any' or default: check primary column first, then secondary column
        const matchPri = testCondition(primaryVal, rule.condition, rule.value);
        if (matchPri) {
          ruleMatched = true;
          matchedCol = resolvedPriCol || primaryCol;
          matchedVal = primaryVal;
        } else if (secondaryCol) {
          const matchSec = testCondition(secondaryVal, rule.condition, rule.value);
          if (matchSec) {
            ruleMatched = true;
            matchedCol = resolvedSecCol || secondaryCol;
            matchedVal = secondaryVal;
          }
        }
      }

      // 2. Compound condition if configured
      if (secondaryCol && rule.secondaryCondition && rule.secondaryValue !== undefined) {
        const primaryMatches = testCondition(primaryVal, rule.condition, rule.value);
        const secondaryMatches = testCondition(
          secondaryVal,
          rule.secondaryCondition,
          rule.secondaryValue
        );

        if (layer.matchLogic === 'and') {
          ruleMatched = primaryMatches && secondaryMatches;
        } else {
          ruleMatched = primaryMatches || secondaryMatches;
        }
      }

      if (ruleMatched) {
        const colorLabel =
          rule.color === 'green'
            ? 'GREEN (Accepted)'
            : rule.color === 'yellow'
            ? 'YELLOW (Review Required)'
            : rule.color === 'red'
            ? 'RED (Rejected)'
            : rule.color.toUpperCase();
        const detailReason = `${matchedCol} ("${matchedVal ?? ''}") contains "${rule.value}" → ${colorLabel}`;

        return {
          color: rule.color,
          reason: detailReason,
          layerName: layer.name,
        };
      }
    }

    if (layer.fallbackColor && layer.fallbackColor !== 'none') {
      const colNote = secondaryCol
        ? `${resolvedPriCol || primaryCol} or ${resolvedSecCol || secondaryCol}`
        : (resolvedPriCol || primaryCol);
      const fallbackColorLabel =
        layer.fallbackColor === 'yellow'
          ? 'YELLOW (Review Required)'
          : layer.fallbackColor === 'red'
          ? 'RED (Rejected)'
          : layer.fallbackColor.toUpperCase();
      return {
        color: layer.fallbackColor,
        reason: `No match in ${colNote} → ${fallbackColorLabel}`,
        layerName: layer.name,
      };
    }
  }

  return {
    color: 'none',
    reason: 'No decision rule matched',
  };
}

/**
 * Analyzes an unmatched row to provide granular diagnostics:
 * which key or fields failed, whether a partial match exists in the reference file,
 * and what the exact differing values are.
 */
export function analyzeUnmatchedRow(
  compRow: ExcelRow,
  mappings: ColumnMapping[],
  normalization: NormalizationRules,
  mainWb: WorkbookData
): UnmatchedInfo {
  const primaryMapping = mappings[0];
  const primaryVal = primaryMapping ? compRow[primaryMapping.comparisonCol] : '';
  const primaryCol = primaryMapping ? primaryMapping.comparisonCol : 'Key Column';

  const primaryIdentifier =
    primaryVal !== undefined && primaryVal !== null && String(primaryVal).trim() !== ''
      ? String(primaryVal).trim()
      : String(
          Object.values(compRow).find((v) => v !== undefined && v !== null && String(v).trim() !== '') ||
            'Unidentified'
        );

  const unmatchedKeyDisplay =
    mappings.length > 0
      ? mappings.map((m) => `${m.comparisonCol}: "${compRow[m.comparisonCol] ?? '—'}"`).join(' · ')
      : `Row Value: ${primaryIdentifier}`;

  if (mappings.length === 0) {
    return {
      unmatchedKeyDisplay,
      primaryIdentifier,
      reason: 'No key column mappings configured to compare with Reference file',
      matchType: 'no_key',
      fieldDiffs: [],
    };
  }

  // Scan reference rows to detect closest candidate or partial matches
  let bestCandidate: ExcelRow | null = null;
  let bestMatchCount = 0;
  let bestDiffs: UnmatchedFieldDiff[] = [];

  for (let r = 0; r < mainWb.rows.length; r++) {
    const refRow = mainWb.rows[r];
    let matchCount = 0;
    const diffs: UnmatchedFieldDiff[] = [];

    for (const m of mappings) {
      const compVal = compRow[m.comparisonCol];
      const refVal = refRow[m.mainCol];
      const compNorm = normalizeValue(compVal, normalization);
      const refNorm = normalizeValue(refVal, normalization);

      const isMatch = compNorm === refNorm && compNorm !== '';
      if (isMatch) matchCount++;

      diffs.push({
        comparisonCol: m.comparisonCol,
        mainCol: m.mainCol,
        compValue: compVal,
        refValue: refVal,
        isMatch,
      });
    }

    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestCandidate = refRow;
      bestDiffs = diffs;
    }
  }

  if (bestMatchCount > 0 && bestCandidate) {
    const matchedCols = bestDiffs.filter((d) => d.isMatch).map((d) => d.comparisonCol);
    const failedFields = bestDiffs.filter((d) => !d.isMatch);
    const failedDesc = failedFields
      .map((d) => `${d.comparisonCol} is '${d.compValue ?? ''}' (Ref has '${d.refValue ?? ''}')`)
      .join(', ');

    return {
      unmatchedKeyDisplay,
      primaryIdentifier,
      reason: `Partial match: ${matchedCols.join(', ')} matched, but ${failedDesc}`,
      matchType: 'partial_mismatch',
      fieldDiffs: bestDiffs,
      closestReferenceRow: bestCandidate,
    };
  }

  // Completely missing in reference
  const defaultDiffs: UnmatchedFieldDiff[] = mappings.map((m) => ({
    comparisonCol: m.comparisonCol,
    mainCol: m.mainCol,
    compValue: compRow[m.comparisonCol],
    refValue: undefined,
    isMatch: false,
  }));

  return {
    unmatchedKeyDisplay,
    primaryIdentifier,
    reason: `${primaryCol} '${primaryIdentifier}' was not found in Reference catalog (${mainWb.name})`,
    matchType: 'completely_missing',
    fieldDiffs: defaultDiffs,
  };
}

/**
 * Main comparison and matching engine
 */
export function processMatching(
  mainWb: WorkbookData,
  compWb: WorkbookData,
  mappings: ColumnMapping[],
  normalization: NormalizationRules,
  layers: DecisionLayer[]
): {
  results: MatchedRow[];
  stats: MatchingStats;
} {
  const mainCols = mappings.map((m) => m.mainCol);
  const compCols = mappings.map((m) => m.comparisonCol);

  // Build key map for reference workbook
  const mainKeyMap = new Map<string, ExcelRow>();
  for (let i = 0; i < mainWb.rows.length; i++) {
    const row = mainWb.rows[i];
    const key = generateRowKey(row, mainCols, normalization);
    if (key && !mainKeyMap.has(key)) {
      mainKeyMap.set(key, row);
    }
  }

  const results: MatchedRow[] = [];
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let otherCount = 0;
  let matchedCount = 0;

  for (let idx = 0; idx < compWb.rows.length; idx++) {
    const compRow = compWb.rows[idx];
    const matchKey = generateRowKey(compRow, compCols, normalization);
    const matchedMainRow = mainKeyMap.get(matchKey);
    const isMatched = !!matchedMainRow;

    if (isMatched) {
      matchedCount++;
    }

    const mergedRow: ExcelRow = { ...compRow };
    if (matchedMainRow) {
      for (const [key, val] of Object.entries(matchedMainRow)) {
        if (mergedRow[key] === undefined) {
          mergedRow[key] = val;
          mergedRow[`[Ref] ${key}`] = val;
        } else if (compRow[key] !== val) {
          mergedRow[`[Ref] ${key}`] = val;
        }
      }
    }

    // Granular Unmatched Root Cause Diagnosis
    const unmatchedInfo = !isMatched
      ? analyzeUnmatchedRow(compRow, mappings, normalization, mainWb)
      : undefined;

    const evaluation = evaluateDecisionLayers(
      {
        mainRow: matchedMainRow,
        compRow,
        mergedRow,
      },
      layers
    );

    if (evaluation.color === 'green') greenCount++;
    else if (evaluation.color === 'yellow') yellowCount++;
    else if (evaluation.color === 'red') redCount++;
    else otherCount++;

    results.push({
      id: `row_${idx + 1}`,
      rowIndex: idx + 1,
      matchKey,
      isMatched,
      unmatchedInfo,
      matchedMainRow,
      comparisonRow: compRow,
      decisionColor: evaluation.color,
      decisionReason: evaluation.reason,
      decisionLayerName: evaluation.layerName,
      mergedRow,
    });
  }

  const totalIncoming = compWb.rows.length;
  const matchRate = totalIncoming > 0 ? (matchedCount / totalIncoming) * 100 : 0;

  const unmatchedItems = results
    .filter((r) => !r.isMatched)
    .map((r) => ({
      rowIndex: r.rowIndex,
      identifier: r.unmatchedInfo?.primaryIdentifier || r.matchKey,
      reason: r.unmatchedInfo?.reason || 'Not found in reference',
    }));

  const stats: MatchingStats = {
    totalIncoming,
    matchedCount,
    unmatchedCount: totalIncoming - matchedCount,
    matchRate: Math.round(matchRate * 10) / 10,
    greenCount,
    yellowCount,
    redCount,
    otherCount,
    unmatchedItems,
  };

  return { results, stats };
}

/**
 * Professional Styled Excel Export using xlsx-js-style
 * Retains high-contrast solid Green, Amber/Yellow, and Red fills
 * with clean corporate executive styling across all spreadsheet viewers.
 */
export function exportStyledExcel(
  results: MatchedRow[],
  compHeaders: string[],
  stats: MatchingStats,
  baseFilename: string,
  exportColumnIds?: string[]
): void {
  const wb = XLSXStyle.utils.book_new();

  const thinBorder = (colorHex = 'CBD5E1') => ({
    top: { style: 'thin', color: { rgb: colorHex } },
    bottom: { style: 'thin', color: { rgb: colorHex } },
    left: { style: 'thin', color: { rgb: colorHex } },
    right: { style: 'thin', color: { rgb: colorHex } },
  });

  const shouldInclude = (id: string, label: string): boolean => {
    if (!exportColumnIds || exportColumnIds.length === 0) return true;
    return exportColumnIds.includes(id) || exportColumnIds.includes(label);
  };

  // 1. Audit Summary Worksheet
  const summaryAoa: any[][] = [
    ['EXCELMATCH PRO — AUDIT & DECISION VERIFICATION REPORT'],
    [`Generated: ${new Date().toLocaleString()} | Source: ${baseFilename}`],
    [],
    ['KEY PERFORMANCE METRIC', 'COUNT', 'SHARE (%)', 'STATUS / BENCHMARK'],
    ['Total Incoming Records', stats.totalIncoming, '100.0%', 'Evaluated'],
    ['Key Matched with Reference', stats.matchedCount, `${stats.matchRate}%`, 'High Confidence Match'],
    ['Unmatched New Records', stats.unmatchedCount, `${(100 - stats.matchRate).toFixed(1)}%`, 'New / Discrepancy'],
    [],
    ['DECISION STATUS BREAKDOWN', 'COUNT', 'PROPORTION', 'CLASSIFICATION'],
    ['Passed / Accepted Items', stats.greenCount, `${((stats.greenCount / (stats.totalIncoming || 1)) * 100).toFixed(1)}%`, 'PASSED (GREEN)'],
    ['Review Required / Postponed', stats.yellowCount, `${((stats.yellowCount / (stats.totalIncoming || 1)) * 100).toFixed(1)}%`, 'REVIEW (AMBER)'],
    ['Rejected / Defective Items', stats.redCount, `${((stats.redCount / (stats.totalIncoming || 1)) * 100).toFixed(1)}%`, 'REJECTED (RED)'],
    ['Uncategorized / No Rule Matched', stats.otherCount, `${((stats.otherCount / (stats.totalIncoming || 1)) * 100).toFixed(1)}%`, 'NO ACTION'],
  ];

  const wsSummary = XLSXStyle.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 16 }, { wch: 18 }, { wch: 24 }];

  // Style Title Row (A1)
  if (wsSummary['A1']) {
    wsSummary['A1'].s = {
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } },
      alignment: { vertical: 'center', horizontal: 'left' },
    };
  }

  // Style Subtitle Row (A2)
  if (wsSummary['A2']) {
    wsSummary['A2'].s = {
      font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '94A3B8' } },
      fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
      alignment: { vertical: 'center', horizontal: 'left' },
    };
  }

  // Style Table Headers (Row 4 & Row 9)
  [3, 8].forEach((rIdx) => {
    for (let c = 0; c < 4; c++) {
      const cRef = XLSXStyle.utils.encode_cell({ r: rIdx, c });
      if (wsSummary[cRef]) {
        wsSummary[cRef].s = {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
          alignment: { vertical: 'center', horizontal: c === 0 ? 'left' : 'center' },
          border: thinBorder('0F172A'),
        };
      }
    }
  });

  // Style Metric Data rows in Summary
  for (let r = 4; r <= 6; r++) {
    for (let c = 0; c < 4; c++) {
      const cRef = XLSXStyle.utils.encode_cell({ r, c });
      if (wsSummary[cRef]) {
        wsSummary[cRef].s = {
          font: { name: 'Calibri', sz: 10, bold: c === 1 },
          fill: { patternType: 'solid', fgColor: { rgb: r % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } },
          alignment: { vertical: 'center', horizontal: c === 0 ? 'left' : 'center' },
          border: thinBorder('E2E8F0'),
        };
      }
    }
  }

  // Style Status Breakdown Rows: Row 10 (Green), Row 11 (Yellow), Row 12 (Red)
  const statusStyles = [
    { row: 9, fg: '059669', fontColor: 'FFFFFF', bgTint: 'ECFDF5', borderColor: 'A7F3D0' },
    { row: 10, fg: 'D97706', fontColor: 'FFFFFF', bgTint: 'FFFBEB', borderColor: 'FDE68A' },
    { row: 11, fg: 'DC2626', fontColor: 'FFFFFF', bgTint: 'FEF2F2', borderColor: 'FECACA' },
    { row: 12, fg: '64748B', fontColor: 'FFFFFF', bgTint: 'F8FAFC', borderColor: 'E2E8F0' },
  ];

  statusStyles.forEach(({ row, fg, fontColor, bgTint, borderColor }) => {
    for (let c = 0; c < 4; c++) {
      const cRef = XLSXStyle.utils.encode_cell({ r: row, c });
      if (wsSummary[cRef]) {
        if (c === 3) {
          wsSummary[cRef].s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: fontColor } },
            fill: { patternType: 'solid', fgColor: { rgb: fg } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: thinBorder(fg),
          };
        } else {
          wsSummary[cRef].s = {
            font: { name: 'Calibri', sz: 10, bold: c === 1 },
            fill: { patternType: 'solid', fgColor: { rgb: bgTint } },
            alignment: { vertical: 'center', horizontal: c === 0 ? 'left' : 'center' },
            border: thinBorder(borderColor),
          };
        }
      }
    }
  });

  XLSXStyle.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Evaluated Results Sheet (with rich Green, Yellow, Red fills & selected columns)
  const resultRows = results.map((item) => {
    const rowObj: Record<string, any> = {};

    if (shouldInclude('rowIndex', 'Row #')) {
      rowObj['Row #'] = item.rowIndex;
    }

    if (shouldInclude('decisionStatus', 'Decision Outcome')) {
      rowObj['Decision Outcome'] =
        item.decisionColor === 'green'
          ? 'PASSED / ACCEPTED'
          : item.decisionColor === 'yellow'
          ? 'REVIEW REQUIRED'
          : item.decisionColor === 'red'
          ? 'REJECTED'
          : 'NO ACTION';
    }

    if (shouldInclude('resultColor', 'Result Color')) {
      rowObj['Result Color'] = item.decisionColor.toUpperCase();
    }

    if (shouldInclude('matchStatus', 'Match Status')) {
      rowObj['Match Status'] = item.isMatched
        ? 'MATCHED'
        : `UNMATCHED: ${item.unmatchedInfo?.primaryIdentifier || item.matchKey} — ${item.unmatchedInfo?.reason || 'Not in Reference'}`;
    }

    if (shouldInclude('decisionReason', 'Evaluation Reason')) {
      rowObj['Evaluation Reason'] = item.decisionReason;
    }

    for (const h of compHeaders) {
      if (shouldInclude(h, h)) {
        rowObj[h] = item.comparisonRow[h] ?? '';
      }
    }

    if (item.matchedMainRow) {
      for (const [k, v] of Object.entries(item.matchedMainRow)) {
        const refKey = `[Ref] ${k}`;
        if (!compHeaders.includes(k) && shouldInclude(refKey, refKey)) {
          rowObj[refKey] = v ?? '';
        }
      }
    }

    // Safety fallback: if no columns were selected, default to Outcome and Row #
    if (Object.keys(rowObj).length === 0) {
      rowObj['Row #'] = item.rowIndex;
      rowObj['Decision Outcome'] = item.decisionColor.toUpperCase();
    }

    return rowObj;
  });

  const wsData = XLSXStyle.utils.json_to_sheet(resultRows);
  const dataHeaders = Object.keys(resultRows[0] || {});

  // Set column widths based on dynamic headers
  wsData['!cols'] = dataHeaders.map((header) => {
    if (header === 'Row #') return { wch: 8 };
    if (header === 'Decision Outcome') return { wch: 22 };
    if (header === 'Result Color') return { wch: 15 };
    if (header === 'Match Status') return { wch: 20 };
    if (header === 'Evaluation Reason') return { wch: 38 };
    return { wch: Math.max(header.length + 4, 16) };
  });

  // Style Header Row (Row 0)
  dataHeaders.forEach((header, cIdx) => {
    const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: cIdx });
    if (wsData[cellRef]) {
      const isCenter = ['Row #', 'Decision Outcome', 'Result Color', 'Match Status'].includes(header);
      wsData[cellRef].s = {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
        alignment: { vertical: 'center', horizontal: isCenter ? 'center' : 'left' },
        border: thinBorder('0F172A'),
      };
    }
  });

  // Style Data Rows with Green, Yellow, and Red fills
  results.forEach((item, rIdx) => {
    const sheetRow = rIdx + 1; // 0 is header row
    const isGreen = item.decisionColor === 'green';
    const isYellow = item.decisionColor === 'yellow';
    const isRed = item.decisionColor === 'red';

    const solidColor = isGreen
      ? '059669' // Solid Emerald
      : isYellow
      ? 'D97706' // Solid Amber
      : isRed
      ? 'DC2626' // Solid Crimson
      : '64748B'; // Slate

    const rowBgTint = isGreen
      ? 'ECFDF5' // Light Green
      : isYellow
      ? 'FFFBEB' // Light Amber
      : isRed
      ? 'FEF2F2' // Light Crimson
      : rIdx % 2 === 0
      ? 'F8FAFC'
      : 'FFFFFF';

    const rowBorderColor = isGreen
      ? 'A7F3D0'
      : isYellow
      ? 'FDE68A'
      : isRed
      ? 'FECACA'
      : 'E2E8F0';

    for (let cIdx = 0; cIdx < dataHeaders.length; cIdx++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: sheetRow, c: cIdx });
      const cell = wsData[cellRef];
      if (!cell) continue;

      const colHeader = dataHeaders[cIdx];

      // Dynamic header-based styling:
      if (colHeader === 'Row #') {
        cell.s = {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '64748B' } },
          fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: thinBorder(rowBorderColor),
        };
      }
      else if (colHeader === 'Decision Outcome') {
        cell.s = {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { patternType: 'solid', fgColor: { rgb: solidColor } },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: thinBorder(solidColor),
        };
      }
      else if (colHeader === 'Result Color') {
        cell.s = {
          font: {
            name: 'Calibri',
            sz: 9,
            bold: true,
            color: { rgb: isGreen ? '065F46' : isYellow ? '92400E' : isRed ? '991B1B' : '334155' },
          },
          fill: {
            patternType: 'solid',
            fgColor: { rgb: isGreen ? 'D1FAE5' : isYellow ? 'FEF3C7' : isRed ? 'FEE2E2' : 'F1F5F9' },
          },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: thinBorder(isGreen ? '34D399' : isYellow ? 'FBBF24' : isRed ? 'F87171' : 'CBD5E1'),
        };
      }
      else if (colHeader === 'Match Status') {
        const isMatched = item.isMatched;
        cell.s = {
          font: {
            name: 'Calibri',
            sz: 9,
            bold: true,
            color: { rgb: isMatched ? '065F46' : '92400E' },
          },
          fill: {
            patternType: 'solid',
            fgColor: { rgb: isMatched ? 'D1FAE5' : 'FEF3C7' },
          },
          alignment: { vertical: 'center', horizontal: 'center' },
          border: thinBorder(isMatched ? 'A7F3D0' : 'FDE68A'),
        };
      }
      else if (colHeader === 'Evaluation Reason') {
        cell.s = {
          font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '334155' } },
          fill: { patternType: 'solid', fgColor: { rgb: rowBgTint } },
          alignment: { vertical: 'center', horizontal: 'left' },
          border: thinBorder(rowBorderColor),
        };
      }
      // Data columns with smart cell-level highlight on Waive/Accept/Review/Reject
      else {
        const strVal = String(cell.v ?? '').toLowerCase();
        const isWaiveOrAccept = strVal.includes('waive') || strVal.includes('accept');
        const isRejectOrFail = strVal.includes('reject') || strVal.includes('fail');
        const isReviewOrPending = strVal.includes('review') || strVal.includes('pending') || strVal.includes('hold');

        if (isWaiveOrAccept) {
          cell.s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '065F46' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'D1FAE5' } },
            alignment: { vertical: 'center', horizontal: typeof cell.v === 'number' ? 'right' : 'left' },
            border: thinBorder('059669'),
          };
        } else if (isRejectOrFail) {
          cell.s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '991B1B' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } },
            alignment: { vertical: 'center', horizontal: typeof cell.v === 'number' ? 'right' : 'left' },
            border: thinBorder('DC2626'),
          };
        } else if (isReviewOrPending && isYellow) {
          cell.s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '92400E' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } },
            alignment: { vertical: 'center', horizontal: typeof cell.v === 'number' ? 'right' : 'left' },
            border: thinBorder('D97706'),
          };
        } else {
          cell.s = {
            font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
            fill: { patternType: 'solid', fgColor: { rgb: rowBgTint } },
            alignment: {
              vertical: 'center',
              horizontal: typeof cell.v === 'number' ? 'right' : 'left',
            },
            border: thinBorder(rowBorderColor),
          };
        }
      }
    }
  });

  // Enable Auto-Filter on data headers for immediate interactive Excel sorting
  wsData['!autofilter'] = {
    ref: XLSXStyle.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: results.length, c: Math.max(0, dataHeaders.length - 1) },
    }),
  };

  // Freeze top row for smooth scrolling
  wsData['!views'] = [{ state: 'frozen', ySplit: 1 }];

  XLSXStyle.utils.book_append_sheet(wb, wsData, 'Evaluated Results');

  const cleanName = baseFilename.replace(/\.[^/.]+$/, '');
  const outName = `${cleanName}_Evaluated_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSXStyle.writeFile(wb, outName);
}

/**
 * Clean CSV Exporter supporting custom column selection
 */
export function exportCsv(
  results: MatchedRow[],
  compHeaders: string[],
  baseFilename: string,
  exportColumnIds?: string[]
): void {
  const shouldInclude = (id: string, label: string): boolean => {
    if (!exportColumnIds || exportColumnIds.length === 0) return true;
    return exportColumnIds.includes(id) || exportColumnIds.includes(label);
  };

  const resultRows = results.map((item) => {
    const rowObj: Record<string, any> = {};

    if (shouldInclude('rowIndex', 'Row')) {
      rowObj['Row'] = item.rowIndex;
    }
    if (shouldInclude('decisionStatus', 'Decision Outcome')) {
      rowObj['Decision Outcome'] = item.decisionColor.toUpperCase();
    }
    if (shouldInclude('decisionReason', 'Reason')) {
      rowObj['Reason'] = item.decisionReason;
    }
    if (shouldInclude('matchStatus', 'Reference Match')) {
      rowObj['Reference Match'] = item.isMatched
        ? 'MATCHED'
        : `UNMATCHED: ${item.unmatchedInfo?.primaryIdentifier || item.matchKey} — ${item.unmatchedInfo?.reason || 'Not in Reference'}`;
    }

    for (const h of compHeaders) {
      if (shouldInclude(h, h)) {
        rowObj[h] = item.comparisonRow[h] ?? '';
      }
    }

    if (item.matchedMainRow) {
      for (const [k, v] of Object.entries(item.matchedMainRow)) {
        const refKey = `[Ref] ${k}`;
        if (!compHeaders.includes(k) && shouldInclude(refKey, refKey)) {
          rowObj[refKey] = v ?? '';
        }
      }
    }

    if (Object.keys(rowObj).length === 0) {
      rowObj['Row'] = item.rowIndex;
      rowObj['Decision Outcome'] = item.decisionColor.toUpperCase();
    }

    return rowObj;
  });

  const ws = XLSX.utils.json_to_sheet(resultRows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseFilename.replace(/\.[^/.]+$/, '')}_Results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Sample datasets
 */
export function generateSampleDatasets(): {
  reference: WorkbookData;
  comparison: WorkbookData;
} {
  const refRows: ExcelRow[] = [
    { 'PO Number': 'PO-8801', 'Part Number': 'CMP-101-A', 'Batch Number': 'LOT-2026-01', 'Supplier Name': 'Apex Industrial Co.', 'Unit Cost': 145.5, 'Target Tolerance': '±0.02mm', 'Inspection Status': 'Waive', 'Quality Grade': 'Grade A', 'Warehouse Location': 'Bay-01-A' },
    { 'PO Number': 'PO-8802', 'Part Number': 'CMP-102-B', 'Batch Number': 'LOT-2026-02', 'Supplier Name': 'Precision Micro LLC', 'Unit Cost': 89.0, 'Target Tolerance': '±0.05mm', 'Inspection Status': 'Pending', 'Quality Grade': 'Grade A', 'Warehouse Location': 'Bay-01-B' },
    { 'PO Number': 'PO-8803', 'Part Number': 'CMP-103-C', 'Batch Number': 'LOT-2026-03', 'Supplier Name': 'Titan Fasteners Corp', 'Unit Cost': 210.0, 'Target Tolerance': '±0.01mm', 'Inspection Status': 'Waive', 'Quality Grade': 'Grade B', 'Warehouse Location': 'Bay-02-A' },
    { 'PO Number': 'PO-8804', 'Part Number': 'CMP-104-D', 'Batch Number': 'LOT-2026-04', 'Supplier Name': 'Vertex Dynamics', 'Unit Cost': 45.2, 'Target Tolerance': '±0.10mm', 'Inspection Status': 'Hold', 'Quality Grade': 'Grade C', 'Warehouse Location': 'Quarantine-01' },
    { 'PO Number': 'PO-8805', 'Part Number': 'CMP-105-E', 'Batch Number': 'LOT-2026-05', 'Supplier Name': 'Silicon Global Tech', 'Unit Cost': 320.0, 'Target Tolerance': '±0.02mm', 'Inspection Status': 'Accept', 'Quality Grade': 'Grade A', 'Warehouse Location': 'Bay-03-A' },
    { 'PO Number': 'PO-8806', 'Part Number': 'CMP-106-F', 'Batch Number': 'LOT-2026-06', 'Supplier Name': 'Apex Industrial Co.', 'Unit Cost': 115.0, 'Target Tolerance': '±0.05mm', 'Inspection Status': 'Pending', 'Quality Grade': 'Grade B', 'Warehouse Location': 'Bay-03-B' },
    { 'PO Number': 'PO-8807', 'Part Number': 'CMP-107-G', 'Batch Number': 'LOT-2026-07', 'Supplier Name': 'Nordic Aero Parts', 'Unit Cost': 540.0, 'Target Tolerance': '±0.01mm', 'Inspection Status': 'Waive', 'Quality Grade': 'Grade A', 'Warehouse Location': 'Bay-04-A' },
    { 'PO Number': 'PO-8808', 'Part Number': 'CMP-108-H', 'Batch Number': 'LOT-2026-08', 'Supplier Name': 'Titan Fasteners Corp', 'Unit Cost': 65.5, 'Target Tolerance': '±0.08mm', 'Inspection Status': 'Hold', 'Quality Grade': 'Fail', 'Warehouse Location': 'Quarantine-02' },
    { 'PO Number': 'PO-8809', 'Part Number': 'CMP-109-I', 'Batch Number': 'LOT-2026-09', 'Supplier Name': 'Vertex Dynamics', 'Unit Cost': 195.0, 'Target Tolerance': '±0.03mm', 'Inspection Status': 'Accept', 'Quality Grade': 'Grade A', 'Warehouse Location': 'Bay-04-B' },
    { 'PO Number': 'PO-8810', 'Part Number': 'CMP-110-J', 'Batch Number': 'LOT-2026-10', 'Supplier Name': 'Precision Micro LLC', 'Unit Cost': 78.4, 'Target Tolerance': '±0.04mm', 'Inspection Status': 'Hold', 'Quality Grade': 'Grade B', 'Warehouse Location': 'Bay-05-A' },
  ];

  const compRows: ExcelRow[] = [
    { 'Purchase Order': 'PO-8801', 'Item Code': 'CMP-101-A', 'Lot No': 'LOT-2026-01', 'Vendor': 'Apex Industrial Co.', 'Received Qty': 500, 'Inspection Status': 'Waive', 'Inspection Result': 'Normal', 'Quality Grade': 'Grade A', 'Inspector': 'J. Miller' },
    { 'Purchase Order': 'po-8802', 'Item Code': 'cmp-102-b', 'Lot No': 'LOT-2026-02', 'Vendor': 'Precision Micro LLC', 'Received Qty': 1200, 'Inspection Status': 'Pending', 'Inspection Result': 'Accept', 'Quality Grade': 'Grade A', 'Inspector': 'A. Patel' },
    { 'Purchase Order': 'PO-8803', 'Item Code': 'CMP-103-C', 'Lot No': 'LOT-2026-03', 'Vendor': 'Titan Fasteners Corp', 'Received Qty': 300, 'Inspection Status': 'Waive', 'Inspection Result': 'Special Approval', 'Quality Grade': 'Grade B', 'Inspector': 'S. Chen' },
    { 'Purchase Order': 'PO-8804', 'Item Code': 'CMP-104-D', 'Lot No': 'LOT-2026-04', 'Vendor': 'Vertex Dynamics', 'Received Qty': 2500, 'Inspection Status': 'Hold', 'Inspection Result': 'In Review', 'Quality Grade': 'Grade C', 'Inspector': 'J. Miller' },
    { 'Purchase Order': 'PO-8805', 'Item Code': ' CMP-105-E ', 'Lot No': 'LOT-2026-05', 'Vendor': 'Silicon Global Tech', 'Received Qty': 150, 'Inspection Status': 'Accept', 'Inspection Result': 'Verified', 'Quality Grade': 'Grade A', 'Inspector': 'M. Rossi' },
    { 'Purchase Order': 'PO-8806', 'Item Code': 'CMP-106-F', 'Lot No': 'LOT-2026-06', 'Vendor': 'Apex Industrial Co.', 'Received Qty': 800, 'Inspection Status': 'Under Test', 'Inspection Result': 'Accept', 'Quality Grade': 'Grade B', 'Inspector': 'A. Patel' },
    { 'Purchase Order': 'PO-8807', 'Item Code': 'CMP-107-G', 'Lot No': 'LOT-2026-07', 'Vendor': 'Nordic Aero Parts', 'Received Qty': 80, 'Inspection Status': 'Waive', 'Inspection Result': 'Expedited', 'Quality Grade': 'Grade A', 'Inspector': 'S. Chen' },
    { 'Purchase Order': 'PO-8808', 'Item Code': 'CMP-108-H', 'Lot No': 'LOT-2026-08', 'Vendor': 'Titan Fasteners Corp', 'Received Qty': 4000, 'Inspection Status': 'Discrepant', 'Inspection Result': 'Hold for Material Review', 'Quality Grade': 'Fail', 'Inspector': 'J. Miller' },
    { 'Purchase Order': 'PO-8809', 'Item Code': 'CMP-109-I', 'Lot No': 'LOT-2026-09', 'Vendor': 'Vertex Dynamics', 'Received Qty': 420, 'Inspection Status': 'Accept', 'Inspection Result': 'Certified OK', 'Quality Grade': 'Grade A', 'Inspector': 'M. Rossi' },
    { 'Purchase Order': 'PO-8810', 'Item Code': 'CMP-110-J', 'Lot No': 'LOT-2026-10', 'Vendor': 'Precision Micro LLC', 'Received Qty': 950, 'Inspection Status': 'Quarantine', 'Inspection Result': 'Dimensional Check Required', 'Quality Grade': 'Grade B', 'Inspector': 'A. Patel' },
    { 'Purchase Order': 'PO-8811', 'Item Code': 'CMP-111-K', 'Lot No': 'LOT-2026-11', 'Vendor': 'Apex Industrial Co.', 'Received Qty': 620, 'Inspection Status': 'Under Review', 'Inspection Result': 'Accept', 'Quality Grade': 'Grade A', 'Inspector': 'S. Chen' },
    { 'Purchase Order': 'PO-8812', 'Item Code': 'CMP-112-L', 'Lot No': 'LOT-2026-12', 'Vendor': 'Silicon Global Tech', 'Received Qty': 110, 'Inspection Status': 'Rejected', 'Inspection Result': 'Reject - Out of Spec', 'Quality Grade': 'Grade C', 'Inspector': 'J. Miller' },
    { 'Purchase Order': 'PO-8813', 'Item Code': 'CMP-113-M', 'Lot No': 'LOT-2026-13', 'Vendor': 'Nordic Aero Parts', 'Received Qty': 65, 'Inspection Status': 'Waive', 'Inspection Result': 'Fast Track Waive', 'Quality Grade': 'Grade A', 'Inspector': 'M. Rossi' },
    { 'Purchase Order': 'PO-8814', 'Item Code': 'CMP-114-N', 'Lot No': 'LOT-2026-14', 'Vendor': 'Titan Fasteners Corp', 'Received Qty': 3200, 'Inspection Status': 'Verified', 'Inspection Result': 'Accept', 'Quality Grade': 'Grade A', 'Inspector': 'A. Patel' },
    { 'Purchase Order': 'PO-8815', 'Item Code': 'CMP-115-O', 'Lot No': 'LOT-2026-15', 'Vendor': 'Vertex Dynamics', 'Received Qty': 550, 'Inspection Status': 'Pending', 'Inspection Result': 'Re-test Scheduled', 'Quality Grade': 'Grade B', 'Inspector': 'S. Chen' },
  ];

  const reference: WorkbookData = {
    id: 'wb_ref_sample',
    name: 'Master_Procurement_Catalog_2026.xlsx',
    size: 45200,
    lastModified: Date.now() - 86400000 * 3,
    headers: Object.keys(refRows[0]),
    rows: refRows,
    sheetNames: ['Master Catalog'],
    activeSheet: 'Master Catalog',
  };

  const comparison: WorkbookData = {
    id: 'wb_comp_sample',
    name: 'Incoming_Receiving_Batch_Report.xlsx',
    size: 28400,
    lastModified: Date.now(),
    headers: Object.keys(compRows[0]),
    rows: compRows,
    sheetNames: ['Receiving Inspections'],
    activeSheet: 'Receiving Inspections',
  };

  return { reference, comparison };
}
