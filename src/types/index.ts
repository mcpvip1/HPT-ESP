export type Language = 'en' | 'my' | 'th' | 'zh';

export type ExcelRow = Record<string, any>;

export interface WorkbookData {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  headers: string[];
  rows: ExcelRow[];
  sheetNames: string[];
  activeSheet: string;
  sheets?: Record<string, { headers: string[]; rows: ExcelRow[] }>;
}

export interface ColumnMapping {
  id: string;
  mainCol: string;
  comparisonCol: string;
}

export interface NormalizationRules {
  trimSpaces: boolean;
  ignoreCase: boolean;
  removeSpacesAndHyphens: boolean;
  ignoreLeadingZeros: boolean;
}

export type RuleCondition =
  | 'contains'
  | 'equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than';

export type ResultColor = 'green' | 'yellow' | 'red' | 'blue' | 'purple';

export interface ValueRule {
  id: string;
  targetColumn?: 'primary' | 'secondary' | 'any';
  condition: RuleCondition;
  value: string;
  secondaryCondition?: RuleCondition;
  secondaryValue?: string;
  color: ResultColor;
  label: string;
  requireSameCellFill?: boolean;
}

export interface DecisionLayer {
  id: string;
  name: string;
  source: 'main' | 'comparison' | 'merged';
  primaryColumn: string;
  secondaryColumn?: string;
  matchLogic?: 'and' | 'or';
  rules: ValueRule[];
  fallbackToOriginalFill: boolean;
  fallbackColor?: ResultColor | 'none';
}

export interface UnmatchedFieldDiff {
  comparisonCol: string;
  mainCol: string;
  compValue: any;
  refValue?: any;
  isMatch: boolean;
}

export interface UnmatchedInfo {
  unmatchedKeyDisplay: string;
  primaryIdentifier: string;
  reason: string;
  matchType: 'completely_missing' | 'partial_mismatch' | 'no_key';
  fieldDiffs: UnmatchedFieldDiff[];
  closestReferenceRow?: ExcelRow;
}

export interface ReconciledPostponeInfo {
  originalPostponeColumn?: string;
  originalPostponeValue?: string;
  acceptedPeerRowIndex?: number;
  acceptedPeerKey?: string;
  source?: string;
}

export interface MatchedRow {
  id: string;
  rowIndex: number;
  matchKey: string;
  isMatched: boolean;
  unmatchedInfo?: UnmatchedInfo;
  matchedMainRow?: ExcelRow;
  comparisonRow: ExcelRow;
  decisionColor: ResultColor | 'none';
  decisionReason: string;
  decisionLayerName?: string;
  mergedRow: ExcelRow;
  supersededByAccept?: boolean;
  reconciledPostponeInfo?: ReconciledPostponeInfo;
}

export interface MatchingStats {
  totalIncoming: number;
  matchedCount: number;
  unmatchedCount: number;
  matchRate: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  otherCount: number;
  unmatchedItems?: { rowIndex: number; identifier: string; reason: string }[];
}

export interface ColumnConfigItem {
  id: string;
  label: string;
  category: 'system' | 'data' | 'reference';
  showInTable: boolean;
  showInExport: boolean;
}

export interface SavedMappingPreset {
  id: string;
  name: string;
  createdAt: number;
  mappings: { mainCol: string; comparisonCol: string }[];
  description?: string;
}

export interface SavedDecisionPreset {
  id: string;
  name: string;
  createdAt: number;
  layers: DecisionLayer[];
  description?: string;
}
