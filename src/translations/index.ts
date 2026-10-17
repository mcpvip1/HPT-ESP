import { Language } from '../types';

export interface TranslationDict {
  appName: string;
  appSubtitle: string;
  step1: string;
  step2: string;
  step3: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  referenceFile: string;
  incomingFile: string;
  savedLocally: string;
  lastUpdated: string;
  totalRows: string;
  totalCols: string;
  previewData: string;
  replaceFile: string;
  resetReference: string;
  uploadRefPrompt: string;
  uploadCompPrompt: string;
  dropFileHere: string;
  browseFiles: string;
  supportedFormats: string;
  loadDemoData: string;
  clearAll: string;
  columnMappings: string;
  columnMappingsDesc: string;
  mainColumn: string;
  compColumn: string;
  addMapping: string;
  autoMap: string;
  noMappingsYet: string;
  normalizationOptions: string;
  trimSpaces: string;
  trimSpacesDesc: string;
  ignoreCase: string;
  ignoreCaseDesc: string;
  removeHyphens: string;
  removeHyphensDesc: string;
  ignoreLeadingZeros: string;
  ignoreLeadingZerosDesc: string;
  trimPunctuation: string;
  trimPunctuationDesc: string;
  decisionLayers: string;
  decisionLayersDesc: string;
  addLayer: string;
  moveUp: string;
  moveDown: string;
  deleteLayer: string;
  readValuesFrom: string;
  mainDataset: string;
  compDataset: string;
  mergedDataset: string;
  decisionColumn: string;
  secondaryColumn: string;
  enableMultiColumn: string;
  columnReady: string;
  columnMissing: string;
  valueRules: string;
  addRule: string;
  condition: string;
  inputValue: string;
  resultColor: string;
  greenColor: string;
  yellowColor: string;
  redColor: string;
  requireCellFill: string;
  fallbackRule: string;
  fallbackDesc: string;
  runMatching: string;
  matchingInProgress: string;
  kpiTotalRows: string;
  kpiPassed: string;
  kpiReview: string;
  kpiRejected: string;
  kpiMatchRate: string;
  filterAll: string;
  filterGreen: string;
  filterYellow: string;
  filterRed: string;
  filterUnmatched: string;
  filterBlue: string;
  searchPlaceholder: string;
  exportExcel: string;
  exportCsv: string;
  exporting: string;
  showingRows: string;
  of: string;
  rowsPerPage: string;
  prevPage: string;
  nextPage: string;
  noResultsFound: string;
  matchedStatus: string;
  matched: string;
  unmatched: string;
  reason: string;
  decisionLayer: string;
  viewDetails: string;
  rowDetails: string;
  modalInspectionTitle: string;
  modalMatchKey: string;
  modalNotAvailable: string;
  modalUnmatchedAnalysis: string;
  modalWhichUnmatched: string;
  modalThisRecord: string;
  modalPartialMismatch: string;
  modalMissingInRef: string;
  modalReason: string;
  modalIncomingKeyValues: string;
  modalKeyColStatus: string;
  modalMatch: string;
  modalDiffer: string;
  modalIncoming: string;
  modalReference: string;
  modalNotFound: string;
  modalMatchedSuccess: string;
  modalDecision: string;
  modalReconciledCase: string;
  modalReconcileTitle: string;
  modalReconcileBody: string;
  modalOverridingSource: string;
  modalIncomingRecord: string;
  modalRowNum: string;
  modalMismatch: string;
  modalMatchedRefRecord: string;
  modalClosestCandidate: string;
  modalRefRecord: string;
  modalPartialMatch: string;
  modalClosestDesc: string;
  modalMatchedBadge: string;
  modalDiffersBadge: string;
  modalZeroMatch: string;
  modalZeroMatchDesc: string;
  modalStatus: string;
  modalMatched: string;
  modalUnmatchedNew: string;
  modalLayer: string;
  shareTitle: string;
  shareDesc: string;
  shareWhatSee: string;
  shareBullet1: string;
  shareBullet2: string;
  shareBullet3: string;
  shareFilterConfig: string;
  sharePreselectFilter: string;
  shareFilterAll: string;
  shareFilterGreen: string;
  shareFilterYellow: string;
  shareFilterRed: string;
  shareFilterUnmatched: string;
  shareFilterBlue: string;
  shareIncludeSearch: string;
  shareLinkLabel: string;
  shareChars: string;
  shareCopyLink: string;
  shareCopied: string;
  shareCompressedNote: string;
  shareDownloadHtml: string;
  shareTestNow: string;
  shareCopiedToast: string;
  shareCopyFailToast: string;
  shareHtmlToast: string;
  colTitle: string;
  colBadge: string;
  colDesc: string;
  colSearchPh: string;
  colSyncExport: string;
  colTabAll: string;
  colTabData: string;
  colTabRef: string;
  colTabSystem: string;
  colShowAll: string;
  colKeyOnly: string;
  colReset: string;
  colOrderName: string;
  colTable: string;
  colExport: string;
  colExcelExport: string;
  colAll: string;
  colNone: string;
  colNoMatch: string;
  colNoCols: string;
  colClearFilter: string;
  colRestoreAll: string;
  colActiveSummary: string;
  colSaveSync: string;
  colMoveUp: string;
  colMoveDown: string;
  colClearSearch: string;
  colToggleAllTable: string;
  colToggleAllExport: string;
  colKeepDecision: string;
  colRestoreDefaults: string;
  colAudit: string;
  colRef: string;
  colKeyRule: string;
  dpSheet: string;
  dpRows: string;
  dpColumns: string;
  dpSelectSheet: string;
  dpShowing: string;
  searchDataCells: string;
  toastCloudRulesSynced: string;
  toastCloudFilesSynced: string;
  toastCloudResultsSynced: string;
  gateTitle: string;
  gateDesc: string;
  gateSignIn: string;
  cloudDownloading: string;
  cloudDownloadingSub: string;
  toastCloudFilesUploaded: string;
  toastCloudSettingsUploaded: string;
  toastCloudSettingsSyncFailed: string;
  toastCloudResultsUploaded: string;
  toastCloudResultsSyncFailed: string;
  syncUploading: string;
  syncPanelTitle: string;
  syncAllSynced: string;
  syncHistory: string;
  syncClearHistory: string;
  syncNoHistory: string;
  syncFilesLabel: string;
  syncSettingsLabel: string;
  syncResultsLabel: string;
  syncReasonMappings: string;
  syncReasonNormalization: string;
  syncReasonLayers: string;
  syncReasonHold: string;
  toastCloudFilesSyncFailed: string;
  toastShareRevoked: string;
  toastPreviewSynced: string;
  toastSignInFailed: string;
  toastSignedOut: string;
  toastRefLoadedRegen: string;
  toastCompImported: string;
  toastRefSheetSwitched: string;
  toastRefSheetSwitchedDone: string;
  toastCompSheetSwitched: string;
  toastCompSheetSwitchedDone: string;
  toastExitedPreview: string;
  toastRulesSaved: string;
  toastSampleLoaded: string;
  toastBothFilesRequired: string;
  toastMappingRequired: string;
  toastEvaluatedSummary: string;
  toastMatchingError: string;
  toastPreviewRefreshed: string;
  previewNoResultsTitle: string;
  previewNoResultsDesc: string;
  previewDownloading: string;
  previewPleaseWait: string;
  previewFixedEmptyTitle: string;
  previewFixedEmptyDesc: string;
  headerResultPreview: string;
  headerLiveTable: string;
  headerSignedInTitle: string;
  headerGoogleUser: string;
  headerSynced: string;
  headerSignInTitle: string;
  headerSync: string;
  headerSelectLanguage: string;
  headerRulesTitle: string;
  headerRulesShort: string;
  toastDismiss: string;
  errorBoundaryTitle: string;
  errorBoundaryDesc: string;
  errorBoundaryReload: string;
  errorBoundaryResetTitle: string;
  errorBoundaryReset: string;
  loadingRestoreMessage: string;
  loadingIndexedDbActive: string;
  loadingWorkspaceTitle: string;
  dashRefreshedLatest: string;
  dashRefreshCompleted: string;
  dashColumnLayoutSaved: string;
  dashColumnsRestored: string;
  dashSignInForShare: string;
  dashSharePublishFailed: string;
  dashShareCreated: string;
  dashShareRevokeFailed: string;
  dashShareStopped: string;
  dashCopyLinkFailed: string;
  dashFilterNameAll: string;
  dashPreviewLinkCopied: string;
  dashExcelExported: string;
  dashExportFailed: string;
  dashCsvExported: string;
  badgePassed: string;
  badgeReview: string;
  badgeRejected: string;
  badgeNoRule: string;
  badgeHold: string;
  dashValueMatched: string;
  dashValueUnmatched: string;
  dashValueEmpty: string;
  dashValueBlanks: string;
  colDecisionStatus: string;
  dashOnlyAcceptTitle: string;
  dashOnlyAccept: string;
  dashRefreshTitle: string;
  dashRefresh: string;

  dashHoldReasonLabel: string;
  dashHoldReasonPlaceholder: string;

  dashReleaseDesc: string;
  dashReleaseSupervisor: string;
  dashReleaseNoReason: string;
  dashRemoveFromHold: string;
  dashRemoveFromHoldTitle: string;
  dashReleaseOutcomeToast: string;
  toastHoldFound: string;
  rulesTabHold: string;
  rulesHoldColumnLabel: string;
  rulesHoldColumnLegacy: string;
  rulesHoldValuesLabel: string;
  rulesHoldValuesSearch: string;
  rulesHoldSelectAll: string;
  rulesHoldClearSel: string;
  rulesHoldLegacyLabel: string;
  rulesHoldLegacyDesc: string;
  rulesHoldLegacyPlaceholder: string;
  rulesHoldNoValues: string;
  rulesHoldNoData: string;
  dashSaveViewTitle: string;
  dashSaveSyncView: string;
  dashSaveView: string;
  dashColumnsTitle: string;
  dashColumns: string;
  dashQuickCopyTitle: string;
  dashLinkCopied: string;
  dashCopyLink: string;
  dashLiveShareOnTitle: string;
  dashLiveShareOffTitle: string;
  dashSharingLive: string;
  dashLiveShare: string;
  dashPublicLiveShareLink: string;
  dashLiveShareDesc: string;
  dashFixedPreviewLink: string;
  dashFixedPreviewLinkDesc: string;
  dashCopyShareLink: string;
  dashLongShareLink: string;
  dashCopied: string;
  dashCopy: string;
  dashStopSharing: string;
  dashSharePreviewTitle: string;
  dashSharePreview: string;
  dashExportExcelTitle: string;
  dashExportCsvTitle: string;
  dashSearchScopeTitle: string;
  dashSearchScopeAll: string;
  dashSearchScopeOutcome: string;
  dashSearchScopeReason: string;
  dashSearchScopeUnmatched: string;
  dashSearchScopeMatchKey: string;
  dashOptgroupComparison: string;
  dashOptgroupReference: string;
  dashSearchPlaceholder: string;
  dashClearSearchTitle: string;
  dashRowsFound: string;
  dashActiveColumnFilters: string;
  dashValsSelected: string;
  dashClearFilterOn: string;
  dashClearAllColumnFilters: string;
  dashClickToSortBy: string;
  dashFilterLikeExcelTitle: string;
  dashFilterAria: string;
  dashMoveColumnLeft: string;
  dashMoveColumnRight: string;
  dashAllColumnsHidden: string;
  dashAllColumnsHiddenDesc: string;
  dashRestoreAllColumns: string;
  dashChooseColumns: string;
  dashClearSearchFilter: string;
  dashCellMatched: string;
  dashCellUnmatched: string;
  dashCellDiffers: string;
  dashUnidentified: string;
  dashRefDifferingFields: string;
  dashMissingInRef: string;
  dashInspectRowTitle: string;
  dashShowingAllRows: string;
  dashFilteredFromTotal: string;
  dashFullResultView: string;
  dashRowsUnit: string;
  rulesModalTitle: string;
  rulesSavedOnce: string;
  rulesModalDesc: string;
  rulesSavedShort: string;
  rulesSaveSettings: string;
  rulesTabMapping: string;
  rulesTabDecision: string;
  rulesStorageNote: string;
  rulesPersistNote: string;
  rulesEvaluating: string;
  rulesSaveShowResults: string;
  filterHeaderPrefix: string;
  filterCloseMenu: string;
  filterSortAsc: string;
  filterSortDesc: string;
  filterSearchValues: string;
  filterSelectAll: string;
  filterNoMatchingValues: string;
  filterClearFilter: string;
  filterApply: string;
  close: string;
  confirmReset: string;
  confirmResetDesc: string;
  cancel: string;
  confirm: string;
  toastRefSaved: string;
  toastRefReset: string;
  toastAutoMapped: string;
  toastMatchedSuccess: string;
  toastExported: string;
  toastError: string;
  conditionContains: string;
  conditionEquals: string;
  conditionStartsWith: string;
  conditionEndsWith: string;
  conditionIsEmpty: string;
  conditionIsNotEmpty: string;
  conditionGreaterThan: string;
  conditionLessThan: string;
  rulesLogicSetting: string;
  filesOpeningFile: string;
  filesSavingStorage: string;
  filesLoadedNeedsRef: string;
  filesMasterBaseline: string;
  filesProcessing: string;
  filesSelectMainSheet: string;
  filesSheetsCount: string;
  filesActiveSheetLabel: string;
  filesSelectRefSheetAria: string;
  filesSheetOption: string;
  filesSingleSheet: string;
  filesColumnsDetected: string;
  filesMoreColumns: string;
  filesIncomingDesc: string;
  filesReadyToEvaluate: string;
  filesSelectIncomingSheet: string;
  filesSelectCompSheetAria: string;
  excelReadingBuffer: string;
  excelDecompressing: string;
  excelReadingSheet: string;
  excelDone: string;
  mapSummaryMore: string;
  mapNeedBothFiles: string;
  mapAutoMappedCount: string;
  mapNoMatchesFound: string;
  mapNeedMappingFirst: string;
  mapDefaultPresetName: string;
  mapPairCount: string;
  mapPresetSaved: string;
  mapPresetSaveFailed: string;
  mapPresetApplied: string;
  mapPresetDeleted: string;
  mapPresetDeleteFailed: string;
  mapTplPoName: string;
  mapTplPoDesc: string;
  mapTplSerialName: string;
  mapTplSerialDesc: string;
  mapTplInvoiceName: string;
  mapTplInvoiceDesc: string;
  mapPresetsBtnTitle: string;
  mapSavedRecentKeys: string;
  mapSaveKeysBtnTitle: string;
  mapSaveKeys: string;
  mapRecentKeys: string;
  mapRecentMappingName: string;
  mapRestoreLastUsed: string;
  mapDeleteMappingAria: string;
  mapNormSectionDesc: string;
  mapSaveDialogTitle: string;
  mapPresetNameLabel: string;
  mapPresetNamePh: string;
  mapWillSavePairs: string;
  mapSavePreset: string;
  mapPresetsModalTitle: string;
  mapPresetsModalDesc: string;
  mapTabSaved: string;
  mapTabRecent: string;
  mapTabTemplates: string;
  mapColCountBadge: string;
  mapAllInFiles: string;
  mapSavedOn: string;
  mapDeletePresetTitle: string;
  mapApplyPreset: string;
  mapNoPresets: string;
  mapNoPresetsHint: string;
  mapRecentSession: string;
  mapAutoSaved: string;
  mapNoHistory: string;
  mapUseTemplate: string;
  mapPresetsStoredNote: string;
  mapRestore: string;
  layerDefaultName: string;
  layerRuleAccepted: string;
  layerRuleReview: string;
  layerRuleRejected: string;
  layerRuleDefinition: string;
  layerInspectionPresetName: string;
  layerRuleContains: string;
  layerRuleEitherContains: string;
  layerDefaultPresetName: string;
  layerPresetDesc: string;
  layerTplInspectionDesc: string;
  layerTplQaName: string;
  layerTplQaDesc: string;
  layerTplQaLayerName: string;
  layerTplAcceptedPass: string;
  layerTplNeedsReview: string;
  layerTplStrictName: string;
  layerTplStrictDesc: string;
  layerTplStrictLayerName: string;
  layerTplPassed: string;
  layerTplApproved: string;
  layerPresetsBtnTitle: string;
  layerSavedRecentRules: string;
  layerSaveRulesBtnTitle: string;
  layerSaveRules: string;
  layerActiveRuleTitle: string;
  layerActiveRuleDesc1: string;
  layerActiveRuleDesc2: string;
  layerActiveRuleDesc3: string;
  layerResetStandardRule: string;
  layerMoveUpTitle: string;
  layerMoveDownTitle: string;
  layerDeleteLayerTitle: string;
  layerPrimaryColumn: string;
  layerSecondaryColumn: string;
  layerNoSecondary: string;
  layerComboLogic: string;
  layerLogicOr: string;
  layerLogicAnd: string;
  layerValueRules: string;
  layerTargetAny: string;
  layerTargetPrimary: string;
  layerTargetSecondary: string;
  layerValuePlaceholder: string;
  layerColorGreen: string;
  layerColorYellow: string;
  layerColorRed: string;
  layerDeleteRuleTitle: string;
  layerUseOriginalFill: string;
  layerIfNoRuleMatch: string;
  layerFallbackNone: string;
  layerFallbackYellow: string;
  layerFallbackRed: string;
  layerFallbackGreen: string;
  layerHierarchyHint: string;
  layerSaveDialogTitle: string;
  layerPresetNameLabel: string;
  layerPresetNamePh: string;
  layerWillSave: string;
  layerSavePreset: string;
  layerPresetsModalTitle: string;
  layerPresetsModalDesc: string;
  layerTabSaved: string;
  layerTabRecent: string;
  layerTabStandard: string;
  layerCountBadge: string;
  layerSavedOn: string;
  layerDeletePresetTitle: string;
  layerApplyRules: string;
  layerNoPresets: string;
  layerNoPresetsHint: string;
  layerRecentState: string;
  layerAutoSaved: string;
  layerNoHistory: string;
  layerTemplateMeta: string;
  layerApplyRule: string;
  layerFooterNote: string;
}

