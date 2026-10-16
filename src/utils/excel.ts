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

  const sheetsData: Record<string, { headers: string[]; rows: ExcelRow[] }> = {};

  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sName = sheetNames[sIdx];
    const worksheet = workbook.Sheets[sName];
    if (!worksheet) {
      sheetsData[sName] = { headers: [], rows: [] };
      continue;
    }

    const pct = 40 + Math.round(((sIdx + 0.3) / sheetNames.length) * 50);
    onProgress?.(pct, `Reading sheet "${sName}" (${sIdx + 1} of ${sheetNames.length})...`);
    await new Promise((r) => setTimeout(r, 0));

    // Critical fix: clamp range to prevent SheetJS from iterating 1,048,576 rows
    clampWorksheetRange(worksheet);

    // Convert to 2D array with blankrows omitted
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      raw: true,
    });

    if (!rawRows || rawRows.length === 0) {
      sheetsData[sName] = { headers: [], rows: [] };
      continue;
    }

    // Header row is index 0
    const headerRow: string[] = (rawRows[0] || []).map((h: any, idx: number) => {
      const str = h !== undefined && h !== null ? String(h).trim() : '';
      return str !== '' ? str : `Column_${idx + 1}`;
    });

    const totalRaw = rawRows.length;
    const rows: ExcelRow[] = [];

    // Non-blocking row conversion
    for (let r = 1; r < totalRaw; r++) {
      if (r % 800 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const rowArray = rawRows[r];
      if (!rowArray || rowArray.length === 0) continue;

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

    sheetsData[sName] = { headers: headerRow, rows };
  }

  // Pick first sheet that contains data, or first sheet by default
  const activeSheet =
    sheetNames.find((name) => (sheetsData[name]?.rows.length || 0) > 0) || sheetNames[0];
  const activeData = sheetsData[activeSheet] || { headers: [], rows: [] };

  onProgress?.(100, 'Done');

  return {
    id: `wb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    headers: activeData.headers,
    rows: activeData.rows,
    sheetNames,
    activeSheet,
    sheets: sheetsData,
  };
}

/**
 * Switches the active sheet of a WorkbookData object to a new sheet name.
 * Updates headers and rows to match the selected sheet's structure.
 */
export function changeWorkbookSheet(wb: WorkbookData, targetSheet: string): WorkbookData {
  if (!wb.sheets) {
    return {
      ...wb,
      activeSheet: targetSheet,
    };
  }

  const sheetData = wb.sheets[targetSheet];
  if (!sheetData) {
    return {
      ...wb,
      activeSheet: targetSheet,
    };
  }

  return {
    ...wb,
    activeSheet: targetSheet,
    headers: sheetData.headers,
    rows: sheetData.rows,
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

  // Build key map for reference workbook (preferring Accept/Waive rows on duplicates)
  const mainKeyMap = new Map<string, ExcelRow>();
  for (let i = 0; i < mainWb.rows.length; i++) {
    const row = mainWb.rows[i];
    const key = generateRowKey(row, mainCols, normalization);
    if (!key) continue;
    const existing = mainKeyMap.get(key);
    if (!existing) {
      mainKeyMap.set(key, row);
    } else {
      const rowHasAccept = Object.values(row).some((v) => {
        const s = String(v ?? '').toLowerCase();
        return s.includes('accept') || s.includes('waive');
      });
      const existingHasAccept = Object.values(existing).some((v) => {
        const s = String(v ?? '').toLowerCase();
        return s.includes('accept') || s.includes('waive');
      });
      if (rowHasAccept && !existingHasAccept) {
        mainKeyMap.set(key, row);
      }
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

  // Postpone vs Accept Same-Key Inspection Logic:
  // "when filter if found postpone in Inspection Status or Inspection Result row if the data see the postpone
  // need to check another row have same key but Inspection Status or Inspection Result row have accept
  // only take accept no need to show yellow only show yellow when accept no have"
  const keyGroups = new Map<string, MatchedRow[]>();

  const getRowKeys = (r: MatchedRow): string[] => {
    const keys: string[] = [];
    if (r.matchKey && r.matchKey.trim() !== '') {
      keys.push(`mk:${r.matchKey.trim().toLowerCase()}`);
    }
    // Also extract primary PO / Item / Material / Lot identifiers from comparisonRow
    for (const [colName, val] of Object.entries(r.comparisonRow)) {
      const cleanCol = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        cleanCol === 'po' ||
        cleanCol === 'ponumber' ||
        cleanCol === 'purchaseorder' ||
        cleanCol === 'orderid' ||
        cleanCol === 'material' ||
        cleanCol === 'materialcode' ||
        cleanCol === 'item' ||
        cleanCol === 'itemcode' ||
        cleanCol === 'partnumber' ||
        cleanCol === 'lot' ||
        cleanCol === 'lotno' ||
        cleanCol === 'lotnumber'
      ) {
        const strVal = String(val ?? '').trim().toLowerCase();
        if (strVal && strVal !== '-') {
          keys.push(`${cleanCol}:${strVal}`);
        }
      }
    }
    return keys;
  };

  const hasInspectionTerm = (rowObj: ExcelRow | undefined, term: string): boolean => {
    if (!rowObj) return false;
    const target = term.toLowerCase();
    for (const [colName, val] of Object.entries(rowObj)) {
      const cleanCol = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        cleanCol.includes('inspection') ||
        cleanCol.includes('status') ||
        cleanCol.includes('result') ||
        cleanCol.includes('decision')
      ) {
        const valStr = String(val ?? '').toLowerCase();
        if (valStr.includes(target)) return true;
      }
    }
    return false;
  };

  for (const r of results) {
    const rKeys = getRowKeys(r);
    for (const k of rKeys) {
      if (!keyGroups.has(k)) {
        keyGroups.set(k, []);
      }
      if (!keyGroups.get(k)!.includes(r)) {
        keyGroups.get(k)!.push(r);
      }
    }
  }

  // Evaluate each row for the Postpone / Accept rule
  for (const r of results) {
    const rKeys = getRowKeys(r);
    const hasPostpone =
      hasInspectionTerm(r.comparisonRow, 'postpone') ||
      hasInspectionTerm(r.matchedMainRow, 'postpone') ||
      (r.decisionReason && r.decisionReason.toLowerCase().includes('postpone'));

    if (hasPostpone) {
      // Find all peer rows with the same key
      const peerRows = new Set<MatchedRow>();
      for (const k of rKeys) {
        const peers = keyGroups.get(k) || [];
        for (const peer of peers) {
          if (peer !== r) peerRows.add(peer);
        }
      }

      // Check if ANY peer row or matched reference has Accept or Waive
      let hasAcceptInGroup = false;
      let acceptedPeer: MatchedRow | undefined;
      let acceptedFromRef = false;

      // Check matched reference row
      if (
        hasInspectionTerm(r.matchedMainRow, 'accept') ||
        hasInspectionTerm(r.matchedMainRow, 'waive')
      ) {
        hasAcceptInGroup = true;
        acceptedFromRef = true;
      }

      // Check peer comparison rows
      if (!hasAcceptInGroup) {
        for (const peer of peerRows) {
          if (
            peer.decisionColor === 'green' ||
            hasInspectionTerm(peer.comparisonRow, 'accept') ||
            hasInspectionTerm(peer.comparisonRow, 'waive') ||
            hasInspectionTerm(peer.matchedMainRow, 'accept') ||
            hasInspectionTerm(peer.matchedMainRow, 'waive')
          ) {
            hasAcceptInGroup = true;
            acceptedPeer = peer;
            break;
          }
        }
      }

      if (hasAcceptInGroup) {
        // "only take accept no need to show yellow"
        // User requirement: "remember decision status must be passed Match status must be matched that rule can not be broken"
        r.decisionColor = 'green';
        r.decisionReason = `Accept (Duplicate key: Postpone overridden by Accept ${acceptedFromRef ? 'from Reference File' : `from Row #${acceptedPeer?.rowIndex ?? 'duplicate'}`})`;
        r.supersededByAccept = true;
        r.isMatched = true;
        r.unmatchedInfo = undefined;

        let origCol = '';
        let origVal = '';
        for (const [colName, val] of Object.entries(r.comparisonRow)) {
          const s = String(val ?? '').toLowerCase();
          if (s.includes('postpone')) {
            origCol = colName;
            origVal = String(val);
            break;
          }
        }

        r.reconciledPostponeInfo = {
          originalPostponeColumn: origCol || 'Inspection Status',
          originalPostponeValue: origVal || 'Postpone',
          acceptedPeerRowIndex: acceptedPeer?.rowIndex,
          acceptedPeerKey: r.matchKey,
          source: acceptedFromRef
            ? 'Master Reference'
            : (acceptedPeer ? `Row #${acceptedPeer.rowIndex} (${acceptedPeer.comparisonRow['Inspection Status'] || 'Accept'})` : 'Duplicate Record'),
        };

        if (!r.matchedMainRow) {
          for (const peer of peerRows) {
            if (peer.matchedMainRow) {
              r.matchedMainRow = peer.matchedMainRow;
              break;
            }
          }
        }

        // Replace any postpone status in comparisonRow and mergedRow with Accept
        for (const [colName, val] of Object.entries(r.comparisonRow)) {
          const s = String(val ?? '').toLowerCase();
          if (s.includes('postpone')) {
            r.comparisonRow[colName] = 'Accept';
            if (r.mergedRow) {
              r.mergedRow[colName] = 'Accept';
            }
          }
        }
      } else {
        // "only show yellow when accept no have"
        r.decisionColor = 'yellow';
        r.decisionReason = 'Postpone (Review required: No Accept record found for this key)';
      }
    }
  }

  // Also resolve any general duplicate key groups where ANY row has Accept
  for (const [, groupRows] of keyGroups.entries()) {
    if (groupRows.length > 1) {
      const anyAccept = groupRows.some((r) => {
        if (r.decisionColor === 'green') return true;
        const inReason = (r.decisionReason || '').toLowerCase();
        if (inReason.includes('accept') || inReason.includes('waive') || inReason.includes('green') || inReason.includes('pass')) return true;
        return hasInspectionTerm(r.comparisonRow, 'accept') || hasInspectionTerm(r.matchedMainRow, 'accept');
      });

      if (anyAccept) {
        for (const r of groupRows) {
          if (r.decisionColor !== 'red') {
            r.decisionColor = 'green';
            r.isMatched = true;
            r.unmatchedInfo = undefined;
            r.decisionReason = 'Accept (Duplicate key: Accept status takes precedence)';
            if (!r.matchedMainRow) {
              for (const peer of groupRows) {
                if (peer.matchedMainRow) {
                  r.matchedMainRow = peer.matchedMainRow;
                  break;
                }
              }
            }
            for (const [colName, val] of Object.entries(r.comparisonRow)) {
              const s = String(val ?? '').toLowerCase();
              if (s.includes('postpone') || s.includes('pending') || s.includes('hold')) {
                r.comparisonRow[colName] = 'Accept';
                if (r.mergedRow) {
                  r.mergedRow[colName] = 'Accept';
                }
              }
            }
          }
        }
      }
    }
  }

  // Recalculate stats accurately after duplicate resolution
  greenCount = 0;
  yellowCount = 0;
  redCount = 0;
  otherCount = 0;
  let finalMatchedCount = 0;
  for (const r of results) {
    if (r.isMatched) finalMatchedCount++;
    if (r.decisionColor === 'green') greenCount++;
    else if (r.decisionColor === 'yellow') yellowCount++;
    else if (r.decisionColor === 'red') redCount++;
    else otherCount++;
  }

  const totalIncoming = compWb.rows.length;
  matchedCount = finalMatchedCount;
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
  _stats?: MatchingStats,
  baseFilename: string = 'Excel_Matching_Output',
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

  // Column order mirrors the dashboard's customized column sequence
  // (exportColumnIds), so [Ref] columns land exactly where the user placed
  // them in the table — e.g. [Ref] Inspection Status right after Inspection Status.
  const orderedColumns: { id: string; header: string }[] = [];
  if (exportColumnIds && exportColumnIds.length > 0) {
    for (const id of exportColumnIds) {
      if (id === 'rowIndex') orderedColumns.push({ id, header: 'Row #' });
      else if (id === 'decisionStatus') orderedColumns.push({ id, header: 'Decision Outcome' });
      else if (id === 'resultColor') orderedColumns.push({ id, header: 'Result Color' });
      else if (id === 'matchStatus') orderedColumns.push({ id, header: 'Match Status' });
      else if (id === 'decisionReason') orderedColumns.push({ id, header: 'Evaluation Reason' });
      else if (id.startsWith('[Ref] ')) orderedColumns.push({ id, header: id });
      else orderedColumns.push({ id, header: id });
    }
  } else {
    // Fallback: dashboard default order (Row #, comparison, [Ref], decisions)
    orderedColumns.push({ id: 'rowIndex', header: 'Row #' });
    for (const h of compHeaders) orderedColumns.push({ id: h, header: h });
    const seenRef = new Set<string>();
    for (const item of results) {
      if (item.matchedMainRow) {
        for (const k of Object.keys(item.matchedMainRow)) {
          if (!compHeaders.includes(k) && !seenRef.has(k)) {
            seenRef.add(k);
            orderedColumns.push({ id: `[Ref] ${k}`, header: `[Ref] ${k}` });
          }
        }
      }
    }
    orderedColumns.push({ id: 'decisionStatus', header: 'Decision Outcome' });
    orderedColumns.push({ id: 'resultColor', header: 'Result Color' });
    orderedColumns.push({ id: 'matchStatus', header: 'Match Status' });
    orderedColumns.push({ id: 'decisionReason', header: 'Evaluation Reason' });
  }

  const cellValueFor = (item: (typeof results)[number], id: string): any => {
    if (id === 'rowIndex') return item.rowIndex;
    if (id === 'decisionStatus') {
      return item.decisionColor === 'green'
        ? 'PASSED / ACCEPTED'
        : item.decisionColor === 'yellow'
        ? 'REVIEW REQUIRED'
        : item.decisionColor === 'red'
        ? 'REJECTED'
        : 'NO ACTION';
    }
    if (id === 'resultColor') return item.decisionColor.toUpperCase();
    if (id === 'matchStatus') {
      return item.isMatched
        ? 'MATCHED'
        : `UNMATCHED: ${item.unmatchedInfo?.primaryIdentifier || item.matchKey} — ${item.unmatchedInfo?.reason || 'Not in Reference'}`;
    }
    if (id === 'decisionReason') return item.decisionReason;
    if (id.startsWith('[Ref] ')) {
      return item.matchedMainRow?.[id.replace('[Ref] ', '')] ?? '';
    }
    return item.comparisonRow[id] ?? '';
  };

  // Evaluated Results Sheet
  const resultRows = results.map((item) => {
    const rowObj: Record<string, any> = {};
    for (const col of orderedColumns) {
      rowObj[col.header] = cellValueFor(item, col.id);
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

  // Style Header Row (Row 0) — [Ref] columns get a blue fill mirroring the
  // dashboard's Ref badge/tint so reference data is instantly recognizable.
  dataHeaders.forEach((header, cIdx) => {
    const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: cIdx });
    if (wsData[cellRef]) {
      const isCenter = ['Row #', 'Decision Outcome', 'Result Color', 'Match Status'].includes(header);
      const isRefCol = header.startsWith('[Ref] ');
      wsData[cellRef].s = {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: isRefCol ? '1D4ED8' : '1E293B' } },
        alignment: { vertical: 'center', horizontal: isCenter ? 'center' : 'left' },
        border: thinBorder(isRefCol ? '1E40AF' : '0F172A'),
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
      ? '10B981' // Vibrant Emerald
      : isYellow
      ? 'F59E0B' // Vibrant Amber
      : isRed
      ? 'EF4444' // Vibrant Crimson
      : '64748B'; // Slate

    const rowBgTint = isGreen
      ? 'D1FAE5' // Saturated Light Emerald
      : isYellow
      ? 'FEF3C7' // Saturated Light Amber
      : isRed
      ? 'FEE2E2' // Saturated Light Crimson
      : rIdx % 2 === 0
      ? 'F8FAFC'
      : 'FFFFFF';

    const rowBorderColor = isGreen
      ? '6EE7B7'
      : isYellow
      ? 'FCD34D'
      : isRed
      ? 'FCA5A5'
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
        const headerLower = colHeader.toLowerCase();
        // Same "inspection column" rule as the dashboard: status/result/grade
        // columns render as solid filled badges (white bold text), for both
        // incoming and [Ref] columns.
        const isInspectionCol =
          headerLower.includes('status') || headerLower.includes('result') || headerLower.includes('grade');
        const badgeGreen =
          strVal.includes('accept') || strVal.includes('waive') ||
          strVal.includes('certified ok') || strVal.includes('normal');
        const badgeAmber =
          strVal.includes('postpone') || strVal.includes('pending') || strVal.includes('hold') ||
          strVal.includes('review') || strVal.includes('quarantine');
        const badgeRed =
          strVal.includes('reject') || strVal.includes('fail') ||
          strVal.includes('discrepant') || strVal.includes('out of spec');

        if (isInspectionCol && (badgeGreen || badgeAmber || badgeRed)) {
          const badgeFill = badgeGreen ? '059669' : badgeAmber ? 'D97706' : 'DC2626';
          cell.s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { patternType: 'solid', fgColor: { rgb: badgeFill } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: thinBorder(badgeFill),
          };
        } else if (badgeGreen || badgeAmber || badgeRed) {
          // Non-inspection columns keep the lighter tint treatment
          const tintFill = badgeGreen ? 'D1FAE5' : badgeAmber ? 'FEF3C7' : 'FEE2E2';
          const tintText = badgeGreen ? '065F46' : badgeAmber ? '92400E' : '991B1B';
          const tintBorder = badgeGreen ? '059669' : badgeAmber ? 'D97706' : 'DC2626';
          cell.s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: tintText } },
            fill: { patternType: 'solid', fgColor: { rgb: tintFill } },
            alignment: { vertical: 'center', horizontal: typeof cell.v === 'number' ? 'right' : 'left' },
            border: thinBorder(tintBorder),
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
  // Column order mirrors the dashboard's customized column sequence
  const csvValueFor = (item: (typeof results)[number], id: string): any => {
    if (id === 'rowIndex') return item.rowIndex;
    if (id === 'decisionStatus') return item.decisionColor.toUpperCase();
    if (id === 'matchStatus') {
      return item.isMatched
        ? 'MATCHED'
        : `UNMATCHED: ${item.unmatchedInfo?.primaryIdentifier || item.matchKey} — ${item.unmatchedInfo?.reason || 'Not in Reference'}`;
    }
    if (id === 'decisionReason') return item.decisionReason;
    if (id.startsWith('[Ref] ')) {
      return item.matchedMainRow?.[id.replace('[Ref] ', '')] ?? '';
    }
    return item.comparisonRow[id] ?? '';
  };

  const csvHeaderFor = (id: string): string => {
    if (id === 'rowIndex') return 'Row';
    if (id === 'decisionStatus') return 'Decision Outcome';
    if (id === 'matchStatus') return 'Reference Match';
    if (id === 'decisionReason') return 'Reason';
    return id;
  };

  const csvColumns: string[] =
    exportColumnIds && exportColumnIds.length > 0
      ? exportColumnIds
      : [
          'rowIndex',
          ...compHeaders,
          ...Array.from(
            new Set(
              results.flatMap((r) =>
                r.matchedMainRow
                  ? Object.keys(r.matchedMainRow)
                      .filter((k) => !compHeaders.includes(k))
                      .map((k) => `[Ref] ${k}`)
                  : []
              )
            )
          ),
          'decisionStatus',
          'matchStatus',
          'decisionReason',
        ];

  const resultRows = results.map((item) => {
    const rowObj: Record<string, any> = {};
    for (const id of csvColumns) {
      rowObj[csvHeaderFor(id)] = csvValueFor(item, id);
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
    { 'PO Number': 'PO-8816', 'Part Number': 'CMP-116-P', 'Batch Number': 'LOT-2026-16', 'Supplier Name': 'Apex Industrial Co.', 'Unit Cost': 165.0, 'Target Tolerance': '±0.02mm', 'Inspection Status': 'Accept', 'Quality Grade': 'Grade A', 'Warehouse Location': 'Bay-06-A' },
    { 'PO Number': 'PO-8817', 'Part Number': 'CMP-117-Q', 'Batch Number': 'LOT-2026-17', 'Supplier Name': 'Precision Micro LLC', 'Unit Cost': 92.0, 'Target Tolerance': '±0.05mm', 'Inspection Status': 'Postpone', 'Quality Grade': 'Grade B', 'Warehouse Location': 'Bay-06-B' },
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
    { 'Purchase Order': 'PO-8816', 'Item Code': 'CMP-116-P', 'Lot No': 'LOT-2026-16', 'Vendor': 'Apex Industrial Co.', 'Received Qty': 450, 'Inspection Status': 'Postpone', 'Inspection Result': 'Postponed - Pending Re-check', 'Quality Grade': 'Grade B', 'Inspector': 'J. Miller' },
    { 'Purchase Order': 'PO-8816', 'Item Code': 'CMP-116-P', 'Lot No': 'LOT-2026-16', 'Vendor': 'Apex Industrial Co.', 'Received Qty': 450, 'Inspection Status': 'Accept', 'Inspection Result': 'Accept - Re-inspection Passed', 'Quality Grade': 'Grade A', 'Inspector': 'A. Patel' },
    { 'Purchase Order': 'PO-8817', 'Item Code': 'CMP-117-Q', 'Lot No': 'LOT-2026-17', 'Vendor': 'Precision Micro LLC', 'Received Qty': 280, 'Inspection Status': 'Postpone', 'Inspection Result': 'Postponed - Awaiting Waiver', 'Quality Grade': 'Grade B', 'Inspector': 'S. Chen' },
  ];

  // Sheet 2 for Main Reference File (Different columns & rows: QA Supplier Audit)
  const refQaBatchRows: ExcelRow[] = [
    { 'PO Number': 'PO-8801', 'Part Number': 'CMP-101-A', 'Supplier Name': 'Apex Industrial Co.', 'Inspection Status': 'Waive', 'Inspection Result': 'Normal', 'Audit Grade': 'ISO-Pass', 'Inspector ID': 'AUD-01' },
    { 'PO Number': 'PO-8802', 'Part Number': 'CMP-102-B', 'Supplier Name': 'Precision Micro LLC', 'Inspection Status': 'Pending', 'Inspection Result': 'Accept', 'Audit Grade': 'Standard', 'Inspector ID': 'AUD-02' },
    { 'PO Number': 'PO-8803', 'Part Number': 'CMP-103-C', 'Supplier Name': 'Titan Fasteners Corp', 'Inspection Status': 'Waive', 'Inspection Result': 'Special Approval', 'Audit Grade': 'High Precision', 'Inspector ID': 'AUD-01' },
    { 'PO Number': 'PO-8805', 'Part Number': 'CMP-105-E', 'Supplier Name': 'Silicon Global Tech', 'Inspection Status': 'Accept', 'Inspection Result': 'Verified', 'Audit Grade': 'Mil-Spec', 'Inspector ID': 'AUD-03' },
    { 'PO Number': 'PO-8807', 'Part Number': 'CMP-107-G', 'Supplier Name': 'Nordic Aero Parts', 'Inspection Status': 'Waive', 'Inspection Result': 'Expedited', 'Audit Grade': 'Aviation-OK', 'Inspector ID': 'AUD-04' },
    { 'PO Number': 'PO-8809', 'Part Number': 'CMP-109-I', 'Supplier Name': 'Vertex Dynamics', 'Inspection Status': 'Accept', 'Inspection Result': 'Certified OK', 'Audit Grade': 'Standard', 'Inspector ID': 'AUD-02' },
    { 'PO Number': 'PO-8816', 'Part Number': 'CMP-116-P', 'Supplier Name': 'Apex Industrial Co.', 'Inspection Status': 'Accept', 'Inspection Result': 'Accept - Re-inspection Passed', 'Audit Grade': 'Re-tested', 'Inspector ID': 'AUD-01' },
    { 'PO Number': 'PO-8817', 'Part Number': 'CMP-117-Q', 'Supplier Name': 'Precision Micro LLC', 'Inspection Status': 'Postpone', 'Inspection Result': 'Postponed - Awaiting Waiver', 'Audit Grade': 'Pending-Review', 'Inspector ID': 'AUD-05' },
  ];

  // Sheet 3 for Main Reference File (Different columns & rows: Inventory Bin Specs)
  const refInventoryRows: ExcelRow[] = [
    { 'Part Number': 'CMP-101-A', 'Warehouse Location': 'Bay-01-A', 'Bin Code': 'BIN-A1', 'Stock Level': 1250, 'Reorder Point': 300, 'Unit Weight': '0.45 kg' },
    { 'Part Number': 'CMP-102-B', 'Warehouse Location': 'Bay-01-B', 'Bin Code': 'BIN-A2', 'Stock Level': 480, 'Reorder Point': 150, 'Unit Weight': '0.12 kg' },
    { 'Part Number': 'CMP-103-C', 'Warehouse Location': 'Bay-02-A', 'Bin Code': 'BIN-B1', 'Stock Level': 890, 'Reorder Point': 200, 'Unit Weight': '1.05 kg' },
    { 'Part Number': 'CMP-105-E', 'Warehouse Location': 'Bay-03-A', 'Bin Code': 'BIN-C1', 'Stock Level': 320, 'Reorder Point': 80, 'Unit Weight': '0.08 kg' },
    { 'Part Number': 'CMP-116-P', 'Warehouse Location': 'Bay-06-A', 'Bin Code': 'BIN-F1', 'Stock Level': 750, 'Reorder Point': 250, 'Unit Weight': '0.62 kg' },
  ];

  // Sheet 2 for Incoming Comparison File (Express Logistics)
  const compExpressRows: ExcelRow[] = [
    { 'Purchase Order': 'PO-8801', 'Item Code': 'CMP-101-A', 'Airway Bill': 'AWB-9021', 'Inspection Status': 'Waive', 'Inspection Result': 'Normal', 'Carrier': 'FedEx Express', 'Priority': 'Urgent' },
    { 'Purchase Order': 'PO-8805', 'Item Code': 'CMP-105-E', 'Airway Bill': 'AWB-9022', 'Inspection Status': 'Accept', 'Inspection Result': 'Verified', 'Carrier': 'DHL Global', 'Priority': 'Critical' },
    { 'Purchase Order': 'PO-8807', 'Item Code': 'CMP-107-G', 'Airway Bill': 'AWB-9023', 'Inspection Status': 'Waive', 'Inspection Result': 'Expedited', 'Carrier': 'UPS Worldwide', 'Priority': 'Urgent' },
    { 'Purchase Order': 'PO-8816', 'Item Code': 'CMP-116-P', 'Airway Bill': 'AWB-9024', 'Inspection Status': 'Accept', 'Inspection Result': 'Accept - Re-inspection Passed', 'Carrier': 'FedEx Express', 'Priority': 'Standard' },
  ];

  const refSheetNames = [
    'Master Catalog',
    'Secondary Supplier QA Batch',
    'Archive Inventory Records',
  ];

  const refSheets = {
    'Master Catalog': { headers: Object.keys(refRows[0]), rows: refRows },
    'Secondary Supplier QA Batch': { headers: Object.keys(refQaBatchRows[0]), rows: refQaBatchRows },
    'Archive Inventory Records': { headers: Object.keys(refInventoryRows[0]), rows: refInventoryRows },
  };

  const compSheetNames = [
    'Receiving Inspections',
    'Express Logistics Dispatch',
  ];

  const compSheets = {
    'Receiving Inspections': { headers: Object.keys(compRows[0]), rows: compRows },
    'Express Logistics Dispatch': { headers: Object.keys(compExpressRows[0]), rows: compExpressRows },
  };

  const reference: WorkbookData = {
    id: 'wb_ref_sample',
    name: 'Master_Procurement_Catalog_2026.xlsx',
    size: 45200,
    lastModified: Date.now() - 86400000 * 3,
    headers: refSheets['Master Catalog'].headers,
    rows: refSheets['Master Catalog'].rows,
    sheetNames: refSheetNames,
    activeSheet: 'Master Catalog',
    sheets: refSheets,
  };

  const comparison: WorkbookData = {
    id: 'wb_comp_sample',
    name: 'Incoming_Receiving_Batch_Report.xlsx',
    size: 28400,
    lastModified: Date.now(),
    headers: compSheets['Receiving Inspections'].headers,
    rows: compSheets['Receiving Inspections'].rows,
    sheetNames: compSheetNames,
    activeSheet: 'Receiving Inspections',
    sheets: compSheets,
  };

  return { reference, comparison };
}