import { batchB } from './batchB';
import { batchC } from './batchC';

export const translations: Record<Language, TranslationDict> = {
  en: {
    ...batchB.en,
    ...batchC.en,
    appName: "Excellent Medical Technology ESP",
    appSubtitle: "Intelligent Auto-Sorting, Matching & Decision Engine",
    step1: "1. Files",
    step2: "2. Results & Export",
    step3: "Results & Export",
    rulesLogicSetting: "Setting",
    step1Title: "Reference & Incoming Files",
    step1Desc: "Manage persistent reference data and load your incoming comparison spreadsheet.",
    step2Title: "2. Rules & Logic Setting",
    step2Desc: "Configure your mapping keys and decision logic once. Settings are saved permanently and applied automatically upon file import to show Results directly.",
    step3Title: "Evaluation Results & Styled Export",
    step3Desc: "Review automated row evaluations, inspect discrepancies, and export styled spreadsheets.",
    referenceFile: "Reference Workbook (Main File)",
    incomingFile: "Incoming Workbook (Comparison File)",
    savedLocally: "SAVED LOCALLY",
    lastUpdated: "Updated",
    totalRows: "Rows",
    totalCols: "Columns",
    previewData: "Preview Data",
    replaceFile: "Replace File",
    resetReference: "Reset",
    uploadRefPrompt: "Upload your primary reference Excel file",
    uploadCompPrompt: "Upload your incoming file to compare and evaluate",
    dropFileHere: "Drop Excel / CSV file here or click to browse",
    browseFiles: "Browse Files",
    supportedFormats: "Supports .xlsx, .xls, .csv",
    loadDemoData: "Load Sample Data",
    clearAll: "Clear Comparison",
    columnMappings: "Column Mapping Keys",
    columnMappingsDesc: "Select key columns that uniquely identify corresponding rows between files.",
    mainColumn: "Reference Column",
    compColumn: "Comparison Column",
    addMapping: "+ Add Key Mapping",
    autoMap: "Auto Map Columns",
    noMappingsYet: "No column mappings configured. Click '+ Add Key Mapping' or 'Auto Map Columns'.",
    normalizationOptions: "Key Normalization Rules",
    trimSpaces: "Trim edge spaces",
    trimSpacesDesc: "Remove leading and trailing whitespace from matching keys",
    ignoreCase: "Ignore letter case",
    ignoreCaseDesc: "Perform case-insensitive string matching ('ABC' = 'abc')",
    removeHyphens: "Remove spaces & hyphens",
    removeHyphensDesc: "Strip internal spaces and dashes before matching ('A-100' = 'A100')",
    ignoreLeadingZeros: "Ignore leading zeros",
    ignoreLeadingZerosDesc: "Treat '0075' and '75' as identical matching keys",
    trimPunctuation: "Trim edge punctuation",
    trimPunctuationDesc: "Remove leading/trailing punctuation from keys ('TH-1099P.' = 'TH-1099P')",
    decisionLayers: "Decision Layers (Hierarchical Rules)",
    decisionLayersDesc: "Top-to-bottom prioritized rules. The first matching condition dictates row color.",
    addLayer: "+ Add Decision Layer",
    moveUp: "Move Up",
    moveDown: "Move Down",
    deleteLayer: "Delete Layer",
    readValuesFrom: "Read values from",
    mainDataset: "Reference File Columns",
    compDataset: "Comparison File Columns",
    mergedDataset: "Merged Result Columns",
    decisionColumn: "Primary Decision Column",
    secondaryColumn: "Secondary Column (Compound Rule)",
    enableMultiColumn: "Compound condition with 2nd column",
    columnReady: "Column ready",
    columnMissing: "Column not found in dataset",
    valueRules: "Condition & Solid Color Rules",
    addRule: "+ Add Rule",
    condition: "Condition",
    inputValue: "Value to Match",
    resultColor: "Result Color",
    greenColor: "Solid Green (Accepted / Pass)",
    yellowColor: "Solid Amber (Review / Postpone)",
    redColor: "Solid Red (Reject / Fail)",
    requireCellFill: "Require same cell fill",
    fallbackRule: "Fallback Color Policy",
    fallbackDesc: "Action when no value rules match this layer",
    runMatching: "Execute Matching Engine",
    matchingInProgress: "Processing and evaluating rows...",
    kpiTotalRows: "Total Incoming Rows",
    kpiPassed: "Passed / Green",
    kpiReview: "Review / Amber",
    kpiRejected: "Rejected / Red",
    kpiMatchRate: "Key Match Rate",
    filterAll: "All Rows",
    filterGreen: "Green (Pass)",
    filterYellow: "Amber (Review)",
    filterRed: "Red (Reject)",
    filterUnmatched: "Unmatched Only",
    filterBlue: "Hold",
    searchPlaceholder: "Search across all columns and fields...",
    exportExcel: "Export Styled Excel (.xlsx)",
    exportCsv: "Export CSV",
    exporting: "Generating export...",
    showingRows: "Showing rows",
    of: "of",
    rowsPerPage: "Per page",
    prevPage: "Previous",
    nextPage: "Next",
    noResultsFound: "No rows match your current search or filter criteria.",
    matchedStatus: "Match Status",
    matched: "Matched with Reference",
    unmatched: "No Reference Match",
    reason: "Evaluation Reason",
    decisionLayer: "Triggered Layer",
    viewDetails: "Inspect",
    rowDetails: "Row Inspection & Comparison",
    modalInspectionTitle: "Full Inspection & Discrepancy Breakdown",
    modalMatchKey: "Match Key:",
    modalNotAvailable: "N/A",
    modalUnmatchedAnalysis: "Unmatched Discrepancy Analysis",
    modalWhichUnmatched: "Which one is unmatched:",
    modalThisRecord: "This Record",
    modalPartialMismatch: "Partial Mismatch (Differing Fields)",
    modalMissingInRef: "Missing in Reference File",
    modalReason: "Reason:",
    modalIncomingKeyValues: "Incoming Key Values:",
    modalKeyColStatus: "Key Column Comparison Status",
    modalMatch: "MATCH",
    modalDiffer: "DIFFER",
    modalIncoming: "Incoming:",
    modalReference: "Reference:",
    modalNotFound: "Not Found",
    modalMatchedSuccess: "Matched Successfully with Reference Record (Exact Key Match)",
    modalDecision: "Decision:",
    modalReconciledCase: "RECONCILED CASE",
    modalReconcileTitle: "Postpone → Accepted Reconciliation",
    modalReconcileBody: "This record originally had {value} in {column}. Because an Accepted record exists with the same key ({key}), the Accept status takes full precedence: Decision is PASSED and Match is MATCHED.",
    modalOverridingSource: "Overriding Source:",
    modalIncomingRecord: "Incoming Comparison Record",
    modalRowNum: "Row #",
    modalMismatch: "Mismatch",
    modalMatchedRefRecord: "Matched Reference Record",
    modalClosestCandidate: "Closest Reference Candidate",
    modalRefRecord: "Reference Record",
    modalPartialMatch: "Partial Match",
    modalClosestDesc: "Showing the closest candidate row found in Reference catalog for comparison:",
    modalMatchedBadge: "Matched",
    modalDiffersBadge: "Differs",
    modalZeroMatch: "Zero Matching Records in Reference File",
    modalZeroMatchDesc: "No row in the Reference dataset contains the key identifier {id}. This is a brand new incoming item.",
    modalStatus: "Status:",
    modalMatched: "MATCHED",
    modalUnmatchedNew: "UNMATCHED (NEW)",
    modalLayer: "Layer:",
    shareTitle: "Share Live Result Preview",
    shareDesc: "Share a link for other users to view only the interactive result page.",
    shareWhatSee: "What other users will see:",
    shareBullet1: "Opens directly to the Result Page Only (no file editing or settings).",
    shareBullet2: "Includes full interactive filters, real-time search, column customization, and Excel / CSV export.",
    shareBullet3: "Your reference file and matching rules are preserved safely.",
    shareFilterConfig: "Preview Filter Configuration",
    sharePreselectFilter: "Pre-select current filter:",
    shareFilterAll: "All Evaluated Rows",
    shareFilterGreen: "Passed Rows (Green)",
    shareFilterYellow: "Review Rows (Yellow)",
    shareFilterRed: "Rejected Rows (Red)",
    shareFilterUnmatched: "Unmatched Rows (Violet)",
    shareFilterBlue: "Hold Rows (Blue)",
    shareIncludeSearch: "Include active search query:",
    shareLinkLabel: "Shareable Preview Link",
    shareChars: "characters",
    shareCopyLink: "Copy Link",
    shareCopied: "Copied!",
    shareCompressedNote: "Ultra-compressed link (optimized for messaging & email sharing)",
    shareDownloadHtml: "Download Standalone Preview (.html)",
    shareTestNow: "Test Live Preview Now",
    shareCopiedToast: "Live Preview link copied to clipboard!",
    shareCopyFailToast: "Failed to copy link. Please select and copy manually.",
    shareHtmlToast: "Standalone HTML preview downloaded! Anyone can open this file in any browser.",
    colTitle: "Column View Settings",
    colBadge: "Move & Visibility",
    colDesc: "Reorder columns with \u2191 / \u2193 arrows and toggle visibility for Results Table and Export.",
    colSearchPh: "Search column names...",
    colSyncExport: "Sync Export with Table",
    colTabAll: "All Columns",
    colTabData: "Dataset",
    colTabRef: "Reference",
    colTabSystem: "Decision & Audit",
    colShowAll: "Show All",
    colKeyOnly: "Key Only",
    colReset: "Reset",
    colOrderName: "Order & Column Name",
    colTable: "Table",
    colExport: "Export",
    colExcelExport: "Excel Export",
    colAll: "all",
    colNone: "none",
    colNoMatch: 'No columns match "{q}"',
    colNoCols: "No columns are available in this view.",
    colClearFilter: "Clear Filter",
    colRestoreAll: "Restore All Default Columns",
    colActiveSummary: "Active: {t} columns in table, {e} columns in export",
    colSaveSync: "Save & Sync Column View",
    colMoveUp: "Move column earlier / left",
    colMoveDown: "Move column later / right",
    colClearSearch: "Clear column search",
    colToggleAllTable: "Toggle all in table",
    colToggleAllExport: "Toggle all in export",
    colKeepDecision: "Keep Decision + Key Columns",
    colRestoreDefaults: "Restore all default columns and initial order",
    colAudit: "Audit",
    colRef: "Ref",
    colKeyRule: "Key Rule",
    dpSheet: "Sheet:",
    dpRows: "rows",
    dpColumns: "columns",
    dpSelectSheet: "Select Sheet:",
    dpShowing: "Showing {n} filtered rows",
    searchDataCells: "Search data cells...",
    toastCloudRulesSynced: "Cloud workspace synced — rules & mappings match your other devices.",
    toastCloudFilesSynced: "Files synced from the cloud — same history on this device.",
    toastCloudResultsSynced: "Results synced from the cloud.",
    gateTitle: "Sign in to sync your workspace",
    gateDesc: "Your files, settings and results are stored securely in the cloud. Sign in to pick up exactly where you left off — on any device.",
    gateSignIn: "Sign in with Google",
    cloudDownloading: "Download Data from cloud",
    cloudDownloadingSub: "Syncing your files, settings and results…",
    toastCloudFilesUploaded: "Files uploaded to the cloud.",
    toastCloudSettingsUploaded: "Settings uploaded to the cloud.",
    toastCloudSettingsSyncFailed: "Couldn't upload settings to the cloud.",
    toastCloudResultsUploaded: "Results uploaded to the cloud.",
    toastCloudResultsSyncFailed: "Couldn't upload results to the cloud.",
    syncUploading: "Uploading to cloud…",
    syncPanelTitle: "Sync status & history",
    syncAllSynced: "All synced",
    syncHistory: "History",
    syncClearHistory: "Clear history",
    syncNoHistory: "No uploads yet",
    syncFilesLabel: "Files",
    syncSettingsLabel: "Settings",
    syncResultsLabel: "Results",
    syncReasonMappings: "Column mappings",
    syncReasonNormalization: "Normalization rules",
    syncReasonLayers: "Decision layers",
    syncReasonHold: "Hold settings",
    toastCloudFilesSyncFailed: "Couldn't sync your files to the cloud. Will retry automatically — check your connection if this persists.",
    toastShareRevoked: "Live sharing was turned off — showing the last received snapshot.",
    toastPreviewSynced: "Preview synced with the latest changes.",
    toastSignInFailed: "Google sign-in failed.",
    toastSignedOut: "Signed out of cloud sync.",
    toastRefLoadedRegen: "Loaded {name}! Regenerating Results & Export with saved Rules & Logic Settings...",
    toastCompImported: "Imported {name}! Generating Results & Export with saved Rules & Logic Settings...",
    toastRefSheetSwitched: "Switched Main File sheet to “{sheet}” ({rows} rows, {cols} columns). Updating results...",
    toastRefSheetSwitchedDone: "Switched Main File sheet to “{sheet}” ({rows} rows, {cols} columns).",
    toastCompSheetSwitched: "Switched Incoming File sheet to “{sheet}” ({rows} rows, {cols} columns). Updating results...",
    toastCompSheetSwitchedDone: "Switched Incoming File sheet to “{sheet}” ({rows} rows, {cols} columns).",
    toastExitedPreview: "Exited Live Preview mode. Full studio controls restored.",
    toastRulesSaved: "Rules & Logic Settings saved! Saved once, future file imports will automatically evaluate and show Results & Export directly.",
    toastSampleLoaded: "Enterprise Procurement & Inspection Sample loaded! Evaluating...",
    toastBothFilesRequired: "Both Reference and Comparison workbooks are required.",
    toastMappingRequired: "Please specify at least one column mapping in Rules & Logic Setting.",
    toastEvaluatedSummary: "Evaluated {total} rows: {green} passed, {yellow} review, {red} rejected.",
    toastMatchingError: "Error occurred during matching.",
    toastPreviewRefreshed: "Preview results refreshed",
    previewNoResultsTitle: "No Matching Results Yet",
    previewNoResultsDesc: "The shared result preview link does not contain results data, or the link expired.",
    previewDownloading: "Downloading information\u2026",
    previewPleaseWait: "Please wait",
    previewFixedEmptyTitle: "No preview published yet",
    previewFixedEmptyDesc: "The owner hasn't published results to this link yet. New results will appear here automatically once published.",
    headerResultPreview: "Result Preview",
    headerLiveTable: "· Live Interactive Table",
    headerSignedInTitle: "Signed in as {email} — click to sign out of cloud sync",
    headerGoogleUser: "Google user",
    headerSynced: "Synced",
    headerSignInTitle: "Sign in with Google to sync rules & live preview across devices",
    headerSync: "Sync",
    headerSelectLanguage: "Select Language",
    headerRulesTitle: "Configure mapping keys and decision rules (saved permanently in browser)",
    headerRulesShort: "Setting",
    toastDismiss: "Dismiss",
    errorBoundaryTitle: "Application Recovered from Error",
    errorBoundaryDesc: "An unexpected exception occurred while rendering. You can safely reload the page or reset the workspace cache.",
    errorBoundaryReload: "Reload Page",
    errorBoundaryResetTitle: "Clears corrupted local cache and restarts fresh",
    errorBoundaryReset: "Reset Data",
    loadingRestoreMessage: "Restoring workbooks, column mappings, and decision rules...",
    loadingIndexedDbActive: "IndexedDB Active",
    loadingWorkspaceTitle: "Loading Enterprise Workspace",
    close: "Close",
    confirmReset: "Reset Reference Workbook?",
    confirmResetDesc: "This will remove the saved reference workbook from local storage. You will need to upload a new one.",
    cancel: "Cancel",
    confirm: "Confirm Reset",
    toastRefSaved: "Reference workbook saved securely to local storage",
    toastRefReset: "Reference workbook has been cleared",
    toastAutoMapped: "Auto-mapped columns based on name similarity",
    toastMatchedSuccess: "Matching and rule evaluation completed successfully",
    toastExported: "Excel workbook exported with solid high-contrast styles",
    toastError: "An error occurred during processing",
    conditionContains: "Contains",
    conditionEquals: "Equals",
    conditionStartsWith: "Starts with",
    conditionEndsWith: "Ends with",
    conditionIsEmpty: "Is empty",
    conditionIsNotEmpty: "Is not empty",
    conditionGreaterThan: "Greater than (>)",
    conditionLessThan: "Less than (<)",
  },
  my: {
    ...batchB.my,
    ...batchC.my,
    appName: "Excellent Medical Technology ESP",
    appSubtitle: "အလိုအလျောက် Excel အချက်အလက်နှိုင်းယှဉ်စစ်ဆေးရေး အင်ဂျင်",
    step1: "၁. ဖိုင်များ",
    step2: "၂. ရလဒ်နှင့် ထုတ်ယူမှု",
    step3: "ရလဒ်နှင့် ထုတ်ယူမှု",
    rulesLogicSetting: "ဆက်တင်",
    step1Title: "အခြေခံဖိုင်နှင့် အသစ်ရောက်ရှိလာသောဖိုင်",
    step1Desc: "အမြဲသိမ်းဆည်းထားသော အခြေခံဖိုင်ကို စီမံပြီး နှိုင်းယှဉ်မည့်ဖိုင်ကို တင်သွင်းပါ။",
    step2Title: "စည်းမျဉ်းနှင့် ယုတ္တိဗေဒ သတ်မှတ်ချက်",
    step2Desc: "ကော်လံချိတ်ဆက်မှုနှင့် ဆုံးဖြတ်ချက်စည်းမျဉ်းများကို တစ်ကြိမ်သာ သတ်မှတ်ထားပြီး အလိုအလျောက် အမြဲတမ်း သိမ်းဆည်းထားမည်။",
    step3Title: "စစ်ဆေးမှုရလဒ်နှင့် Excel အဖြစ်ထုတ်ယူခြင်း",
    step3Desc: "အလိုအလျောက် စစ်ဆေးပြီးစီးသော အတန်းများကို ကြည့်ရှုစစ်ဆေးပြီး အရောင်အသွေးစုံလင်စွာ ထုတ်ယူပါ။",
    referenceFile: "ပင်မ အခြေခံဖိုင် (Reference Workbook)",
    incomingFile: "နှိုင်းယှဉ်မည့် ဖိုင် (Comparison File)",
    savedLocally: "စက်ထဲတွင် သိမ်းဆည်းပြီး",
    lastUpdated: "နောက်ဆုံးပြင်ဆင်ချိန်",
    totalRows: "စုစုပေါင်းအတန်း",
    totalCols: "ကော်လံများ",
    previewData: "အချက်အလက် ကြည့်ရှုရန်",
    replaceFile: "ဖိုင်အစားထိုးရန်",
    resetReference: "ပြန်လည်စတင်ရန်",
    uploadRefPrompt: "ပင်မအခြေခံ Excel ဖိုင်ကို တင်သွင်းပါ",
    uploadCompPrompt: "နှိုင်းယှဉ်စစ်ဆေးမည့် Excel ဖိုင်ကို တင်သွင်းပါ",
    dropFileHere: "Excel / CSV ဖိုင်ကို ဤနေရာတွင် ဆွဲထည့်ပါ သို့မဟုတ် ရွေးချယ်ပါ",
    browseFiles: "ဖိုင်ရွေးချယ်ပါ",
    supportedFormats: ".xlsx, .xls, .csv ဖိုင်များကို အသုံးပြုနိုင်ပါသည်",
    loadDemoData: "နမူနာဒေတာ တင်သွင်းရန်",
    clearAll: "နှိုင်းယှဉ်ဖိုင် ရှင်းလင်းရန်",
    columnMappings: "ကော်လံ တွဲဖက်သတ်မှတ်ချက်များ",
    columnMappingsDesc: "ဖိုင်နှစ်ခုအကြား တူညီသော အတန်းများကို ရှာဖွေရန် အဓိကကော်လံများကို ရွေးချယ်ပါ။",
    mainColumn: "ပင်မဖိုင် ကော်လံ",
    compColumn: "နှိုင်းယှဉ်ဖိုင် ကော်လံ",
    addMapping: "+ ကော်လံတွဲထည့်ရန်",
    autoMap: "အလိုအလျောက် ချိတ်ဆက်ရန်",
    noMappingsYet: "ကော်လံချိတ်ဆက်မှု မရှိသေးပါ။ '+ ကော်လံတွဲထည့်ရန်' ကို နှိပ်ပါ။",
    normalizationOptions: "စာသားညှိနှိုင်းမှု စည်းမျဉ်းများ",
    trimSpaces: "ဘေးဘက်နေရာလွတ် ဖြတ်ထုတ်ရန်",
    trimSpacesDesc: "စကားလုံးရှေ့နောက် နေရာလွတ်များကို ဖယ်ရှားမည်",
    ignoreCase: "စာလုံးအကြီးအသေး မခွဲခြားရန်",
    ignoreCaseDesc: "စာလုံးအကြီးအသေးကို တူညီသည်ဟု ယူဆမည် ('ABC' = 'abc')",
    removeHyphens: "ကြားနေရာလွတ်နှင့် မျဉ်းတိုဖြတ်ရန်",
    removeHyphensDesc: "စကားလုံးအတွင်းရှိ မျဉ်းတိုများကို ဖယ်ရှားမည် ('A-100' = 'A100')",
    ignoreLeadingZeros: "ရှေ့ဆုံး သုညများကို လျစ်လျူရှုရန်",
    ignoreLeadingZerosDesc: "'0075' နှင့် '75' ကို တူညီသည်ဟု ယူဆမည်",
    trimPunctuation: "ဘေးဘက် ပုဒ်ဖြတ်သင်္ကေတ ဖြတ်ထုတ်ရန်",
    trimPunctuationDesc: "သော့ချက်စာလုံးရှေ့နောက် ပုဒ်ဖြတ်သင်္ကေတများ ဖယ်ရှားမည် ('TH-1099P.' = 'TH-1099P')",
    decisionLayers: "ဆုံးဖြတ်ချက်အလွှာများ (ဦးစားပေးစည်းမျဉ်းများ)",
    decisionLayersDesc: "အထက်မှအောက် ဦးစားပေးစနစ်ဖြင့် ပထမဆုံးကိုက်ညီသော စည်းမျဉ်းအတိုင်း အရောင်သတ်မှတ်ပါမည်။",
    addLayer: "+ ဆုံးဖြတ်ချက်အလွှာ အသစ်ထည့်ရန်",
    moveUp: "အပေါ်ရွှေ့ရန်",
    moveDown: "အောက်ရွှေ့ရန်",
    deleteLayer: "အလွှာဖျက်ရန်",
    readValuesFrom: "တန်ဖိုးဖတ်ယူမည့် နေရာ",
    mainDataset: "ပင်မဖိုင် ကော်လံများ",
    compDataset: "နှိုင်းယှဉ်ဖိုင် ကော်လံများ",
    mergedDataset: "ပေါင်းစပ်ထားသော ကော်လံများ",
    decisionColumn: "အဓိက ဆုံးဖြတ်ချက် ကော်လံ",
    secondaryColumn: "ဒုတိယ ကော်လံ (တွဲဖက်စည်းမျဉ်း)",
    enableMultiColumn: "ကော်လံနှစ်ခု တွဲဖက်စစ်ဆေးမည်",
    columnReady: "ကော်လံ အဆင်သင့်ရှိသည်",
    columnMissing: "ဖိုင်တွင် ကော်လံမရှိပါ",
    valueRules: "အခြေအနေနှင့် အရောင်သတ်မှတ်ချက်များ",
    addRule: "+ စည်းမျဉ်းအသစ်",
    condition: "အခြေအနေ",
    inputValue: "ကိုက်ညီရမည့် တန်ဖိုး",
    resultColor: "သတ်မှတ်မည့်အရောင်",
    greenColor: "အစိမ်းရောင် (အောင်မြင်/လက်ခံ)",
    yellowColor: "ဝါရောင် (ပြန်လည်သုံးသပ်/ရွှေ့ဆိုင်း)",
    redColor: "အနီရောင် (ပယ်ချ/မအောင်မြင်)",
    requireCellFill: "ဆဲလ်အရောင်ပါ တူညီရန်လိုအပ်သည်",
    fallbackRule: "မူလအရောင် အစားထိုးခြင်း",
    fallbackDesc: "စည်းမျဉ်းတစ်ခုမျှ မကိုက်ညီပါက မူလအရောင်ကို ဆက်လက်သုံးမည်",
    runMatching: "စစ်ဆေးမှု စတင်ရန်",
    matchingInProgress: "အချက်အလက်များကို စစ်ဆေးနေပါသည်...",
    kpiTotalRows: "စုစုပေါင်း အတန်းအရေအတွက်",
    kpiPassed: "အောင်မြင် (အစိမ်းရောင်)",
    kpiReview: "သုံးသပ်ရန် (ဝါရောင်)",
    kpiRejected: "ပယ်ချ (အနီရောင်)",
    kpiMatchRate: "ကိုက်ညီမှု ရာခိုင်နှုန်း",
    filterAll: "အားလုံး",
    filterGreen: "အစိမ်း (အောင်မြင်)",
    filterYellow: "ဝါရောင် (သုံးသပ်ရန်)",
    filterRed: "အနီ (ပယ်ချ)",
    filterUnmatched: "မကိုက်ညီသော အတန်းများ",
    filterBlue: "ထိန်း",
    searchPlaceholder: "ကော်လံအားလုံးတွင် ရှာဖွေရန်...",
    exportExcel: "Excel ဖိုင် ထုတ်ယူရန် (.xlsx)",
    exportCsv: "CSV ထုတ်ယူရန်",
    exporting: "ဖိုင်ပြင်ဆင်နေပါသည်...",
    showingRows: "ပြသထားသော အတန်း",
    of: "မှ",
    rowsPerPage: "တစ်မျက်နှာလျှင်",
    prevPage: "ရှေ့သို့",
    nextPage: "နောက်သို့",
    noResultsFound: "ရှာဖွေမှုနှင့် ကိုက်ညီသော အချက်အလက် မရှိပါ။",
    matchedStatus: "ကိုက်ညီမှု အခြေအနေ",
    matched: "ပင်မဖိုင်နှင့် ကိုက်ညီသည်",
    unmatched: "ကိုက်ညီမှု မတွေ့ပါ",
    reason: "ဆုံးဖြတ်ချက် အကြောင်းပြချက်",
    decisionLayer: "အသုံးပြုခဲ့သော အလွှာ",
    viewDetails: "အသေးစိတ်",
    rowDetails: "အတန်းအချက်အလက် နှိုင်းယှဉ်ချက်",
    modalInspectionTitle: "အပြည့်အစုံ စစ်ဆေးချက် နှင့် ကွဲလွဲမှု အသေးစိတ်",
    modalMatchKey: "ကိုက်ညီသောသော့:",
    modalNotAvailable: "မရှိ",
    modalUnmatchedAnalysis: "မကိုက်ညီမှု ကွဲလွဲချက် ဆန်းစစ်ချက်",
    modalWhichUnmatched: "ဘယ်တစ်ခုက မကိုက်ညီသလဲ:",
    modalThisRecord: "ဤမှတ်တမ်း",
    modalPartialMismatch: "အစိတ်အပိုင်း ကိုက်ညီမှုမရှိ (ကွဲပြားသော အကွက်များ)",
    modalMissingInRef: "အခြေခံဖိုင်တွင် မရှိပါ",
    modalReason: "အကြောင်းရင်း:",
    modalIncomingKeyValues: "ဝင်လာသော သော့တန်ဖိုးများ:",
    modalKeyColStatus: "အဓိကကော်လံ နှိုင်းယှဉ်မှု အခြေအနေ",
    modalMatch: "ကိုက်ညီသည်",
    modalDiffer: "ကွဲပြားသည်",
    modalIncoming: "ဝင်လာသည်:",
    modalReference: "အခြေခံ:",
    modalNotFound: "မတွေ့ပါ",
    modalMatchedSuccess: "အခြေခံမှတ်တမ်းနှင့် အောင်မြင်စွာ ကိုက်ညီသည် (သော့အတိအကျ)",
    modalDecision: "ဆုံးဖြတ်ချက်:",
    modalReconciledCase: "ပြန်လည်ညှိနှိုင်းထားသော အမှု",
    modalReconcileTitle: "ရွှေ့ဆိုင်း → လက်ခံခြင်း ပြန်လည်ညှိနှိုင်းမှု",
    modalReconcileBody: "ဤမှတ်တမ်းတွင် မူလက {column} ၌ {value} ဟု ရှိခဲ့သည်။ တူညီသောသော့ ({key}) ဖြင့် လက်ခံထားသော မှတ်တမ်းတစ်ခု ရှိသောကြောင့် လက်ခံမှုအခြေနေက အပြည့်အဝ ဦးစားပေးသည်- ဆုံးဖြတ်ချက်မှာ အောင်မြင်ပြီး ကိုက်ညီမှုမှာ ကိုက်ညီသည်။",
    modalOverridingSource: "အစားထိုးရင်းမြစ်:",
    modalIncomingRecord: "ဝင်လာသော နှိုင်းယှဉ်မှတ်တမ်း",
    modalRowNum: "အတန်း #",
    modalMismatch: "မကိုက်ညီမှု",
    modalMatchedRefRecord: "ကိုက်ညီသော အခြေခံမှတ်တမ်း",
    modalClosestCandidate: "အနီးစပ်ဆုံး အခြေခံလောင်း",
    modalRefRecord: "အခြေခံမှတ်တမ်း",
    modalPartialMatch: "အစိတ်အပိုင်း ကိုက်ညီမှု",
    modalClosestDesc: "နှိုင်းယှဉ်ရန် အခြေခံကတ်တလောက်တွင် တွေ့ရှိသော အနီးစပ်ဆုံး လောင်းအတန်းကို ပြသထားသည်:",
    modalMatchedBadge: "ကိုက်ညီသည်",
    modalDiffersBadge: "ကွဲပြားသည်",
    modalZeroMatch: "အခြေခံဖိုင်တွင် ကိုက်ညီသော မှတ်တမ်းလုံးဝမရှိပါ",
    modalZeroMatchDesc: "အခြေခံဒေတာအစုံတွင် သော့အမှတ်အသား {id} ပါဝင်သော အတန်းမရှိပါ။ ၎င်းသည် အသစ်ဝင်လာသော ပစ္စည်းဖြစ်သည်။",
    modalStatus: "အခြေအနေ:",
    modalMatched: "ကိုက်ညီသည်",
    modalUnmatchedNew: "မကိုက်ညီ (အသစ်)",
    modalLayer: "အလွှာ:",
    shareTitle: "တိုက်ရိုက် ရလဒ် အစမ်းကြည့်ခြင်း မျှဝေရန်",
    shareDesc: "အပြန်အလှန် ရလဒ်စာမျက်နှာကိုသာ ကြည့်ရှုနိုင်သော လင့်ခ်ကို အခြားအသုံးပြုသူများအား မျှဝေပါ။",
    shareWhatSee: "အခြားအသုံးပြုသူများ မြင်ရမည့်အရာများ:",
    shareBullet1: "ရလဒ်စာမျက်နှာသို့သာ တိုက်ရိုက်ဖွင့်မည် (ဖိုင်ပြင်ဆင်ခြင်း သို့မဟုတ် ဆက်တင်များ မပါဝင်ပါ)။",
    shareBullet2: "အပြန်အလှန် စစ်ထုတ်မှုများ၊ အချိန်နှင့်တပြေးညီ ရှာဖွေမှု၊ ကော်လံ စိတ်ကြိုက်ပြင်ဆင်မှုနှင့် Excel / CSV ထုတ်ယူမှုများ ပါဝင်သည်။",
    shareBullet3: "သင့်အခြေခံဖိုင်နှင့် ကိုက်ညီမှုစည်းမျဉ်းများကို လုံခြုံစွာ ထိန်းသိမ်းထားသည်။",
    shareFilterConfig: "အစမ်းကြည့်မှု စစ်ထုတ်မှု ပြင်ဆင်ချက်",
    sharePreselectFilter: "လက်ရှိ စစ်ထုတ်မှုကို ကြိုတင်ရွေးချယ်ရန်:",
    shareFilterAll: "အကဲဖြတ်ပြီး အတန်းအားလုံး",
    shareFilterGreen: "အောင်မြင်သော အတန်းများ (အစိမ်း)",
    shareFilterYellow: "ပြန်လည်သုံးသပ်ရန် အတန်းများ (အဝါ)",
    shareFilterRed: "ပယ်ချထားသော အတန်းများ (အနီ)",
    shareFilterUnmatched: "မကိုက်ညီသော အတန်းများ (ခရမ်း)",
    shareFilterBlue: "ထိန်းထားသော အတန်းများ (အပြာ)",
    shareIncludeSearch: "လက်ရှိ ရှာဖွေမှုကို ထည့်သွင်းရန်:",
    shareLinkLabel: "မျှဝေနိုင်သော အစမ်းကြည့်လင့်ခ်",
    shareChars: "စာလုံးရေ",
    shareCopyLink: "လင့်ခ်ကူးယူမည်",
    shareCopied: "ကူးယူပြီးပြီ!",
    shareCompressedNote: "အလွန်ချုံ့ထားသော လင့်ခ် (စာတို နှင့် အီးမေးလ်အတွက် အကောင်းဆုံး)",
    shareDownloadHtml: "သီးခြား အစမ်းကြည့် (.html) ဒေါင်းလုဒ်လုပ်မည်",
    shareTestNow: "အစမ်းကြည့်မှုကို ယခု စမ်းသပ်မည်",
    shareCopiedToast: "တိုက်ရိုက် အစမ်းကြည့်လင့်ခ်ကို ကလစ်ဘုတ်သို့ ကူးယူပြီးပြီ!",
    shareCopyFailToast: "လင့်ခ်ကူးယူ၍ မရပါ။ ကိုယ်တိုင် ရွေးချယ်၍ ကူးယူပါ။",
    shareHtmlToast: "သီးခြား HTML အစမ်းကြည့်မှုကို ဒေါင်းလုဒ်လုပ်ပြီးပြီ! မည်သူမဆို ဘရောင်ဇာဖြင့် ဖွင့်နိုင်သည်။",
    colTitle: "ကော်လံ မြင်ကွင်း ဆက်တင်များ",
    colBadge: "ရွှေ့ပြောင်း & မြင်နိုင်မှု",
    colDesc: "\u2191 / \u2193 မြှားများဖြင့် ကော်လံများကို ပြန်စီပြီး ရလဒ်ဇယားနှင့် ထုတ်ယူမှုအတွက် မြင်နိုင်မှုကို ဖွင့်/ပိတ်ပါ။",
    colSearchPh: "ကော်လံအမည်များ ရှာဖွေရန်...",
    colSyncExport: "ထုတ်ယူမှုကို ဇယားနှင့် ထပ်တူညီစေရန်",
    colTabAll: "ကော်လံအားလုံး",
    colTabData: "ဒေတာအစုံ",
    colTabRef: "အခြေခံ",
    colTabSystem: "ဆုံးဖြတ်ချက် & စစ်ဆေးမှု",
    colShowAll: "အားလုံးပြရန်",
    colKeyOnly: "အဓိကသာ",
    colReset: "ပြန်လည်သတ်မှတ်ရန်",
    colOrderName: "အစီအစဉ် & ကော်လံအမည်",
    colTable: "ဇယား",
    colExport: "ထုတ်ယူမှု",
    colExcelExport: "Excel ထုတ်ယူမှု",
    colAll: "အားလုံး",
    colNone: "မရှိ",
    colNoMatch: '"{q}" နှင့် ကိုက်ညီသော ကော်လံမရှိပါ',
    colNoCols: "ဤမြင်ကွင်းတွင် ကော်လံများ မရှိပါ။",
    colClearFilter: "စစ်ထုတ်မှုကို ရှင်းရန်",
    colRestoreAll: "မူလကော်လံအားလုံး ပြန်လည်ရယူရန်",
    colActiveSummary: "လှုပ်ရှားနေသည်- ဇယားတွင် ကော်လံ {t} ခု၊ ထုတ်ယူမှုတွင် {e} ခု",
    colSaveSync: "ကော်လံမြင်ကွင်းကို သိမ်းဆည်း & ထပ်တူညီစေရန်",
    colMoveUp: "ကော်လံကို အစောပိုင်းသို့ ရွှေ့ရန်",
    colMoveDown: "ကော်လံကို နောက်ပိုင်းသို့ ရွှေ့ရန်",
    colClearSearch: "ကော်လံရှာဖွေမှုကို ရှင်းရန်",
    colToggleAllTable: "ဇယားရှိ အားလုံးကို ဖွင့်/ပိတ်ရန်",
    colToggleAllExport: "ထုတ်ယူမှုရှိ အားလုံးကို ဖွင့်/ပိတ်ရန်",
    colKeepDecision: "ဆုံးဖြတ်ချက် + အဓိကကော်လံများသာ ထားရန်",
    colRestoreDefaults: "မူလကော်လံများနှင့် အစီအစဉ်အားလုံး ပြန်လည်ရယူရန်",
    colAudit: "စစ်ဆေးမှု",
    colRef: "အခြေခံ",
    colKeyRule: "အဓိကစည်းမျဉ်း",
    dpSheet: "စာရွက်:",
    dpRows: "အတန်းများ",
    dpColumns: "ကော်လံများ",
    dpSelectSheet: "စာရွက်ရွေးချယ်ရန်:",
    dpShowing: "{n} စစ်ထုတ်ထားသော အတန်းများကို ပြသနေသည်",
    searchDataCells: "ဒေတာဆဲလ်များ ရှာဖွေရန်...",
    toastCloudRulesSynced: "Cloud workspace ထပ်တူညီပြီးပြီ — စည်းမျဉ်းများနှင့် မြေပုံများသည် အခြားစက်များနှင့် ကိုက်ညီသည်။",
    toastCloudFilesSynced: "ဖိုင်များကို cloud မှ ထပ်တူညီပြီးပြီ — ဤစက်တွင် တူညီသော မှတ်တမ်းရှိသည်။",
    toastCloudResultsSynced: "ရလဒ်များကို cloud မှ ထပ်တူညီပြီးပြီ။",
    gateTitle: "သင့် workspace ကို ထပ်တူညီရန် လော့ဂ်အင်ဝင်ပါ",
    gateDesc: "သင့်ဖိုင်များ၊ ဆက်တင်များနှင့် ရလဒ်များသည် cloud တွင် လုံခြုံစွာ သိမ်းဆည်းထားသည်။ မည်သည့်စက်တွင်မဆို ထားခဲ့သည့်နေရာမှ ဆက်လက်လုပ်ဆောင်ရန် လော့ဂ်အင်ဝင်ပါ။",
    gateSignIn: "Google ဖြင့် လော့ဂ်အင်ဝင်ရန်",
    cloudDownloading: "Cloud မှ Data များ Download လုပ်နေသည်",
    cloudDownloadingSub: "ဖိုင်များ၊ ဆက်တင်များနှင့် ရလဒ်များ ထပ်တူညှိနေပါသည်…",
    toastCloudFilesUploaded: "ဖိုင်များ cloud သို့ upload လုပ်ပြီးပါပြီ။",
    toastCloudSettingsUploaded: "ဆက်တင်များ cloud သို့ upload လုပ်ပြီးပါပြီ။",
    toastCloudSettingsSyncFailed: "ဆက်တင်များ cloud သို့ upload လုပ်၍မရပါ။",
    toastCloudResultsUploaded: "ရလဒ်များ cloud သို့ upload လုပ်ပြီးပါပြီ။",
    toastCloudResultsSyncFailed: "ရလဒ်များ cloud သို့ upload လုပ်၍မရပါ။",
    syncUploading: "Cloud သို့ upload လုပ်နေသည်…",
    syncPanelTitle: "Sync အခြေအနေနှင့် မှတ်တမ်း",
    syncAllSynced: "အားလုံး synced ပြီးပါပြီ",
    syncHistory: "မှတ်တမ်း",
    syncClearHistory: "မှတ်တမ်းရှင်းရန်",
    syncNoHistory: "Upload လုပ်ထားခြင်းမရှိသေးပါ",
    syncFilesLabel: "ဖိုင်များ",
    syncSettingsLabel: "ဆက်တင်များ",
    syncResultsLabel: "ရလဒ်များ",
    syncReasonMappings: "ကော်လံမြေပုံများ",
    syncReasonNormalization: "Normalization စည်းမျဉ်းများ",
    syncReasonLayers: "Decision အလွှာများ",
    syncReasonHold: "Hold ဆက်တင်များ",
    toastCloudFilesSyncFailed: "သင့်ဖိုင်များကို cloud သို့ ထပ်တူညီ၍မရပါ။ အလိုအလျောက် ပြန်လည်ကြိုးစားပါမည်။",
    toastShareRevoked: "တိုက်ရိုက် မျှဝေမှုကို ပိတ်လိုက်ပြီ — နောက်ဆုံး ရရှိထားသော snapshot ကို ပြသနေသည်။",
    toastPreviewSynced: "အစမ်းကြည့်မှုကို နောက်ဆုံး ပြောင်းလဲမှုများနှင့် ထပ်တူညီပြီးပြီ။",
    toastSignInFailed: "Google ဖြင့် ဝင်ရောက်မှု မအောင်မြင်ပါ။",
    toastSignedOut: "Cloud sync မှ ထွက်လိုက်ပြီ။",
    toastRefLoadedRegen: "{name} ကို ဖွင့်ပြီးပြီ! သိမ်းထားသော Rules & Logic Settings များဖြင့် ရလဒ်နှင့် ထုတ်ယူမှုကို ပြန်လည် တွက်ချက်နေသည်...",
    toastCompImported: "{name} ကို ထည့်သွင်းပြီးပြီ! သိမ်းထားသော Rules & Logic Settings များဖြင့် ရလဒ်နှင့် ထုတ်ယူမှုကို တွက်ချက်နေသည်...",
    toastRefSheetSwitched: "Main File ၏ စာရွက်ကို “{sheet}” သို့ ပြောင်းလိုက်ပြီ ({rows} အတန်း၊ {cols} ကော်လံ)။ ရလဒ်များကို အပ်ဒိတ်လုပ်နေသည်...",
    toastRefSheetSwitchedDone: "Main File ၏ စာရွက်ကို “{sheet}” သို့ ပြောင်းလိုက်ပြီ ({rows} အတန်း၊ {cols} ကော်လံ)။",
    toastCompSheetSwitched: "Incoming File ၏ စာရွက်ကို “{sheet}” သို့ ပြောင်းလိုက်ပြီ ({rows} အတန်း၊ {cols} ကော်လံ)။ ရလဒ်များကို အပ်ဒိတ်လုပ်နေသည်...",
    toastCompSheetSwitchedDone: "Incoming File ၏ စာရွက်ကို “{sheet}” သို့ ပြောင်းလိုက်ပြီ ({rows} အတန်း၊ {cols} ကော်လံ)။",
    toastExitedPreview: "Live Preview မုဒ်မှ ထွက်လိုက်ပြီ။ Studio ထိန်းချုပ်မှုအပြည့်အစုံ ပြန်လည်ရရှိပြီ။",
    toastRulesSaved: "Rules & Logic Settings များကို သိမ်းဆည်းပြီးပြီ! တစ်ကြိမ်သိမ်းဆည်းရုံဖြင့် နောက်ဖိုင်များ ထည့်သွင်းတိုင်း အလိုအလျောက် အကဲဖြတ်ပြီး ရလဒ်နှင့် ထုတ်ယူမှုကို တိုက်ရိုက်ပြသမည်။",
    toastSampleLoaded: "Enterprise Procurement & Inspection နမူနာကို ဖွင့်ပြီးပြီ! အကဲဖြတ်နေသည်...",
    toastBothFilesRequired: "Reference နှင့် Comparison workbook နှစ်ခုလုံး လိုအပ်သည်။",
    toastMappingRequired: "Rules & Logic Setting တွင် ကော်လံမြေပုံ အနည်းဆုံး တစ်ခု သတ်မှတ်ပါ။",
    toastEvaluatedSummary: "အတန်း {total} ကို အကဲဖြတ်ပြီးပြီ — {green} အောင်မြင်၊ {yellow} ပြန်လည်သုံးသပ်ရန်၊ {red} ပယ်ချထားသည်။",
    toastMatchingError: "ကိုက်ညီမှု တွက်ချက်စဉ် အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်။",
    toastPreviewRefreshed: "အစမ်းကြည့်ရလဒ်များကို ပြန်လည်ရယူပြီးပြီ",
    previewNoResultsTitle: "ကိုက်ညီသော ရလဒ်များ မရှိသေးပါ",
    previewDownloading: "အချက်အလက် ဒေါင်းလုဒ်ဆွဲနေပါသည်\u2026",
    previewPleaseWait: "ခဏစောင့်ဆိုင်းပါ",
    previewFixedEmptyTitle: "အကြိုကြည့်ရှုမှု ထုတ်ဝေထားခြင်း မရှိသေးပါ",
    previewFixedEmptyDesc: "ပိုင်ရှင်က ဤလင့်ခ်သို့ ရလဒ်များ မထုတ်ဝေရသေးပါ။ ထုတ်ဝေပြီးပါက ရလဒ်အသစ်များ ဤနေရာတွင် အလိုအလျောက် ပေါ်လာပါမည်။",
    previewNoResultsDesc: "မျှဝေထားသော ရလဒ် အစမ်းကြည့်လင့်ခ်တွင် ရလဒ်ဒေတာ မပါဝင်ပါ သို့မဟုတ် လင့်ခ် သက်တမ်းကုန်သွားပြီ။",
    headerResultPreview: "ရလဒ် အစမ်းကြည့်မှု",
    headerLiveTable: "· တိုက်ရိုက် အပြန်အလှန် ဇယား",
    headerSignedInTitle: "{email} အဖြစ် ဝင်ရောက်ထားသည် — cloud sync မှ ထွက်ရန် နှိပ်ပါ",
    headerGoogleUser: "Google အသုံးပြုသူ",
    headerSynced: "ထပ်တူညီပြီးပြီ",
    headerSignInTitle: "စက်များအကြား စည်းမျဉ်းများနှင့် တိုက်ရိုက် အစမ်းကြည့်မှုကို ထပ်တူညီရန် Google ဖြင့် ဝင်ရောက်ပါ",
    headerSync: "ထပ်တူညီရန်",
    headerSelectLanguage: "ဘာသာစကား ရွေးချယ်ရန်",
    headerRulesTitle: "မြေပုံသော့များနှင့် ဆုံးဖြတ်ချက်စည်းမျဉ်းများကို ပြင်ဆင်ရန် (ဘရောင်ဇာတွင် အမြဲတမ်း သိမ်းဆည်းထားသည်)",
    headerRulesShort: "ဆက်တင်",
    toastDismiss: "ပယ်ဖျက်ရန်",
    errorBoundaryTitle: "အမှားမှ အပလီကေးရှင်း ပြန်လည်ရယူပြီးပြီ",
    errorBoundaryDesc: "ပြသနေစဉ် မမျှော်လင့်သော ခြွင်းချက်တစ်ခု ဖြစ်ပွားခဲ့သည်။ စာမျက်နှာကို ပြန်လည်ဖွင့်နိုင် သို့မဟုတ် workspace cache ကို ပြန်လည်သတ်မှတ်နိုင်သည်။",
    errorBoundaryReload: "စာမျက်နှာ ပြန်ဖွင့်ရန်",
    errorBoundaryResetTitle: "ပျက်စီးနေသော local cache ကို ရှင်းလင်းပြီး အသစ်ပြန်လည်စတင်သည်",
    errorBoundaryReset: "ဒေတာ ပြန်လည်သတ်မှတ်ရန်",
    loadingRestoreMessage: "Workbook များ၊ ကော်လံမြေပုံများနှင့် ဆုံးဖြတ်ချက်စည်းမျဉ်းများကို ပြန်လည်ရယူနေသည်...",
    loadingIndexedDbActive: "IndexedDB လှုပ်ရှားနေသည်",
    loadingWorkspaceTitle: "Enterprise Workspace ကို ဖွင့်နေသည်",
    close: "ပိတ်ရန်",
    confirmReset: "ပင်မဖိုင်ကို ရှင်းလင်းမည်လား?",
    confirmResetDesc: "စက်ထဲတွင် သိမ်းဆည်းထားသော အချက်အလက်များ ပျက်သွားပါမည်။",
    cancel: "မလုပ်တော့ပါ",
    confirm: "ရှင်းလင်းမည်",
    toastRefSaved: "ပင်မဖိုင်ကို စက်ထဲတွင် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ",
    toastRefReset: "ပင်မဖိုင်ကို ရှင်းလင်းပြီးပါပြီ",
    toastAutoMapped: "ကော်လံများကို အလိုအလျောက် ချိတ်ဆက်ပြီးပါပြီ",
    toastMatchedSuccess: "စစ်ဆေးဆုံးဖြတ်မှု အောင်မြင်စွာ ပြီးစီးပါပြီ",
    toastExported: "Excel ဖိုင်ကို အရောင်များနှင့်အတူ ထုတ်ယူပြီးပါပြီ",
    toastError: "လုပ်ဆောင်ရာတွင် အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့သည်",
    conditionContains: "ပါဝင်သည်",
    conditionEquals: "ညီမျှသည်",
    conditionStartsWith: "ဖြင့် စတင်သည်",
    conditionEndsWith: "ဖြင့် ဆုံးသည်",
    conditionIsEmpty: "နေရာလွတ်ဖြစ်သည်",
    conditionIsNotEmpty: "နေရာလွတ် မဟုတ်ပါ",
    conditionGreaterThan: "ထက် ကြီးသည် (>)",
    conditionLessThan: "ထက် ငယ်သည် (<)",
  },
  th: {
    ...batchB.th,
    ...batchC.th,
    appName: "Excellent Medical Technology ESP",
    appSubtitle: "ระบบเปรียบเทียบข้อมูล จัดเรียง และประเมินผลอัตโนมัติสำหรับ Excel",
    step1: "1. ไฟล์ข้อมูล",
    step2: "2. ผลลัพธ์และส่งออก",
    step3: "ผลลัพธ์และส่งออก",
    rulesLogicSetting: "ตั้งค่า",
    step1Title: "ไฟล์หลักอ้างอิงและไฟล์เปรียบเทียบ",
    step1Desc: "จัดการข้อมูลไฟล์หลักที่บันทึกถาวร และอัปโหลดไฟล์ใหม่สำหรับเปรียบเทียบในวันนี้",
    step2Title: "Rules & Logic Setting (การตั้งค่ากฎและตรรกะ)",
    step2Desc: "ตั้งค่าการจับคู่และตรรกะการตัดสินใจเพียงครั้งเดียว ระบบจะบันทึกถาวรและเปิดหน้าผลลัพธ์อัตโนมัติทันทีที่นำเข้าไฟล์",
    step3Title: "ผลการประเมินและการส่งออกระดับมืออาชีพ",
    step3Desc: "ตรวจสอบผลการวิเคราะห์แถวข้อมูลอัตโนมัติ และส่งออกไฟล์ Excel พร้อมสีไฮไลต์ที่สวยงาม",
    referenceFile: "สมุดงานอ้างอิงหลัก (Reference Workbook)",
    incomingFile: "ไฟล์เปรียบเทียบที่นำเข้า (Comparison File)",
    savedLocally: "บันทึกในเครื่องแล้ว",
    lastUpdated: "อัปเดตล่าสุด",
    totalRows: "จำนวนแถว",
    totalCols: "คอลัมน์",
    previewData: "ดูตัวอย่างข้อมูล",
    replaceFile: "เปลี่ยนไฟล์",
    resetReference: "รีเซ็ต",
    uploadRefPrompt: "อัปโหลดไฟล์ Excel อ้างอิงหลักของคุณ",
    uploadCompPrompt: "อัปโหลดไฟล์ใหม่ที่ต้องการตรวจสอบเปรียบเทียบ",
    dropFileHere: "ลากไฟล์ Excel / CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์",
    browseFiles: "เลือกไฟล์",
    supportedFormats: "รองรับ .xlsx, .xls, .csv",
    loadDemoData: "โหลดข้อมูลตัวอย่าง",
    clearAll: "ล้างไฟล์เปรียบเทียบ",
    columnMappings: "การจับคู่คอลัมน์หลัก",
    columnMappingsDesc: "เลือกคอลัมน์ที่ใช้ระบุแถวข้อมูลที่ตรงกันระหว่างสองไฟล์",
    mainColumn: "คอลัมน์ในไฟล์หลัก",
    compColumn: "คอลัมน์ในไฟล์เปรียบเทียบ",
    addMapping: "+ เพิ่มการจับคู่",
    autoMap: "จับคู่อัตโนมัติ",
    noMappingsYet: "ยังไม่มีการจับคู่คอลัมน์ คลิก '+ เพิ่มการจับคู่' หรือ 'จับคู่อัตโนมัติ'",
    normalizationOptions: "กฎการปรับมาตรฐานข้อความก่อนจับคู่",
    trimSpaces: "ตัดช่องว่างหน้า-หลัง",
    trimSpacesDesc: "ลบช่องว่างส่วนเกินที่ขอบข้อความ",
    ignoreCase: "ไม่สนใจตัวพิมพ์เล็ก-ใหญ่",
    ignoreCaseDesc: "เปรียบเทียบตัวอักษรแบบไม่แยกขนาด ('ABC' = 'abc')",
    removeHyphens: "ลบช่องว่างและขีดกลาง",
    removeHyphensDesc: "ตัดขีดกลางและช่องว่างภายในออก ('A-100' = 'A100')",
    ignoreLeadingZeros: "ไม่สนใจเลขศูนย์นำหน้า",
    ignoreLeadingZerosDesc: "มองว่า '0075' และ '75' มีค่าตรงกัน",
    trimPunctuation: "ตัดเครื่องหมายวรรคตอนหน้า-หลัง",
    trimPunctuationDesc: "ลบเครื่องหมายวรรคตอนที่ขอบของคีย์ ('TH-1099P.' = 'TH-1099P')",
    decisionLayers: "เลเยอร์การตัดสินใจ (ลำดับความสำคัญ)",
    decisionLayersDesc: "ประเมินเงื่อนไขจากบนลงล่าง เงื่อนไขแรกที่ตรงจะกำหนดสีของแถว",
    addLayer: "+ เพิ่มเลเยอร์การตัดสินใจ",
    moveUp: "เลื่อนขึ้น",
    moveDown: "เลื่อนลง",
    deleteLayer: "ลบเลเยอร์",
    readValuesFrom: "อ่านค่าจาก",
    mainDataset: "คอลัมน์ไฟล์หลัก",
    compDataset: "คอลัมน์ไฟล์เปรียบเทียบ",
    mergedDataset: "คอลัมน์ที่ผสานผลลัพธ์",
    decisionColumn: "คอลัมน์ตัดสินใจหลัก",
    secondaryColumn: "คอลัมน์ที่สอง (เงื่อนไขผสม)",
    enableMultiColumn: "ใช้เงื่อนไขร่วมกับคอลัมน์ที่สอง",
    columnReady: "คอลัมน์พร้อมใช้งาน",
    columnMissing: "ไม่พบคอลัมน์นี้ในชุดข้อมูล",
    valueRules: "เงื่อนไขค่าและสีกำกับ",
    addRule: "+ เพิ่มกฎ",
    condition: "เงื่อนไข",
    inputValue: "ค่าที่ต้องการจับคู่",
    resultColor: "สีผลลัพธ์",
    greenColor: "สีเขียวทึบ (ผ่าน / ยอมรับ)",
    yellowColor: "สีเหลืองอำพันทึบ (รอตรวจสอบ / เลื่อน)",
    redColor: "สีแดงทึบ (ปฏิเสธ / ไม่ผ่าน)",
    requireCellFill: "ต้องตรงกับสีเติมเซลล์เดิมด้วย",
    fallbackRule: "สีกรณีไม่ตรงเงื่อนไขใดๆ",
    fallbackDesc: "การกำหนดสีเมื่อไม่มีกฎใดตรงในเลเยอร์นี้",
    runMatching: "เริ่มกระบวนการเปรียบเทียบ",
    matchingInProgress: "กำลังประมวลผลข้อมูลและตรวจวัดกฎ...",
    kpiTotalRows: "จำนวนแถวทั้งหมดที่นำเข้า",
    kpiPassed: "ผ่าน / สีเขียว",
    kpiReview: "รอตรวจสอบ / สีเหลือง",
    kpiRejected: "ปฏิเสธ / สีแดง",
    kpiMatchRate: "อัตราการจับคู่สำเร็จ",
    filterAll: "แถวทั้งหมด",
    filterGreen: "สีเขียว (ผ่าน)",
    filterYellow: "สีเหลือง (รอตรวจ)",
    filterRed: "สีแดง (ปฏิเสธ)",
    filterUnmatched: "ไม่พบข้อมูลอ้างอิง",
    filterBlue: "พักไว้",
    searchPlaceholder: "ค้นหาข้อมูลในทุกคอลัมน์...",
    exportExcel: "ส่งออกไฟล์ Excel (.xlsx)",
    exportCsv: "ส่งออก CSV",
    exporting: "กำลังสร้างไฟล์...",
    showingRows: "แสดงแถวที่",
    of: "จาก",
    rowsPerPage: "ต่อหน้า",
    prevPage: "ก่อนหน้า",
    nextPage: "ถัดไป",
    noResultsFound: "ไม่พบข้อมูลที่ตรงกับคำค้นหาหรือตัวกรอง",
    matchedStatus: "สถานะการจับคู่",
    matched: "พบข้อมูลในไฟล์หลัก",
    unmatched: "ไม่พบในไฟล์หลัก",
    reason: "เหตุผลการตัดสินใจ",
    decisionLayer: "เลเยอร์ที่ตรวจพบ",
    viewDetails: "ดูรายละเอียด",
    rowDetails: "การตรวจสอบและเปรียบเทียบแถวข้อมูล",
    modalInspectionTitle: "รายละเอียดการตรวจสอบและความคลาดเคลื่อนแบบเต็ม",
    modalMatchKey: "คีย์ที่ตรงกัน:",
    modalNotAvailable: "ไม่มีข้อมูล",
    modalUnmatchedAnalysis: "วิเคราะห์ความคลาดเคลื่อนที่ไม่ตรงกัน",
    modalWhichUnmatched: "รายการใดที่ไม่ตรงกัน:",
    modalThisRecord: "ระเบียนนี้",
    modalPartialMismatch: "ตรงกันบางส่วน (ฟิลด์ที่แตกต่างกัน)",
    modalMissingInRef: "ไม่มีในไฟล์อ้างอิง",
    modalReason: "เหตุผล:",
    modalIncomingKeyValues: "ค่าคีย์ขาเข้า:",
    modalKeyColStatus: "สถานะการเปรียบเทียบคอลัมน์หลัก",
    modalMatch: "ตรงกัน",
    modalDiffer: "ต่างกัน",
    modalIncoming: "ขาเข้า:",
    modalReference: "อ้างอิง:",
    modalNotFound: "ไม่พบ",
    modalMatchedSuccess: "จับคู่กับระเบียนอ้างอิงสำเร็จ (คีย์ตรงแบบเป๊ะ)",
    modalDecision: "การตัดสินใจ:",
    modalReconciledCase: "กรณีที่ปรับปรุงแล้ว",
    modalReconcileTitle: "เลื่อน → การปรับยอดที่ยอมรับ",
    modalReconcileBody: "ระเบียนนี้เดิมมี {value} ใน {column} เนื่องจากมีระเบียนที่ได้รับการยอมรับซึ่งมีคีย์เดียวกัน ({key}) สถานะที่ยอมรับจึงมีผลเหนือกว่าทั้งหมด: การตัดสินใจคือผ่าน และการจับคู่คือตรงกัน",
    modalOverridingSource: "แหล่งที่มาแทนที่:",
    modalIncomingRecord: "ระเบียนเปรียบเทียบขาเข้า",
    modalRowNum: "แถวที่ #",
    modalMismatch: "ไม่ตรงกัน",
    modalMatchedRefRecord: "ระเบียนอ้างอิงที่ตรงกัน",
    modalClosestCandidate: "ตัวเลือกอ้างอิงที่ใกล้เคียงที่สุด",
    modalRefRecord: "ระเบียนอ้างอิง",
    modalPartialMatch: "ตรงกันบางส่วน",
    modalClosestDesc: "แสดงแถวตัวเลือกที่ใกล้เคียงที่สุดที่พบในแค็ตตาล็อกอ้างอิงเพื่อเปรียบเทียบ:",
    modalMatchedBadge: "ตรงกัน",
    modalDiffersBadge: "ต่างกัน",
    modalZeroMatch: "ไม่มีระเบียนที่ตรงกันในไฟล์อ้างอิงเลย",
    modalZeroMatchDesc: "ไม่มีแถวในชุดข้อมูลอ้างอิงที่มีตัวระบุคีย์ {id} นี่เป็นรายการขาเข้าใหม่",
    modalStatus: "สถานะ:",
    modalMatched: "ตรงกัน",
    modalUnmatchedNew: "ไม่ตรงกัน (ใหม่)",
    modalLayer: "เลเยอร์:",
    shareTitle: "แชร์ตัวอย่างผลลัพธ์แบบสด",
    shareDesc: "แชร์ลิงก์ให้ผู้ใช้อื่นดูเฉพาะหน้าผลลัพธ์แบบโต้ตอบได้",
    shareWhatSee: "สิ่งที่ผู้ใช้อื่นจะเห็น:",
    shareBullet1: "เปิดไปที่หน้าผลลัพธ์เท่านั้นโดยตรง (ไม่มีการแก้ไขไฟล์หรือการตั้งค่า)",
    shareBullet2: "มีตัวกรองแบบโต้ตอบ การค้นหาแบบเรียลไทม์ การปรับแต่งคอลัมน์ และการส่งออก Excel / CSV",
    shareBullet3: "ไฟล์อ้างอิงและกฎการจับคู่ของคุณจะถูกเก็บรักษาอย่างปลอดภัย",
    shareFilterConfig: "การกำหนดค่าตัวกรองตัวอย่าง",
    sharePreselectFilter: "เลือกตัวกรองปัจจุบันไว้ล่วงหน้า:",
    shareFilterAll: "แถวที่ประเมินทั้งหมด",
    shareFilterGreen: "แถวที่ผ่าน (สีเขียว)",
    shareFilterYellow: "แถวที่ต้องตรวจสอบ (สีเหลือง)",
    shareFilterRed: "แถวที่ถูกปฏิเสธ (สีแดง)",
    shareFilterUnmatched: "แถวที่ไม่ตรงกัน (สีม่วง)",
    shareFilterBlue: "แถวที่พักไว้ (สีน้ำเงิน)",
    shareIncludeSearch: "รวมคำค้นหาที่ใช้งานอยู่:",
    shareLinkLabel: "ลิงก์ตัวอย่างที่แชร์ได้",
    shareChars: "อักขระ",
    shareCopyLink: "คัดลอกลิงก์",
    shareCopied: "คัดลอกแล้ว!",
    shareCompressedNote: "ลิงก์ที่บีบอัดเป็นพิเศษ (เหมาะสำหรับการแชร์ทางข้อความและอีเมล)",
    shareDownloadHtml: "ดาวน์โหลดตัวอย่างแบบสแตนด์อโลน (.html)",
    shareTestNow: "ทดสอบตัวอย่างสดทันที",
    shareCopiedToast: "คัดลอกลิงก์ตัวอย่างสดไปยังคลิปบอร์ดแล้ว!",
    shareCopyFailToast: "คัดลอกลิงก์ไม่สำเร็จ กรุณาเลือกและคัดลอกด้วยตนเอง",
    shareHtmlToast: "ดาวน์โหลดตัวอย่าง HTML แบบสแตนด์อโลนแล้ว! ใครก็สามารถเปิดในเบราว์เซอร์ใดก็ได้",
    colTitle: "ตั้งค่ามุมมองคอลัมน์",
    colBadge: "ย้าย & การมองเห็น",
    colDesc: "จัดเรียงคอลัมน์ใหม่ด้วยลูกศร \u2191 / \u2193 และเปิด/ปิดการมองเห็นสำหรับตารางผลลัพธ์และการส่งออก",
    colSearchPh: "ค้นหาชื่อคอลัมน์...",
    colSyncExport: "ซิงค์การส่งออกกับตาราง",
    colTabAll: "คอลัมน์ทั้งหมด",
    colTabData: "ชุดข้อมูล",
    colTabRef: "อ้างอิง",
    colTabSystem: "การตัดสินใจ & ตรวจสอบ",
    colShowAll: "แสดงทั้งหมด",
    colKeyOnly: "เฉพาะหลัก",
    colReset: "รีเซ็ต",
    colOrderName: "ลำดับ & ชื่อคอลัมน์",
    colTable: "ตาราง",
    colExport: "ส่งออก",
    colExcelExport: "ส่งออก Excel",
    colAll: "ทั้งหมด",
    colNone: "ไม่มี",
    colNoMatch: 'ไม่มีคอลัมน์ที่ตรงกับ "{q}"',
    colNoCols: "ไม่มีคอลัมน์ในมุมมองนี้",
    colClearFilter: "ล้างตัวกรอง",
    colRestoreAll: "กู้คืนคอลัมน์เริ่มต้นทั้งหมด",
    colActiveSummary: "ใช้งาน: {t} คอลัมน์ในตาราง, {e} คอลัมน์ในการส่งออก",
    colSaveSync: "บันทึก & ซิงค์มุมมองคอลัมน์",
    colMoveUp: "ย้ายคอลัมน์ไปก่อนหน้า",
    colMoveDown: "ย้ายคอลัมน์ไปถัดไป",
    colClearSearch: "ล้างการค้นหาคอลัมน์",
    colToggleAllTable: "สลับทั้งหมดในตาราง",
    colToggleAllExport: "สลับทั้งหมดในการส่งออก",
    colKeepDecision: "เก็บเฉพาะการตัดสินใจ + คอลัมน์หลัก",
    colRestoreDefaults: "กู้คืนคอลัมน์เริ่มต้นและลำดับทั้งหมด",
    colAudit: "ตรวจสอบ",
    colRef: "อ้างอิง",
    colKeyRule: "กฎหลัก",
    dpSheet: "ชีต:",
    dpRows: "แถว",
    dpColumns: "คอลัมน์",
    dpSelectSheet: "เลือกชีต:",
    dpShowing: "กำลังแสดง {n} แถวที่กรองแล้ว",
    searchDataCells: "ค้นหาเซลล์ข้อมูล...",
    toastCloudRulesSynced: "ซิงค์พื้นที่ทำงานคลาวด์แล้ว — กฎและการแมปตรงกับอุปกรณ์อื่นของคุณ",
    toastCloudFilesSynced: "ซิงค์ไฟล์จากคลาวด์แล้ว — ประวัติเดียวกันบนอุปกรณ์นี้",
    toastCloudResultsSynced: "ซิงค์ผลลัพธ์จากคลาวด์แล้ว",
    gateTitle: "ลงชื่อเข้าใช้เพื่อซิงค์พื้นที่ทำงานของคุณ",
    gateDesc: "ไฟล์ การตั้งค่า และผลลัพธ์ของคุณถูกเก็บไว้อย่างปลอดภัยในคลาวด์ ลงชื่อเข้าใช้เพื่อทำงานต่อจากที่ค้างไว้ได้บนทุกอุปกรณ์",
    gateSignIn: "ลงชื่อเข้าใช้ด้วย Google",
    cloudDownloading: "Download Data จากคลาวด์",
    cloudDownloadingSub: "กำลังซิงค์ไฟล์ การตั้งค่า และผลลัพธ์…",
    toastCloudFilesUploaded: "อัปโหลดไฟล์ขึ้นคลาวด์แล้ว",
    toastCloudSettingsUploaded: "อัปโหลดการตั้งค่าขึ้นคลาวด์แล้ว",
    toastCloudSettingsSyncFailed: "อัปโหลดการตั้งค่าขึ้นคลาวด์ไม่สำเร็จ",
    toastCloudResultsUploaded: "อัปโหลดผลลัพธ์ขึ้นคลาวด์แล้ว",
    toastCloudResultsSyncFailed: "อัปโหลดผลลัพธ์ขึ้นคลาวด์ไม่สำเร็จ",
    syncUploading: "กำลังอัปโหลดขึ้นคลาวด์…",
    syncPanelTitle: "สถานะการซิงค์และประวัติ",
    syncAllSynced: "ซิงค์ครบแล้ว",
    syncHistory: "ประวัติ",
    syncClearHistory: "ล้างประวัติ",
    syncNoHistory: "ยังไม่มีการอัปโหลด",
    syncFilesLabel: "ไฟล์",
    syncSettingsLabel: "การตั้งค่า",
    syncResultsLabel: "ผลลัพธ์",
    syncReasonMappings: "การจับคู่คอลัมน์",
    syncReasonNormalization: "กฎ normalization",
    syncReasonLayers: "เลเยอร์การตัดสินใจ",
    syncReasonHold: "การตั้งค่า Hold",
    toastCloudFilesSyncFailed: "ไม่สามารถซิงค์ไฟล์ของคุณไปยังคลาวด์ได้ จะลองใหม่โดยอัตโนมัติ",
    toastShareRevoked: "ปิดการแชร์สดแล้ว — กำลังแสดงสแนปช็อตล่าสุดที่ได้รับ",
    toastPreviewSynced: "ซิงค์ตัวอย่างกับการเปลี่ยนแปลงล่าสุดแล้ว",
    toastSignInFailed: "ลงชื่อเข้าใช้ Google ไม่สำเร็จ",
    toastSignedOut: "ลงชื่อออกจากคลาวด์ซิงค์แล้ว",
    toastRefLoadedRegen: "โหลด {name} แล้ว! กำลังคำนวณผลลัพธ์และการส่งออกใหม่ด้วยการตั้งค่ากฎและตรรกะที่บันทึกไว้...",
    toastCompImported: "นำเข้า {name} แล้ว! กำลังสร้างผลลัพธ์และการส่งออกด้วยการตั้งค่ากฎและตรรกะที่บันทึกไว้...",
    toastRefSheetSwitched: "เปลี่ยนชีตไฟล์หลักเป็น “{sheet}” แล้ว ({rows} แถว, {cols} คอลัมน์) กำลังอัปเดตผลลัพธ์...",
    toastRefSheetSwitchedDone: "เปลี่ยนชีตไฟล์หลักเป็น “{sheet}” แล้ว ({rows} แถว, {cols} คอลัมน์)",
    toastCompSheetSwitched: "เปลี่ยนชีตไฟล์ขาเข้าเป็น “{sheet}” แล้ว ({rows} แถว, {cols} คอลัมน์) กำลังอัปเดตผลลัพธ์...",
    toastCompSheetSwitchedDone: "เปลี่ยนชีตไฟล์ขาเข้าเป็น “{sheet}” แล้ว ({rows} แถว, {cols} คอลัมน์)",
    toastExitedPreview: "ออกจากโหมดตัวอย่างสดแล้ว กู้คืนการควบคุมสตูดิโอแบบเต็ม",
    toastRulesSaved: "บันทึกการตั้งค่ากฎและตรรกะแล้ว! บันทึกครั้งเดียว การนำเข้าไฟล์ครั้งต่อไปจะประเมินและแสดงผลลัพธ์และการส่งออกโดยอัตโนมัติ",
    toastSampleLoaded: "โหลดตัวอย่างการจัดซื้อและการตรวจสอบระดับองค์กรแล้ว! กำลังประเมิน...",
    toastBothFilesRequired: "ต้องมีทั้งเวิร์กบุ๊กอ้างอิงและเวิร์กบุ๊กเปรียบเทียบ",
    toastMappingRequired: "โปรดระบุการแมปคอลัมน์อย่างน้อยหนึ่งรายการในการตั้งค่ากฎและตรรกะ",
    toastEvaluatedSummary: "ประเมิน {total} แถว: ผ่าน {green} ตรวจสอบ {yellow} ปฏิเสธ {red}",
    toastMatchingError: "เกิดข้อผิดพลาดระหว่างการจับคู่",
    toastPreviewRefreshed: "รีเฟรชผลลัพธ์ตัวอย่างแล้ว",
    previewNoResultsTitle: "ยังไม่มีผลลัพธ์ที่ตรงกัน",
    previewDownloading: "กำลังดาวน์โหลดข้อมูล\u2026",
    previewPleaseWait: "โปรดรอสักครู่",
    previewFixedEmptyTitle: "ยังไม่มีการเผยแพร่ตัวอย่าง",
    previewFixedEmptyDesc: "เจ้าของยังไม่ได้เผยแพร่ผลลัพธ์ไปยังลิงก์นี้ ผลลัพธ์ใหม่จะปรากฏที่นี่โดยอัตโนมัติเมื่อมีการเผยแพร่",
    previewNoResultsDesc: "ลิงก์ตัวอย่างผลลัพธ์ที่แชร์ไม่มีข้อมูลผลลัพธ์ หรือลิงก์หมดอายุ",
    headerResultPreview: "ตัวอย่างผลลัพธ์",
    headerLiveTable: "· ตารางโต้ตอบสด",
    headerSignedInTitle: "ลงชื่อเข้าใช้เป็น {email} — คลิกเพื่อลงชื่อออกจากการซิงค์คลาวด์",
    headerGoogleUser: "ผู้ใช้ Google",
    headerSynced: "ซิงค์แล้ว",
    headerSignInTitle: "ลงชื่อเข้าใช้ด้วย Google เพื่อซิงค์กฎและตัวอย่างสดระหว่างอุปกรณ์",
    headerSync: "ซิงค์",
    headerSelectLanguage: "เลือกภาษา",
    headerRulesTitle: "กำหนดค่าคีย์การแมปและกฎการตัดสินใจ (บันทึกถาวรในเบราว์เซอร์)",
    headerRulesShort: "ตั้งค่า",
    toastDismiss: "ปิด",
    errorBoundaryTitle: "แอปพลิเคชันกู้คืนจากข้อผิดพลาดแล้ว",
    errorBoundaryDesc: "เกิดข้อยกเว้นที่ไม่คาดคิดขณะแสดงผล คุณสามารถโหลดหน้าซ้ำหรือรีเซ็ตแคชพื้นที่ทำงานได้อย่างปลอดภัย",
    errorBoundaryReload: "โหลดหน้าซ้ำ",
    errorBoundaryResetTitle: "ล้างแคชในเครื่องที่เสียหายและเริ่มใหม่",
    errorBoundaryReset: "รีเซ็ตข้อมูล",
    loadingRestoreMessage: "กำลังกู้คืนเวิร์กบุ๊ก การแมปคอลัมน์ และกฎการตัดสินใจ...",
    loadingIndexedDbActive: "IndexedDB ทำงานอยู่",
    loadingWorkspaceTitle: "กำลังโหลดพื้นที่ทำงานองค์กร",
    close: "ปิด",
    confirmReset: "ยืนยันการล้างไฟล์หลัก?",
    confirmResetDesc: "การกระทำนี้จะลบไฟล์อ้างอิงที่บันทึกไว้ในเครื่องของคุณ",
    cancel: "ยกเลิก",
    confirm: "ยืนยันการรีเซ็ต",
    toastRefSaved: "บันทึกไฟล์อ้างอิงลงในเครื่องเรียบร้อยแล้ว",
    toastRefReset: "ล้างไฟล์อ้างอิงเรียบร้อยแล้ว",
    toastAutoMapped: "จับคู่คอลัมน์อัตโนมัติสำเร็จ",
    toastMatchedSuccess: "ประมวลผลการจับคู่และกฎการตัดสินใจเสร็จสมบูรณ์",
    toastExported: "ส่งออกไฟล์ Excel พร้อมสีไฮไลต์เรียบร้อย",
    toastError: "เกิดข้อผิดพลาดในการประมวลผล",
    conditionContains: "ประกอบด้วย (Contains)",
    conditionEquals: "เท่ากับ (Equals)",
    conditionStartsWith: "ขึ้นต้นด้วย (Starts with)",
    conditionEndsWith: "ลงท้ายด้วย (Ends with)",
    conditionIsEmpty: "เป็นค่าว่าง (Is empty)",
    conditionIsNotEmpty: "ไม่เป็นค่าว่าง (Is not empty)",
    conditionGreaterThan: "มากกว่า (>)",
    conditionLessThan: "น้อยกว่า (<)",
  },
  zh: {
    ...batchB.zh,
    ...batchC.zh,
    appName: "Excellent Medical Technology ESP",
    appSubtitle: "企业级智能 Excel 自动比对、多列匹配与决策引擎",
    step1: "1. 数据文件",
    step2: "2. 结果与导出",
    step3: "结果与导出",
    rulesLogicSetting: "设置",
    step1Title: "基准文件与比对文件",
    step1Desc: "管理本地持久化基准数据，随时载入待比对的 Excel 数据表格。",
    step2Title: "规则与逻辑设置 (Rules & Logic Setting)",
    step2Desc: "只需配置一次映射键与决策规则，设置将持久化保存，导入文件后自动套用并直达结果。",
    step3Title: "比对评估结果与带样式导出",
    step3Desc: "实时查验智能决策分类，分析异常行并导出保留高对比度颜色填充的专业 Excel。",
    referenceFile: "基准工作簿（主文件）",
    incomingFile: "待比对工作簿（输入文件）",
    savedLocally: "已本地持久化保存",
    lastUpdated: "更新时间",
    totalRows: "总行数",
    totalCols: "列数",
    previewData: "数据预览与编辑",
    replaceFile: "更换基准文件",
    resetReference: "清空重置",
    uploadRefPrompt: "上传主基准 Excel 数据表格",
    uploadCompPrompt: "上传待进行智能比对与决策的数据表格",
    dropFileHere: "拖拽 Excel / CSV 文件至此处，或点击浏览",
    browseFiles: "选择文件",
    supportedFormats: "支持 .xlsx, .xls, .csv 格式",
    loadDemoData: "载入演示数据",
    clearAll: "清除比对文件",
    columnMappings: "关键列映射关系",
    columnMappingsDesc: "指定用于唯一标识两表对应数据行的关键列组合。",
    mainColumn: "基准表列",
    compColumn: "比对表列",
    addMapping: "+ 添加映射键",
    autoMap: "智能自动映射",
    noMappingsYet: "尚未配置列映射，请点击“+ 添加映射键”或“智能自动映射”。",
    normalizationOptions: "匹配前字符规范化设置",
    trimSpaces: "修剪首尾空格",
    trimSpacesDesc: "自动剔除匹配键文本两侧的多余空格（Trim）",
    ignoreCase: "忽略大小写",
    ignoreCaseDesc: "不区分英文英文字母大小写（'ABC' = 'abc'）",
    removeHyphens: "移除内部空格与连字符",
    removeHyphensDesc: "比对前剥离空格与短横线（'A-100' = 'A100'）",
    ignoreLeadingZeros: "忽略前导零",
    ignoreLeadingZerosDesc: "将 '0075' 与 '75' 视作完全相同的匹配键",
    trimPunctuation: "去除首尾标点符号",
    trimPunctuationDesc: "去除键首尾的标点符号 ('TH-1099P.' = 'TH-1099P')",
    decisionLayers: "决策层（层级优先判定规则）",
    decisionLayersDesc: "按自顶向下顺序评估，首个命中的规则将决定该行的最终颜色。",
    addLayer: "+ 添加决策层",
    moveUp: "上移",
    moveDown: "下移",
    deleteLayer: "删除决策层",
    readValuesFrom: "读取判定值来源",
    mainDataset: "基准表数据列",
    compDataset: "比对表数据列",
    mergedDataset: "合并结果数据列",
    decisionColumn: "主决策目标列",
    secondaryColumn: "第二条件列（复合判定）",
    enableMultiColumn: "启用第二列联合复合判定",
    columnReady: "列已就绪",
    columnMissing: "数据集中未找到此列",
    valueRules: "值匹配与高对比度实体颜色规则",
    addRule: "+ 添加判定规则",
    condition: "判定条件",
    inputValue: "匹配目标值",
    resultColor: "判定颜色",
    greenColor: "实体翠绿（合格 / 通过 / 接受）",
    yellowColor: "实体琥珀黄（需审核 / 暂缓）",
    redColor: "实体绯红（拒绝 / 不合格）",
    requireCellFill: "需单元格原填充色完全一致",
    fallbackRule: "兜底回退配色策略",
    fallbackDesc: "当前层中无任何规则命中时的处理方案",
    runMatching: "执行智能比对引擎",
    matchingInProgress: "正在执行多列检索与规则判定...",
    kpiTotalRows: "待比对总行数",
    kpiPassed: "合格 / 翠绿",
    kpiReview: "需审核 / 琥珀",
    kpiRejected: "已拒绝 / 绯红",
    kpiMatchRate: "主键匹配成功率",
    filterAll: "全部行",
    filterGreen: "绿色（通过）",
    filterYellow: "黄色（审核）",
    filterRed: "红色（拒绝）",
    filterUnmatched: "未匹配基准行",
    filterBlue: "暂存",
    searchPlaceholder: "全字段关键词快速搜索...",
    exportExcel: "导出带样式 Excel (.xlsx)",
    exportCsv: "导出 CSV 文件",
    exporting: "正在生成导出表格...",
    showingRows: "显示行数",
    of: "共",
    rowsPerPage: "每页显示",
    prevPage: "上一页",
    nextPage: "下一页",
    noResultsFound: "未找到符合当前搜索或筛选条件的数据行。",
    matchedStatus: "匹配状态",
    matched: "已匹配基准表",
    unmatched: "基准表中未找到",
    reason: "判定原因",
    decisionLayer: "命中决策层",
    viewDetails: "行详情",
    rowDetails: "行数据双表比对详情",
    modalInspectionTitle: "完整检验与差异明细",
    modalMatchKey: "匹配键:",
    modalNotAvailable: "无",
    modalUnmatchedAnalysis: "未匹配差异分析",
    modalWhichUnmatched: "哪一条未匹配:",
    modalThisRecord: "本记录",
    modalPartialMismatch: "部分匹配（字段不同）",
    modalMissingInRef: "参考文件中缺失",
    modalReason: "原因:",
    modalIncomingKeyValues: "传入键值:",
    modalKeyColStatus: "关键列对比状态",
    modalMatch: "匹配",
    modalDiffer: "不同",
    modalIncoming: "传入:",
    modalReference: "参考:",
    modalNotFound: "未找到",
    modalMatchedSuccess: "已与参考记录成功匹配（键完全一致）",
    modalDecision: "判定:",
    modalReconciledCase: "已调和案例",
    modalReconcileTitle: "推迟 → 接受调和",
    modalReconcileBody: "本记录在{column}中原为{value}。由于存在具有相同键（{key}）的已接受记录，接受状态具有完全优先权：判定为通过，匹配为已匹配。",
    modalOverridingSource: "覆盖来源:",
    modalIncomingRecord: "传入比对记录",
    modalRowNum: "行 #",
    modalMismatch: "不匹配",
    modalMatchedRefRecord: "已匹配的参考记录",
    modalClosestCandidate: "最接近的参考候选",
    modalRefRecord: "参考记录",
    modalPartialMatch: "部分匹配",
    modalClosestDesc: "显示在参考目录中找到的最接近候选行以供对比：",
    modalMatchedBadge: "已匹配",
    modalDiffersBadge: "不同",
    modalZeroMatch: "参考文件中没有任何匹配记录",
    modalZeroMatchDesc: "参考数据集中没有包含键标识 {id} 的行。这是一条全新的传入记录。",
    modalStatus: "状态:",
    modalMatched: "已匹配",
    modalUnmatchedNew: "未匹配（新增）",
    modalLayer: "层:",
    shareTitle: "分享实时结果预览",
    shareDesc: "分享链接，让其他用户仅查看可交互的结果页面。",
    shareWhatSee: "其他用户将看到：",
    shareBullet1: "直接打开仅结果页面（无文件编辑或设置）。",
    shareBullet2: "包含完整的交互式筛选、实时搜索、列自定义以及 Excel / CSV 导出。",
    shareBullet3: "您的参考文件和匹配规则将得到安全保留。",
    shareFilterConfig: "预览筛选配置",
    sharePreselectFilter: "预选当前筛选器：",
    shareFilterAll: "所有已评估行",
    shareFilterGreen: "通过的行（绿色）",
    shareFilterYellow: "待复核的行（黄色）",
    shareFilterRed: "被拒绝的行（红色）",
    shareFilterUnmatched: "未匹配的行（紫色）",
    shareFilterBlue: "暂存的行（蓝色）",
    shareIncludeSearch: "包含当前搜索词：",
    shareLinkLabel: "可分享的预览链接",
    shareChars: "字符",
    shareCopyLink: "复制链接",
    shareCopied: "已复制！",
    shareCompressedNote: "超压缩链接（针对消息和邮件分享进行了优化）",
    shareDownloadHtml: "下载独立预览 (.html)",
    shareTestNow: "立即测试实时预览",
    shareCopiedToast: "实时预览链接已复制到剪贴板！",
    shareCopyFailToast: "复制链接失败，请手动选择并复制。",
    shareHtmlToast: "独立 HTML 预览已下载！任何人都可以在任何浏览器中打开。",
    colTitle: "列视图设置",
    colBadge: "移动与可见性",
    colDesc: "使用 \u2191 / \u2193 箭头重新排序列，并切换结果表和导出的可见性。",
    colSearchPh: "搜索列名...",
    colSyncExport: "导出与表格同步",
    colTabAll: "所有列",
    colTabData: "数据集",
    colTabRef: "参考",
    colTabSystem: "判定与审计",
    colShowAll: "全部显示",
    colKeyOnly: "仅关键列",
    colReset: "重置",
    colOrderName: "顺序 & 列名",
    colTable: "表格",
    colExport: "导出",
    colExcelExport: "Excel 导出",
    colAll: "全部",
    colNone: "无",
    colNoMatch: '没有与 "{q}" 匹配的列',
    colNoCols: "此视图中没有可用的列。",
    colClearFilter: "清除筛选",
    colRestoreAll: "恢复所有默认列",
    colActiveSummary: "当前：表格中有 {t} 列，导出中有 {e} 列",
    colSaveSync: "保存并同步列视图",
    colMoveUp: "将列前移",
    colMoveDown: "将列后移",
    colClearSearch: "清除列搜索",
    colToggleAllTable: "切换表格中的全部",
    colToggleAllExport: "切换导出中的全部",
    colKeepDecision: "仅保留判定 + 关键列",
    colRestoreDefaults: "恢复所有默认列和初始顺序",
    colAudit: "审计",
    colRef: "参考",
    colKeyRule: "关键规则",
    dpSheet: "工作表:",
    dpRows: "行",
    dpColumns: "列",
    dpSelectSheet: "选择工作表:",
    dpShowing: "正在显示 {n} 个筛选后的行",
    searchDataCells: "搜索数据单元格...",
    toastCloudRulesSynced: "云工作区已同步 — 规则与映射与其他设备一致。",
    toastCloudFilesSynced: "已从云端同步文件 — 此设备上的历史记录相同。",
    toastCloudResultsSynced: "已从云端同步结果。",
    gateTitle: "登录以同步您的工作区",
    gateDesc: "您的文件、设置和结果都安全地存储在云端。登录后即可在任何设备上从上次离开的地方继续工作。",
    gateSignIn: "使用 Google 登录",
    cloudDownloading: "从云端下载数据",
    cloudDownloadingSub: "正在同步文件、设置和结果…",
    toastCloudFilesUploaded: "文件已上传到云端。",
    toastCloudSettingsUploaded: "设置已上传到云端。",
    toastCloudSettingsSyncFailed: "设置上传到云端失败。",
    toastCloudResultsUploaded: "结果已上传到云端。",
    toastCloudResultsSyncFailed: "结果上传到云端失败。",
    syncUploading: "正在上传到云端…",
    syncPanelTitle: "同步状态与历史",
    syncAllSynced: "已全部同步",
    syncHistory: "历史记录",
    syncClearHistory: "清除历史",
    syncNoHistory: "暂无上传记录",
    syncFilesLabel: "文件",
    syncSettingsLabel: "设置",
    syncResultsLabel: "结果",
    syncReasonMappings: "列映射",
    syncReasonNormalization: "规范化规则",
    syncReasonLayers: "决策层",
    syncReasonHold: "Hold 设置",
    toastCloudFilesSyncFailed: "无法将您的文件同步到云端，将自动重试。",
    toastShareRevoked: "已关闭实时共享 — 正在显示最后收到的快照。",
    toastPreviewSynced: "预览已与最新更改同步。",
    toastSignInFailed: "Google 登录失败。",
    toastSignedOut: "已退出云同步。",
    toastRefLoadedRegen: "已加载 {name}！正在使用已保存的规则与逻辑设置重新生成结果和导出...",
    toastCompImported: "已导入 {name}！正在使用已保存的规则与逻辑设置生成结果和导出...",
    toastRefSheetSwitched: "已将主文件工作表切换为“{sheet}”（{rows} 行，{cols} 列）。正在更新结果...",
    toastRefSheetSwitchedDone: "已将主文件工作表切换为“{sheet}”（{rows} 行，{cols} 列）。",
    toastCompSheetSwitched: "已将传入文件工作表切换为“{sheet}”（{rows} 行，{cols} 列）。正在更新结果...",
    toastCompSheetSwitchedDone: "已将传入文件工作表切换为“{sheet}”（{rows} 行，{cols} 列）。",
    toastExitedPreview: "已退出实时预览模式，工作室完整控件已恢复。",
    toastRulesSaved: "规则与逻辑设置已保存！只需保存一次，今后导入文件时将自动评估并直接显示结果与导出。",
    toastSampleLoaded: "企业采购与检验示例已加载！正在评估...",
    toastBothFilesRequired: "需要同时提供参考工作簿和比对工作簿。",
    toastMappingRequired: "请在规则与逻辑设置中至少指定一个列映射。",
    toastEvaluatedSummary: "已评估 {total} 行：{green} 通过，{yellow} 待复核，{red} 被拒绝。",
    toastMatchingError: "匹配过程中发生错误。",
    toastPreviewRefreshed: "预览结果已刷新",
    previewNoResultsTitle: "暂无匹配结果",
    previewDownloading: "正在下载信息\u2026",
    previewPleaseWait: "请稍候",
    previewFixedEmptyTitle: "尚未发布预览",
    previewFixedEmptyDesc: "所有者尚未向此链接发布结果。发布后，最新结果将自动显示在这里。",
    previewNoResultsDesc: "共享的结果预览链接不包含结果数据，或链接已过期。",
    headerResultPreview: "结果预览",
    headerLiveTable: "· 实时交互表",
    headerSignedInTitle: "已登录为 {email} — 点击退出云同步",
    headerGoogleUser: "Google 用户",
    headerSynced: "已同步",
    headerSignInTitle: "使用 Google 登录以在设备间同步规则和实时预览",
    headerSync: "同步",
    headerSelectLanguage: "选择语言",
    headerRulesTitle: "配置映射键和判定规则（永久保存在浏览器中）",
    headerRulesShort: "设置",
    toastDismiss: "关闭",
    errorBoundaryTitle: "应用已从错误中恢复",
    errorBoundaryDesc: "呈现时发生意外异常。您可以安全地重新加载页面或重置工作区缓存。",
    errorBoundaryReload: "重新加载页面",
    errorBoundaryResetTitle: "清除已损坏的本地缓存并重新开始",
    errorBoundaryReset: "重置数据",
    loadingRestoreMessage: "正在恢复工作簿、列映射和判定规则...",
    loadingIndexedDbActive: "IndexedDB 运行中",
    loadingWorkspaceTitle: "正在加载企业工作区",
    close: "关闭",
    confirmReset: "确认重置基准工作簿？",
    confirmResetDesc: "此操作将清除浏览器本地保存的基准文件及缓存，需重新上传。",
    cancel: "取消",
    confirm: "确认重置",
    toastRefSaved: "基准工作簿已安全持久化至本地存储",
    toastRefReset: "基准工作簿已成功清空",
    toastAutoMapped: "已根据列名相似度自动完成映射",
    toastMatchedSuccess: "比对及决策规则评估执行完毕",
    toastExported: "已导出保留高对比度实体颜色样式的 Excel 表格",
    toastError: "处理数据时发生异常，请检查文件",
    conditionContains: "包含 (Contains)",
    conditionEquals: "等于 (Equals)",
    conditionStartsWith: "开头是 (Starts with)",
    conditionEndsWith: "结尾是 (Ends with)",
    conditionIsEmpty: "为空 (Is empty)",
    conditionIsNotEmpty: "不为空 (Is not empty)",
    conditionGreaterThan: "大于 (>)",
    conditionLessThan: "小于 (<)",
  }
};
