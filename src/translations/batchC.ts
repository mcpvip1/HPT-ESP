// Batch C translations: files management, column mapping rules, decision layers.
import { Language } from '../types';

export interface BatchCKeys {
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
  suggestionEngineTitle: string;
  suggestionEngineSubtitle: string;
  suggestionEngineBadge: string;
  suggestionEngineApplyAll: string;
  suggestionEngineApplyOne: string;
  suggestionEngineApplied: string;
  suggestionEngineActive: string;
  suggestionEngineReadyToMap: string;
  suggestionEngineNoSuggestions: string;
  suggestionEngineTabDesc: string;
  suggestionEngineConfidenceHigh: string;
  suggestionEngineConfidenceMed: string;
  suggestionEngineConfidenceLow: string;
  dashFilterStatusShowing: string;
  dashFilterStatusOf: string;
  dashFilterStatusRows: string;
  dashFilterStatusFiltered: string;
  dashFilterStatusAccepted: string;
  dashFilterStatusPostponed: string;
  dashFilterStatusRejected: string;
  dashFilterStatusHold: string;
  dashFilterStatusUnmatched: string;
  dashResetAllFilters: string;
  dashSyncStatusSynced: string;
  dashSyncStatusSyncing: string;
  dashForceSyncBtn: string;
  dashForceSyncTitle: string;
  dashForceSyncSuccess: string;
}

export const batchC: Record<Language, BatchCKeys> = {
  en: {
    filesOpeningFile: "Opening file...",
    filesSavingStorage: "Saving to secure storage...",
    filesLoadedNeedsRef: "Loaded {name} ({rows} rows). Please upload Reference file to complete evaluation.",
    filesMasterBaseline: "Master baseline dataset",
    filesProcessing: "Processing spreadsheet...",
    filesSelectMainSheet: "Select Main File Sheet:",
    filesSheetsCount: "{count} Sheets",
    filesActiveSheetLabel: "Active:",
    filesSelectRefSheetAria: "Select Reference File Sheet",
    filesSheetOption: "📄 {sheet} ({rows} rows · {cols} columns)",
    filesSingleSheet: "Single Sheet File",
    filesColumnsDetected: "Columns Detected ({count}):",
    filesMoreColumns: " +{count} more",
    filesIncomingDesc: "Dynamic file to inspect & classify",
    filesReadyToEvaluate: "READY TO EVALUATE",
    filesSelectIncomingSheet: "Select Incoming File Sheet:",
    filesSelectCompSheetAria: "Select Comparison File Sheet",
    excelReadingBuffer: "Reading file buffer...",
    excelDecompressing: "Decompressing spreadsheet...",
    excelReadingSheet: "Reading sheet \"{sheet}\" ({n} of {total})...",
    excelDone: "Done",
    mapSummaryMore: " (+{count} more)",
    mapNeedBothFiles: "Please upload both files first to auto-map columns.",
    mapAutoMappedCount: "({count} columns matched)",
    mapNoMatchesFound: "No obvious column matches detected. Please select columns manually.",
    mapNeedMappingFirst: "Add at least one column mapping before saving a preset.",
    mapDefaultPresetName: "Mapping Preset ({cols})",
    mapPairCount: "{count} column pair(s)",
    mapPresetSaved: "Saved mapping preset \"{name}\"!",
    mapPresetSaveFailed: "Failed to save mapping preset.",
    mapPresetApplied: "Applied preset \"{name}\": {total} mappings loaded ({mainFound}/{total} ref, {compFound}/{total} comp matched).",
    mapPresetDeleted: "Preset deleted.",
    mapPresetDeleteFailed: "Failed to delete preset.",
    mapTplPoName: "PO & Order Number Matching",
    mapTplPoDesc: "Matches Purchase Order numbers and Part numbers",
    mapTplSerialName: "Part Number & Serial Key",
    mapTplSerialDesc: "Unique identification by part and serial tracking ID",
    mapTplInvoiceName: "Invoice & Vendor Code",
    mapTplInvoiceDesc: "Accounts payable reconciliation by Invoice ID and Vendor Code",
    mapPresetsBtnTitle: "View saved recent column mapping keys and industry templates",
    mapSavedRecentKeys: "Saved & Recent Keys",
    mapSaveKeysBtnTitle: "Save current column mapping keys as a preset",
    mapSaveKeys: "Save Keys",
    mapRecentKeys: "Recent Keys:",
    mapRecentMappingName: "Recent Mapping",
    mapRestoreLastUsed: "Restore Last Used",
    mapDeleteMappingAria: "Delete mapping",
    mapNormSectionDesc: "Pre-processing filters applied to keys before comparison",
    mapSaveDialogTitle: "Save Current Mapping Keys",
    mapPresetNameLabel: "Preset Name",
    mapPresetNamePh: "e.g. PO & Inspection Key Pair",
    mapWillSavePairs: "Will save {count} column pair(s):",
    mapSavePreset: "Save Preset",
    mapPresetsModalTitle: "Saved & Recent Column Mapping Keys",
    mapPresetsModalDesc: "Quickly restore previously used column key pairs or standard templates.",
    mapTabSaved: "Saved Presets ({count})",
    mapTabRecent: "Recent History ({count})",
    mapTabTemplates: "Industry Templates ({count})",
    mapColCountBadge: "{count} column(s)",
    mapAllInFiles: "100% in files",
    mapSavedOn: "Saved {date}",
    mapDeletePresetTitle: "Delete preset",
    mapApplyPreset: "Apply Preset",
    mapNoPresets: "No custom presets saved yet.",
    mapNoPresetsHint: "Configure your columns above and click \"Save Keys\" to store them here.",
    mapRecentSession: "Recent Session #{n}",
    mapAutoSaved: "Auto-Saved",
    mapNoHistory: "No recent history recorded yet.",
    mapUseTemplate: "Use Template",
    mapPresetsStoredNote: "All presets are stored safely in local browser storage.",
    mapRestore: "Restore",
    layerDefaultName: "Decision Layer {n}",
    layerRuleAccepted: "Accepted Item",
    layerRuleReview: "Requires Review",
    layerRuleRejected: "Rejected Defect",
    layerRuleDefinition: "Rule Definition",
    layerInspectionPresetName: "Inspection Decision (Waive / Accept → Green, Else → Yellow)",
    layerRuleContains: "{col} contains \"{val}\"",
    layerRuleEitherContains: "Either contains \"{val}\"",
    layerDefaultPresetName: "Decision Rule Set ({name})",
    layerPresetDesc: "{layers} layer(s), {rules} rules",
    layerTplInspectionDesc: "If Inspection Status has \"Waive\" or Result has \"Accept\" → Green; otherwise Yellow review.",
    layerTplQaName: "Quality Assurance 3-Tier (Accept / Review / Reject)",
    layerTplQaDesc: "Full triage with Accept (Green), Pending/Review (Yellow), and Reject/Defect (Red).",
    layerTplQaLayerName: "QA 3-Tier Outcome",
    layerTplAcceptedPass: "Accepted Pass",
    layerTplNeedsReview: "Needs Engineering Review",
    layerTplStrictName: "Strict Pass / Fail Verification",
    layerTplStrictDesc: "Binary gatekeeper: exact \"Pass\" or \"Approved\" is Green, anything else triggers Red alert.",
    layerTplStrictLayerName: "Strict Compliance Gate",
    layerTplPassed: "Passed Inspection",
    layerTplApproved: "Officially Approved",
    layerPresetsBtnTitle: "View saved recent decision layers (hierarchical rules)",
    layerSavedRecentRules: "Saved & Recent Rules",
    layerSaveRulesBtnTitle: "Save current hierarchical decision rules as a named preset",
    layerSaveRules: "Save Rules",
    layerActiveRuleTitle: "Active Decision Rule: Waive or Accept → Green, Else → Yellow",
    layerActiveRuleDesc1: "If {col} contains {val} → Green.",
    layerActiveRuleDesc2: "Otherwise, if {col} contains {val} → Green.",
    layerActiveRuleDesc3: "If neither rule matches → Yellow.",
    layerResetStandardRule: "Reset to Standard Rule",
    layerMoveUpTitle: "Move Layer Up in Hierarchy",
    layerMoveDownTitle: "Move Layer Down in Hierarchy",
    layerDeleteLayerTitle: "Delete Decision Layer",
    layerPrimaryColumn: "Primary Evaluation Column",
    layerSecondaryColumn: "Secondary Column (Optional Multi-Column)",
    layerNoSecondary: "-- None (Single Column) --",
    layerComboLogic: "Evaluation Combination Logic",
    layerLogicOr: "OR (Either condition matches)",
    layerLogicAnd: "AND (Both conditions match)",
    layerValueRules: "Value Rules ({count})",
    layerTargetAny: "Either Col",
    layerTargetPrimary: "Primary Col",
    layerTargetSecondary: "Secondary Col",
    layerValuePlaceholder: "e.g. \"Waive\" or \"Accept\"",
    layerColorGreen: "Green (Passed / Waive)",
    layerColorYellow: "Yellow (Review)",
    layerColorRed: "Red (Rejected Defect)",
    layerDeleteRuleTitle: "Delete Rule",
    layerUseOriginalFill: "Use original cell fill when no value rule matches",
    layerIfNoRuleMatch: "If no rule matches:",
    layerFallbackNone: "No highlight",
    layerFallbackYellow: "Yellow Highlight",
    layerFallbackRed: "Red Highlight",
    layerFallbackGreen: "Green Highlight",
    layerHierarchyHint: "Rules evaluate hierarchically; first matching rule styles the row.",
    layerSaveDialogTitle: "Save Current Decision Layers",
    layerPresetNameLabel: "Preset Name",
    layerPresetNamePh: "e.g. Standard Inspection QA Rules",
    layerWillSave: "Will save {layers} decision layer(s) containing {rules} total rules.",
    layerSavePreset: "Save Preset",
    layerPresetsModalTitle: "Saved & Recent Decision Layers (Hierarchical Rules)",
    layerPresetsModalDesc: "Switch between saved rule presets, restore recent sessions, or apply industry standards.",
    layerTabSaved: "Saved Presets ({count})",
    layerTabRecent: "Recent History ({count})",
    layerTabStandard: "Standard Rules ({count})",
    layerCountBadge: "{count} layer(s)",
    layerSavedOn: "Saved {date}",
    layerDeletePresetTitle: "Delete preset",
    layerApplyRules: "Apply Rules",
    layerNoPresets: "No custom decision rule presets saved yet.",
    layerNoPresetsHint: "Customize your decision layers above and click \"Save Rules\" to save them.",
    layerRecentState: "Recent Rule State #{n}",
    layerAutoSaved: "Auto-Saved",
    layerNoHistory: "No recent rule history recorded yet.",
    layerTemplateMeta: "{layers} layer · {rules} value rules",
    layerApplyRule: "Apply Rule",
    layerFooterNote: "Decision layers evaluate in sequence from top to bottom.",
    suggestionEngineTitle: "Suggestion Engine",
    suggestionEngineSubtitle: "Analyzes headers using enterprise & industry terminology (Financial, Procurement, Inventory, Dates, Quantities)",
    suggestionEngineBadge: "Suggestions",
    suggestionEngineApplyAll: "Apply All Suggestions",
    suggestionEngineApplyOne: "Apply",
    suggestionEngineApplied: "Applied",
    suggestionEngineActive: "Active Mapping",
    suggestionEngineReadyToMap: "Ready to Map",
    suggestionEngineNoSuggestions: "No new column suggestions found",
    suggestionEngineTabDesc: "AI-assisted column mapping proposing industry synonyms (e.g. 'Amt', 'Total', 'Net' to Value).",
    suggestionEngineConfidenceHigh: "High Match",
    suggestionEngineConfidenceMed: "Medium Match",
    suggestionEngineConfidenceLow: "Low Match",
    dashFilterStatusShowing: "Showing",
    dashFilterStatusOf: "of",
    dashFilterStatusRows: "rows",
    dashFilterStatusFiltered: "Showing {count} of {total} rows",
    dashFilterStatusAccepted: "{count} Accepted",
    dashFilterStatusPostponed: "{count} Postponed",
    dashFilterStatusRejected: "{count} Rejected",
    dashFilterStatusHold: "{count} On Hold",
    dashFilterStatusUnmatched: "{count} Unmatched",
    dashResetAllFilters: "Reset all view filters",
    dashSyncStatusSynced: "Preview Synced",
    dashSyncStatusSyncing: "Syncing Preview...",
    dashForceSyncBtn: "Force Sync",
    dashForceSyncTitle: "Immediately push current filters, search terms, and active columns to the preview link snapshot (cloud-id: latest)",
    dashForceSyncSuccess: "Dashboard view state successfully synced to preview snapshot (cloud-id: latest)",
  },
  my: {
    filesOpeningFile: "ဖိုင်ကို ဖွင့်နေသည်...",
    filesSavingStorage: "လုံခြုံသော သိုလှောင်မှုသို့ သိမ်းဆည်းနေသည်...",
    filesLoadedNeedsRef: "{name} ကို ဖွင့်ပြီးပြီ ({rows} အတန်း)။ အကဲဖြတ်မှု ပြီးမြောက်ရန် Reference ဖိုင်ကို ထည့်သွင်းပါ။",
    filesMasterBaseline: "အခြေခံ အချက်အလက် မူရင်း",
    filesProcessing: "စာရင်းဇယားကို လုပ်ဆောင်နေသည်...",
    filesSelectMainSheet: "Main File စာရွက် ရွေးချယ်ရန်:",
    filesSheetsCount: "စာရွက် {count} ရွက်",
    filesActiveSheetLabel: "လက်ရှိ:",
    filesSelectRefSheetAria: "Reference ဖိုင် စာရွက် ရွေးချယ်ရန်",
    filesSheetOption: "📄 {sheet} ({rows} အတန်း · {cols} ကော်လံ)",
    filesSingleSheet: "စာရွက်တစ်ခုတည်း ဖိုင်",
    filesColumnsDetected: "တွေ့ရှိသော ကော်လံများ ({count}):",
    filesMoreColumns: " +{count} ခု ကျန်",
    filesIncomingDesc: "စစ်ဆေး & အမျိုးအစားခွဲရန် ပြောင်းလဲနေသော ဖိုင်",
    filesReadyToEvaluate: "အကဲဖြတ်ရန် အသင့်",
    filesSelectIncomingSheet: "Incoming ဖိုင် စာရွက် ရွေးချယ်ရန်:",
    filesSelectCompSheetAria: "နှိုင်းယှဉ် ဖိုင် စာရွက် ရွေးချယ်ရန်",
    excelReadingBuffer: "ဖိုင် buffer ကို ဖတ်နေသည်...",
    excelDecompressing: "စာရင်းဇယားကို ဖြည်နေသည်...",
    excelReadingSheet: "စာရွက် \"{sheet}\" ကို ဖတ်နေသည် ({n}/{total})...",
    excelDone: "ပြီးပြီ",
    mapSummaryMore: " (+{count} ခု ကျန်)",
    mapNeedBothFiles: "ကော်လံများ အလိုအလျောက် မြေပုံဆွဲရန် ဖိုင်နှစ်ခုလုံး အရင် ထည့်သွင်းပါ။",
    mapAutoMappedCount: "(ကော်လံ {count} ခု ကိုက်ညီသည်)",
    mapNoMatchesFound: "သိသာသော ကော်လံ ကိုက်ညီမှုများ မတွေ့ပါ။ ကိုယ်တိုင် ကော်လံများ ရွေးချယ်ပါ။",
    mapNeedMappingFirst: "preset မသိမ်းဆည်းမီ ကော်လံမြေပုံ အနည်းဆုံး တစ်ခု ထည့်ပါ။",
    mapDefaultPresetName: "မြေပုံ Preset ({cols})",
    mapPairCount: "ကော်လံအတွဲ {count} ခု",
    mapPresetSaved: "မြေပုံ preset \"{name}\" သိမ်းဆည်းပြီးပြီ!",
    mapPresetSaveFailed: "မြေပုံ preset သိမ်းဆည်း၍ မရပါ။",
    mapPresetApplied: "preset \"{name}\" အသုံးချပြီးပြီ- မြေပုံ {total} ခု ဖွင့်ပြီးပြီ (အခြေခံ {mainFound}/{total}၊ နှိုင်းယှဉ် {compFound}/{total} ကိုက်ညီသည်)။",
    mapPresetDeleted: "Preset ဖျက်ပြီးပြီ။",
    mapPresetDeleteFailed: "Preset ဖျက်၍ မရပါ။",
    mapTplPoName: "PO နှင့် အော်ဒါနံပါတ် ကိုက်ညီမှု",
    mapTplPoDesc: "ဝယ်ယူမှု အော်ဒါနံပါတ်များနှင့် ပစ္စည်းနံပါတ်များကို ကိုက်ညီစေသည်",
    mapTplSerialName: "ပစ္စည်းနံပါတ်နှင့် Serial သော့",
    mapTplSerialDesc: "ပစ္စည်းနှင့် serial ခြေရာခံ ID ဖြင့် တစ်မူထူး ဖော်ထုတ်ခြင်း",
    mapTplInvoiceName: "ပြေစာနှင့် ရောင်းချသူ ကုဒ်",
    mapTplInvoiceDesc: "ပြေစာ ID နှင့် ရောင်းချသူ ကုဒ်ဖြင့် ပေးချေရမည့် စာရင်းများ ပြန်လည်ကိုက်ညီစေခြင်း",
    mapPresetsBtnTitle: "သိမ်းဆည်းထားသော မကြာသေးမီ ကော်လံမြေပုံသော့များနှင့် လုပ်ငန်းစံ ပုံစံများ ကြည့်ရန်",
    mapSavedRecentKeys: "သိမ်းဆည်းထားသော & မကြာသေးမီ သော့များ",
    mapSaveKeysBtnTitle: "လက်ရှိ ကော်လံမြေပုံသော့များကို preset အဖြစ် သိမ်းဆည်းရန်",
    mapSaveKeys: "သော့များ သိမ်းဆည်းရန်",
    mapRecentKeys: "မကြာသေးမီ သော့များ:",
    mapRecentMappingName: "မကြာသေးမီ မြေပုံ",
    mapRestoreLastUsed: "နောက်ဆုံး အသုံးပြုခဲ့သည်ကို ပြန်လည်ရယူရန်",
    mapDeleteMappingAria: "မြေပုံ ဖျက်ရန်",
    mapNormSectionDesc: "နှိုင်းယှဉ်မှုမပြုမီ သော့များအပေါ် အသုံးချသော ကြိုတင် စစ်ထုတ်မှုများ",
    mapSaveDialogTitle: "လက်ရှိ မြေပုံသော့များ သိမ်းဆည်းရန်",
    mapPresetNameLabel: "Preset အမည်",
    mapPresetNamePh: "ဥပမာ- PO & စစ်ဆေးရေး သော့အတွဲ",
    mapWillSavePairs: "ကော်လံအတွဲ {count} ခု သိမ်းဆည်းမည်:",
    mapSavePreset: "Preset သိမ်းဆည်းရန်",
    mapPresetsModalTitle: "သိမ်းဆည်းထားသော & မကြာသေးမီ ကော်လံမြေပုံသော့များ",
    mapPresetsModalDesc: "အရင်က အသုံးပြုခဲ့သော ကော်လံသော့အတွဲများ သို့မဟုတ် စံပုံစံများကို အမြန် ပြန်လည်ရယူပါ။",
    mapTabSaved: "သိမ်းဆည်းထားသော Preset များ ({count})",
    mapTabRecent: "မကြာသေးမီ မှတ်တမ်း ({count})",
    mapTabTemplates: "လုပ်ငန်း ပုံစံများ ({count})",
    mapColCountBadge: "ကော်လံ {count} ခု",
    mapAllInFiles: "ဖိုင်များတွင် 100%",
    mapSavedOn: "{date} တွင် သိမ်းဆည်းပြီးပြီ",
    mapDeletePresetTitle: "Preset ဖျက်ရန်",
    mapApplyPreset: "Preset အသုံးချရန်",
    mapNoPresets: "စိတ်ကြိုက် preset များ မသိမ်းဆည်းရသေးပါ။",
    mapNoPresetsHint: "အထက်တွင် ကော်လံများ ပြင်ဆင်ပြီး \"သော့များ သိမ်းဆည်းရန်\" ကို နှိပ်ပါ။",
    mapRecentSession: "မကြာသေးမီ Session #{n}",
    mapAutoSaved: "အလိုအလျောက် သိမ်းဆည်းပြီးပြီ",
    mapNoHistory: "မကြာသေးမီ မှတ်တမ်း မရှိသေးပါ။",
    mapUseTemplate: "ပုံစံ အသုံးပြုရန်",
    mapPresetsStoredNote: "Preset အားလုံး ဘရောင်ဇာ သိုလှောင်မှုတွင် လုံခြုံစွာ သိမ်းဆည်းထားသည်။",
    mapRestore: "ပြန်လည်ရယူရန်",
    layerDefaultName: "ဆုံးဖြတ်ချက် အလွှာ {n}",
    layerRuleAccepted: "လက်ခံထားသော ပစ္စည်း",
    layerRuleReview: "ပြန်လည်သုံးသပ်ရန် လိုအပ်သည်",
    layerRuleRejected: "ပယ်ချထားသော ချို့ယွင်းချက်",
    layerRuleDefinition: "စည်းမျဉ်း သတ်မှတ်ချက်",
    layerInspectionPresetName: "စစ်ဆေးရေး ဆုံးဖြတ်ချက် (Waive / Accept → အစိမ်း၊ မဟုတ်ပါက → အဝါ)",
    layerRuleContains: "{col} တွင် \"{val}\" ပါဝင်သည်",
    layerRuleEitherContains: "\"{val}\" ပါဝင်သည့် တစ်ခုခု",
    layerDefaultPresetName: "ဆုံးဖြတ်ချက် စည်းမျဉ်းအစု ({name})",
    layerPresetDesc: "အလွှာ {layers} ခု၊ စည်းမျဉ်း {rules} ခု",
    layerTplInspectionDesc: "စစ်ဆေးရေး အခြေအနေတွင် \"Waive\" သို့မဟုတ် ရလဒ်တွင် \"Accept\" ပါရှိလျှင် → အစိမ်း၊ မဟုတ်ပါက အဝါ ပြန်လည်သုံးသပ်ရန်။",
    layerTplQaName: "အရည်အသွေး အာမခံချက် 3-အဆင့် (လက်ခံ / ပြန်လည်သုံးသပ် / ပယ်ချ)",
    layerTplQaDesc: "လက်ခံ (အစိမ်း)၊ ပြန်လည်သုံးသပ် (အဝါ) နှင့် ပယ်ချ/ချို့ယွင်းချက် (အနီ) တို့ဖြင့် အပြည့်အစုံ ခွဲခြားခြင်း။",
    layerTplQaLayerName: "QA 3-အဆင့် ရလဒ်",
    layerTplAcceptedPass: "လက်ခံပြီး အောင်မြင်သည်",
    layerTplNeedsReview: "အင်ဂျင်နီယာ ပြန်လည်သုံးသပ်ရန် လိုအပ်သည်",
    layerTplStrictName: "တင်းကျပ်သော အောင် / ရှုံး စစ်ဆေးခြင်း",
    layerTplStrictDesc: "နှစ်ခု ရွေးချယ်စရာ တံခါး- \"Pass\" သို့မဟုတ် \"Approved\" အတိအကျသာ အစိမ်း၊ ကျန်အားလုံး အနီ သတိပေးချက်။",
    layerTplStrictLayerName: "တင်းကျပ်သော လိုက်နာမှု တံခါး",
    layerTplPassed: "စစ်ဆေးပြီး အောင်မြင်သည်",
    layerTplApproved: "တရားဝင် အတည်ပြုပြီးပြီ",
    layerPresetsBtnTitle: "သိမ်းဆည်းထားသော မကြာသေးမီ ဆုံးဖြတ်ချက် အလွှာများ (အဆင့်လိုက် စည်းမျဉ်းများ) ကြည့်ရန်",
    layerSavedRecentRules: "သိမ်းဆည်းထားသော & မကြာသေးမီ စည်းမျဉ်းများ",
    layerSaveRulesBtnTitle: "လက်ရှိ အဆင့်လိုက် ဆုံးဖြတ်ချက် စည်းမျဉ်းများကို အမည်ပေး preset အဖြစ် သိမ်းဆည်းရန်",
    layerSaveRules: "စည်းမျဉ်းများ သိမ်းဆည်းရန်",
    layerActiveRuleTitle: "လက်ရှိ ဆုံးဖြတ်ချက် စည်းမျဉ်း- Waive သို့မဟုတ် Accept → အစိမ်း၊ မဟုတ်ပါက → အဝါ",
    layerActiveRuleDesc1: "{col} တွင် {val} ပါဝင်လျှင် → အစိမ်း။",
    layerActiveRuleDesc2: "မဟုတ်ပါက၊ {col} တွင် {val} ပါဝင်လျှင် → အစိမ်း။",
    layerActiveRuleDesc3: "စည်းမျဉ်းတစ်ခုမှ မကိုက်ညီပါက → အဝါ။",
    layerResetStandardRule: "စံ စည်းမျဉ်းသို့ ပြန်လည်သတ်မှတ်ရန်",
    layerMoveUpTitle: "အလွှာကို အထက် ရွှေ့ရန်",
    layerMoveDownTitle: "အလွှာကို အောက် ရွှေ့ရန်",
    layerDeleteLayerTitle: "ဆုံးဖြတ်ချက် အလွှာ ဖျက်ရန်",
    layerPrimaryColumn: "အဓိက အကဲဖြတ် ကော်လံ",
    layerSecondaryColumn: "ဒုတိယ ကော်လံ (ရွေးချယ်ခွင့် ကော်လံစုံ)",
    layerNoSecondary: "-- မရှိ (ကော်လံတစ်ခုတည်း) --",
    layerComboLogic: "အကဲဖြတ် ပေါင်းစပ်ယုတ္တိဗေဒ",
    layerLogicOr: "OR (အခြေအနေ တစ်ခုခု ကိုက်ညီသည်)",
    layerLogicAnd: "AND (အခြေအနေ နှစ်ခုလုံး ကိုက်ညီသည်)",
    layerValueRules: "တန်ဖိုး စည်းမျဉ်းများ ({count})",
    layerTargetAny: "ကော်လံတစ်ခုခု",
    layerTargetPrimary: "အဓိက ကော်လံ",
    layerTargetSecondary: "ဒုတိယ ကော်လံ",
    layerValuePlaceholder: "ဥပမာ- \"Waive\" သို့မဟုတ် \"Accept\"",
    layerColorGreen: "အစိမ်း (အောင်မြင် / Waive)",
    layerColorYellow: "အဝါ (ပြန်လည်သုံးသပ်ရန်)",
    layerColorRed: "အနီ (ပယ်ချထားသော ချို့ယွင်းချက်)",
    layerDeleteRuleTitle: "စည်းမျဉ်း ဖျက်ရန်",
    layerUseOriginalFill: "တန်ဖိုး စည်းမျဉ်းနှင့် မကိုက်ညီပါက မူရင်း ဆဲလ် ဖြည့်စွက်မှုကို အသုံးပြုရန်",
    layerIfNoRuleMatch: "စည်းမျဉ်းနှင့် မကိုက်ညီပါက:",
    layerFallbackNone: "အသားပေး မပြပါ",
    layerFallbackYellow: "အဝါ အသားပေးပြရန်",
    layerFallbackRed: "အနီ အသားပေးပြရန်",
    layerFallbackGreen: "အစိမ်း အသားပေးပြရန်",
    layerHierarchyHint: "စည်းမျဉ်းများသည် အဆင့်လိုက် အကဲဖြတ်သည်။ ပထမဆုံး ကိုက်ညီသော စည်းမျဉ်းက အတန်းကို ပုံစံချမည်။",
    layerSaveDialogTitle: "လက်ရှိ ဆုံးဖြတ်ချက် အလွှာများ သိမ်းဆည်းရန်",
    layerPresetNameLabel: "Preset အမည်",
    layerPresetNamePh: "ဥပမာ- စံ စစ်ဆေးရေး QA စည်းမျဉ်းများ",
    layerWillSave: "ဆုံးဖြတ်ချက် အလွှာ {layers} ခု၊ စုစုပေါင်း စည်းမျဉ်း {rules} ခု သိမ်းဆည်းမည်။",
    layerSavePreset: "Preset သိမ်းဆည်းရန်",
    layerPresetsModalTitle: "သိမ်းဆည်းထားသော & မကြာသေးမီ ဆုံးဖြတ်ချက် အလွှာများ (အဆင့်လိုက် စည်းမျဉ်းများ)",
    layerPresetsModalDesc: "သိမ်းဆည်းထားသော စည်းမျဉ်း preset များအကြား ပြောင်းပါ၊ မကြာသေးမီ session များ ပြန်လည်ရယူပါ သို့မဟုတ် လုပ်ငန်းစံများ အသုံးချပါ။",
    layerTabSaved: "သိမ်းဆည်းထားသော Preset များ ({count})",
    layerTabRecent: "မကြာသေးမီ မှတ်တမ်း ({count})",
    layerTabStandard: "စံ စည်းမျဉ်းများ ({count})",
    layerCountBadge: "အလွှာ {count} ခု",
    layerSavedOn: "{date} တွင် သိမ်းဆည်းပြီးပြီ",
    layerDeletePresetTitle: "Preset ဖျက်ရန်",
    layerApplyRules: "စည်းမျဉ်းများ အသုံးချရန်",
    layerNoPresets: "စိတ်ကြိုက် ဆုံးဖြတ်ချက် စည်းမျဉ်း preset များ မသိမ်းဆည်းရသေးပါ။",
    layerNoPresetsHint: "အထက်တွင် ဆုံးဖြတ်ချက် အလွှာများ စိတ်ကြိုက်ပြင်ဆင်ပြီး \"စည်းမျဉ်းများ သိမ်းဆည်းရန်\" ကို နှိပ်ပါ။",
    layerRecentState: "မကြာသေးမီ စည်းမျဉ်း အခြေအနေ #{n}",
    layerAutoSaved: "အလိုအလျောက် သိမ်းဆည်းပြီးပြီ",
    layerNoHistory: "မကြာသေးမီ စည်းမျဉ်း မှတ်တမ်း မရှိသေးပါ။",
    layerTemplateMeta: "အလွှာ {layers} ခု · တန်ဖိုး စည်းမျဉ်း {rules} ခု",
    layerApplyRule: "စည်းမျဉ်း အသုံးချရန်",
    layerFooterNote: "ဆုံးဖြတ်ချက် အလွှာများသည် အပေါ်မှ အောက်သို့ အစီအစဉ်လိုက် အကဲဖြတ်သည်။",
    suggestionEngineTitle: "အကြံပြုချက် အင်ဂျင်",
    suggestionEngineSubtitle: "လုပ်ငန်းသုံး & ဘဏ္ဍာရေး အခေါ်အဝေါ်များသုံးပြီး ခေါင်းစဉ်များကို လေ့လာအကြံပြုသည်",
    suggestionEngineBadge: "အကြံပြုချက်များ",
    suggestionEngineApplyAll: "အကြံပြုချက်အားလုံး အသုံးပြုရန်",
    suggestionEngineApplyOne: "အသုံးပြုရန်",
    suggestionEngineApplied: "အသုံးပြုပြီးပြီ",
    suggestionEngineActive: "လက်ရှိ တွဲစပ်ထားမှု",
    suggestionEngineReadyToMap: "တွဲစပ်ရန် အဆင်သင့်",
    suggestionEngineNoSuggestions: "ကော်လံ အကြံပြုချက် အသစ်မရှိပါ",
    suggestionEngineTabDesc: "လုပ်ငန်းသုံး အခေါ်အဝေါ်များအပေါ် အခြေခံပြီး ကော်လံတွဲစပ်မှု အကြံပြုချက်များ။",
    suggestionEngineConfidenceHigh: "အလွန်ကိုက်ညီမှု",
    suggestionEngineConfidenceMed: "အလယ်အလတ် ကိုက်ညီမှု",
    suggestionEngineConfidenceLow: "အနည်းငယ် ကိုက်ညီမှု",
    dashFilterStatusShowing: "ပြသနေသည်",
    dashFilterStatusOf: "မှ",
    dashFilterStatusRows: "အတန်း",
    dashFilterStatusFiltered: "အတန်း {total} ခုမှ {count} ခု ပြသနေသည်",
    dashFilterStatusAccepted: "{count} ခု အောင်မြင် (Accepted)",
    dashFilterStatusPostponed: "{count} ခု ရွှေ့ဆိုင်း (Postponed)",
    dashFilterStatusRejected: "{count} ခု ပယ်ချ (Rejected)",
    dashFilterStatusHold: "{count} ခု ဆိုင်းငံ့ (Hold)",
    dashFilterStatusUnmatched: "{count} ခု မကိုက်ညီ (Unmatched)",
    dashResetAllFilters: "စစ်ထုတ်မှု အားလုံး ပြန်လည်သတ်မှတ်ရန်",
    dashSyncStatusSynced: "Preview ချိတ်ဆက်ပြီးပြီ",
    dashSyncStatusSyncing: "Preview ချိတ်ဆက်နေသည်...",
    dashForceSyncBtn: "အမြန် စင့်ခ်လုပ်ရန်",
    dashForceSyncTitle: "လက်ရှိ စစ်ထုတ်မှုများနှင့် ကော်လံများကို Preview လင့်ခ် snapshot သို့ ချက်ချင်း ပေးပို့ရန်",
    dashForceSyncSuccess: "Dashboard အခြေအနေကို Preview လင့်ခ် (cloud-id: latest) သို့ အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ",
  },
  th: {
    filesOpeningFile: "กำลังเปิดไฟล์...",
    filesSavingStorage: "กำลังบันทึกไปยังที่เก็บข้อมูลที่ปลอดภัย...",
    filesLoadedNeedsRef: "โหลด {name} แล้ว ({rows} แถว) โปรดอัปโหลดไฟล์อ้างอิงเพื่อให้การประเมินสมบูรณ์",
    filesMasterBaseline: "ชุดข้อมูลพื้นฐานหลัก",
    filesProcessing: "กำลังประมวลผลสเปรดชีต...",
    filesSelectMainSheet: "เลือกชีตไฟล์หลัก:",
    filesSheetsCount: "{count} ชีต",
    filesActiveSheetLabel: "ใช้งานอยู่:",
    filesSelectRefSheetAria: "เลือกชีตไฟล์อ้างอิง",
    filesSheetOption: "📄 {sheet} ({rows} แถว · {cols} คอลัมน์)",
    filesSingleSheet: "ไฟล์ชีตเดียว",
    filesColumnsDetected: "ตรวจพบคอลัมน์ ({count}):",
    filesMoreColumns: " +อีก {count} รายการ",
    filesIncomingDesc: "ไฟล์แบบไดนามิกสำหรับตรวจสอบ & จัดประเภท",
    filesReadyToEvaluate: "พร้อมประเมิน",
    filesSelectIncomingSheet: "เลือกชีตไฟล์ขาเข้า:",
    filesSelectCompSheetAria: "เลือกชีตไฟล์เปรียบเทียบ",
    excelReadingBuffer: "กำลังอ่านบัฟเฟอร์ไฟล์...",
    excelDecompressing: "กำลังคลายการบีบอัดสเปรดชีต...",
    excelReadingSheet: "กำลังอ่านชีต \"{sheet}\" ({n} จาก {total})...",
    excelDone: "เสร็จสิ้น",
    mapSummaryMore: " (+อีก {count} รายการ)",
    mapNeedBothFiles: "โปรดอัปโหลดทั้งสองไฟล์ก่อนเพื่อแมปคอลัมน์อัตโนมัติ",
    mapAutoMappedCount: "(ตรงกัน {count} คอลัมน์)",
    mapNoMatchesFound: "ไม่พบคอลัมน์ที่ตรงกันอย่างชัดเจน โปรดเลือกคอลัมน์ด้วยตนเอง",
    mapNeedMappingFirst: "เพิ่มการแมปคอลัมน์อย่างน้อยหนึ่งรายการก่อนบันทึกพรีเซ็ต",
    mapDefaultPresetName: "พรีเซ็ตการแมป ({cols})",
    mapPairCount: "{count} คู่คอลัมน์",
    mapPresetSaved: "บันทึกพรีเซ็ตการแมป \"{name}\" แล้ว!",
    mapPresetSaveFailed: "บันทึกพรีเซ็ตการแมปล้มเหลว",
    mapPresetApplied: "ใช้พรีเซ็ต \"{name}\" แล้ว: โหลดการแมป {total} รายการ (อ้างอิง {mainFound}/{total}, เปรียบเทียบ {compFound}/{total} ตรงกัน)",
    mapPresetDeleted: "ลบพรีเซ็ตแล้ว",
    mapPresetDeleteFailed: "ลบพรีเซ็ตล้มเหลว",
    mapTplPoName: "การจับคู่เลขที่ PO & เลขที่คำสั่งซื้อ",
    mapTplPoDesc: "จับคู่เลขที่ใบสั่งซื้อและเลขที่ชิ้นส่วน",
    mapTplSerialName: "เลขที่ชิ้นส่วน & คีย์ซีเรียล",
    mapTplSerialDesc: "การระบุเฉพาะด้วยชิ้นส่วนและรหัสติดตามซีเรียล",
    mapTplInvoiceName: "ใบแจ้งหนี้ & รหัสผู้ขาย",
    mapTplInvoiceDesc: "การกระทบยอดเจ้าหนี้ด้วยรหัสใบแจ้งหนี้และรหัสผู้ขาย",
    mapPresetsBtnTitle: "ดูคีย์การแมปคอลัมน์ที่บันทึกล่าสุดและเทมเพลตอุตสาหกรรม",
    mapSavedRecentKeys: "คีย์ที่บันทึก & ล่าสุด",
    mapSaveKeysBtnTitle: "บันทึกคีย์การแมปคอลัมน์ปัจจุบันเป็นพรีเซ็ต",
    mapSaveKeys: "บันทึกคีย์",
    mapRecentKeys: "คีย์ล่าสุด:",
    mapRecentMappingName: "การแมปล่าสุด",
    mapRestoreLastUsed: "กู้คืนที่ใช้ล่าสุด",
    mapDeleteMappingAria: "ลบการแมป",
    mapNormSectionDesc: "ตัวกรองก่อนการประมวลผลที่ใช้กับคีย์ก่อนการเปรียบเทียบ",
    mapSaveDialogTitle: "บันทึกคีย์การแมปปัจจุบัน",
    mapPresetNameLabel: "ชื่อพรีเซ็ต",
    mapPresetNamePh: "เช่น คู่คีย์ PO & การตรวจสอบ",
    mapWillSavePairs: "จะบันทึก {count} คู่คอลัมน์:",
    mapSavePreset: "บันทึกพรีเซ็ต",
    mapPresetsModalTitle: "คีย์การแมปคอลัมน์ที่บันทึก & ล่าสุด",
    mapPresetsModalDesc: "กู้คืนคู่คีย์คอลัมน์ที่ใช้ก่อนหน้าหรือเทมเพลตมาตรฐานอย่างรวดเร็ว",
    mapTabSaved: "พรีเซ็ตที่บันทึก ({count})",
    mapTabRecent: "ประวัติล่าสุด ({count})",
    mapTabTemplates: "เทมเพลตอุตสาหกรรม ({count})",
    mapColCountBadge: "{count} คอลัมน์",
    mapAllInFiles: "100% ในไฟล์",
    mapSavedOn: "บันทึกเมื่อ {date}",
    mapDeletePresetTitle: "ลบพรีเซ็ต",
    mapApplyPreset: "ใช้พรีเซ็ต",
    mapNoPresets: "ยังไม่มีพรีเซ็ตที่กำหนดเอง",
    mapNoPresetsHint: "กำหนดค่าคอลัมน์ด้านบนแล้วคลิก \"บันทึกคีย์\" เพื่อจัดเก็บที่นี่",
    mapRecentSession: "เซสชันล่าสุด #{n}",
    mapAutoSaved: "บันทึกอัตโนมัติแล้ว",
    mapNoHistory: "ยังไม่มีประวัติล่าสุด",
    mapUseTemplate: "ใช้เทมเพลต",
    mapPresetsStoredNote: "พรีเซ็ตทั้งหมดจัดเก็บอย่างปลอดภัยในที่เก็บข้อมูลเบราว์เซอร์",
    mapRestore: "กู้คืน",
    layerDefaultName: "เลเยอร์การตัดสินใจ {n}",
    layerRuleAccepted: "รายการที่ยอมรับ",
    layerRuleReview: "ต้องการการตรวจสอบ",
    layerRuleRejected: "ข้อบกพร่องที่ปฏิเสธ",
    layerRuleDefinition: "นิยามกฎ",
    layerInspectionPresetName: "การตัดสินใจตรวจสอบ (Waive / Accept → เขียว, อื่นๆ → เหลือง)",
    layerRuleContains: "{col} ประกอบด้วย \"{val}\"",
    layerRuleEitherContains: "อย่างใดอย่างหนึ่งประกอบด้วย \"{val}\"",
    layerDefaultPresetName: "ชุดกฎการตัดสินใจ ({name})",
    layerPresetDesc: "{layers} เลเยอร์, {rules} กฎ",
    layerTplInspectionDesc: "ถ้าสถานะการตรวจสอบมี \"Waive\" หรือผลลัพธ์มี \"Accept\" → เขียว มิฉะนั้นตรวจสอบสีเหลือง",
    layerTplQaName: "การประกันคุณภาพ 3 ระดับ (ยอมรับ / ตรวจสอบ / ปฏิเสธ)",
    layerTplQaDesc: "การคัดแยกแบบเต็มด้วยการยอมรับ (เขียว), รอดำเนินการ/ตรวจสอบ (เหลือง) และปฏิเสธ/ข้อบกพร่อง (แดง)",
    layerTplQaLayerName: "ผลลัพธ์ QA 3 ระดับ",
    layerTplAcceptedPass: "ผ่านการยอมรับ",
    layerTplNeedsReview: "ต้องการการตรวจสอบทางวิศวกรรม",
    layerTplStrictName: "การตรวจสอบผ่าน / ไม่ผ่านแบบเข้มงวด",
    layerTplStrictDesc: "ด่านแบบไบนารี: \"Pass\" หรือ \"Approved\" ตรงตัวคือสีเขียว อย่างอื่นทั้งหมดทริกเกอร์เตือนสีแดง",
    layerTplStrictLayerName: "ด่านการปฏิบัติตามอย่างเข้มงวด",
    layerTplPassed: "ผ่านการตรวจสอบ",
    layerTplApproved: "อนุมัติอย่างเป็นทางการ",
    layerPresetsBtnTitle: "ดูเลเยอร์การตัดสินใจที่บันทึกล่าสุด (กฎแบบลำดับชั้น)",
    layerSavedRecentRules: "กฎที่บันทึก & ล่าสุด",
    layerSaveRulesBtnTitle: "บันทึกกฎการตัดสินใจแบบลำดับชั้นปัจจุบันเป็นพรีเซ็ตที่มีชื่อ",
    layerSaveRules: "บันทึกกฎ",
    layerActiveRuleTitle: "กฎการตัดสินใจที่ใช้งาน: Waive หรือ Accept → เขียว, อื่นๆ → เหลือง",
    layerActiveRuleDesc1: "ถ้า {col} ประกอบด้วย {val} → เขียว",
    layerActiveRuleDesc2: "มิฉะนั้น ถ้า {col} ประกอบด้วย {val} → เขียว",
    layerActiveRuleDesc3: "ถ้าไม่ตรงกับกฎใด → เหลือง",
    layerResetStandardRule: "รีเซ็ตเป็นกฎมาตรฐาน",
    layerMoveUpTitle: "ย้ายเลเยอร์ขึ้นในลำดับชั้น",
    layerMoveDownTitle: "ย้ายเลเยอร์ลงในลำดับชั้น",
    layerDeleteLayerTitle: "ลบเลเยอร์การตัดสินใจ",
    layerPrimaryColumn: "คอลัมน์การประเมินหลัก",
    layerSecondaryColumn: "คอลัมน์รอง (หลายคอลัมน์ - ไม่บังคับ)",
    layerNoSecondary: "-- ไม่มี (คอลัมน์เดียว) --",
    layerComboLogic: "ตรรกะการรวมการประเมิน",
    layerLogicOr: "OR (ตรงตามเงื่อนไขใดเงื่อนไขหนึ่ง)",
    layerLogicAnd: "AND (ตรงตามทั้งสองเงื่อนไข)",
    layerValueRules: "กฎค่า ({count})",
    layerTargetAny: "คอลัมน์ใดก็ได้",
    layerTargetPrimary: "คอลัมน์หลัก",
    layerTargetSecondary: "คอลัมน์รอง",
    layerValuePlaceholder: "เช่น \"Waive\" หรือ \"Accept\"",
    layerColorGreen: "เขียว (ผ่าน / Waive)",
    layerColorYellow: "เหลือง (ตรวจสอบ)",
    layerColorRed: "แดง (ข้อบกพร่องที่ปฏิเสธ)",
    layerDeleteRuleTitle: "ลบกฎ",
    layerUseOriginalFill: "ใช้สีพื้นเซลล์เดิมเมื่อไม่มีกฎค่าที่ตรงกัน",
    layerIfNoRuleMatch: "ถ้าไม่มีกฎที่ตรงกัน:",
    layerFallbackNone: "ไม่เน้น",
    layerFallbackYellow: "เน้นสีเหลือง",
    layerFallbackRed: "เน้นสีแดง",
    layerFallbackGreen: "เน้นสีเขียว",
    layerHierarchyHint: "กฎประเมินแบบลำดับชั้น กฎแรกที่ตรงกันจะจัดรูปแบบแถว",
    layerSaveDialogTitle: "บันทึกเลเยอร์การตัดสินใจปัจจุบัน",
    layerPresetNameLabel: "ชื่อพรีเซ็ต",
    layerPresetNamePh: "เช่น กฎ QA การตรวจสอบมาตรฐาน",
    layerWillSave: "จะบันทึก {layers} เลเยอร์การตัดสินใจที่มี {rules} กฎทั้งหมด",
    layerSavePreset: "บันทึกพรีเซ็ต",
    layerPresetsModalTitle: "เลเยอร์การตัดสินใจที่บันทึก & ล่าสุด (กฎแบบลำดับชั้น)",
    layerPresetsModalDesc: "สลับระหว่างพรีเซ็ตกฎที่บันทึก กู้คืนเซสชันล่าสุด หรือใช้มาตรฐานอุตสาหกรรม",
    layerTabSaved: "พรีเซ็ตที่บันทึก ({count})",
    layerTabRecent: "ประวัติล่าสุด ({count})",
    layerTabStandard: "กฎมาตรฐาน ({count})",
    layerCountBadge: "{count} เลเยอร์",
    layerSavedOn: "บันทึกเมื่อ {date}",
    layerDeletePresetTitle: "ลบพรีเซ็ต",
    layerApplyRules: "ใช้กฎ",
    layerNoPresets: "ยังไม่มีพรีเซ็ตกฎการตัดสินใจที่กำหนดเอง",
    layerNoPresetsHint: "ปรับแต่งเลเยอร์การตัดสินใจด้านบนแล้วคลิก \"บันทึกกฎ\" เพื่อบันทึก",
    layerRecentState: "สถานะกฎล่าสุด #{n}",
    layerAutoSaved: "บันทึกอัตโนมัติแล้ว",
    layerNoHistory: "ยังไม่มีประวัติกฎล่าสุด",
    layerTemplateMeta: "{layers} เลเยอร์ · {rules} กฎค่า",
    layerApplyRule: "ใช้กฎ",
    layerFooterNote: "เลเยอร์การตัดสินใจประเมินตามลำดับจากบนลงล่าง",
    suggestionEngineTitle: "เครื่องมือแนะนำอัจฉริยะ",
    suggestionEngineSubtitle: "วิเคราะห์หัวตารางโดยใช้คำศัพท์เฉพาะทางธุรกิจและการเงิน (ยอดเงิน, รหัสคำสั่งซื้อ, ล็อต, วันที่)",
    suggestionEngineBadge: "คำแนะนำ",
    suggestionEngineApplyAll: "ใช้คำแนะนำทั้งหมด",
    suggestionEngineApplyOne: "จับคู่",
    suggestionEngineApplied: "จับคู่แล้ว",
    suggestionEngineActive: "การจับคู่ปัจจุบัน",
    suggestionEngineReadyToMap: "พร้อมจับคู่",
    suggestionEngineNoSuggestions: "ไม่พบคำแนะนำคอลัมน์ใหม่",
    suggestionEngineTabDesc: "ระบบจับคู่คอลัมน์อัจฉริยะที่วิเคราะห์คำเหมือนในอุตสาหกรรม (เช่น Amt, Total, Net เข้ากับ Value)",
    suggestionEngineConfidenceHigh: "ตรงกันสูง",
    suggestionEngineConfidenceMed: "ตรงกันปานกลาง",
    suggestionEngineConfidenceLow: "ตรงกันต่ำ",
    dashFilterStatusShowing: "แสดง",
    dashFilterStatusOf: "จาก",
    dashFilterStatusRows: "แถว",
    dashFilterStatusFiltered: "แสดง {count} จากทั้งหมด {total} แถว",
    dashFilterStatusAccepted: "ผ่าน {count} แถว (Accepted)",
    dashFilterStatusPostponed: "รอทบทวน {count} แถว (Postponed)",
    dashFilterStatusRejected: "ปฏิเสธ {count} แถว (Rejected)",
    dashFilterStatusHold: "ระงับ {count} แถว (Hold)",
    dashFilterStatusUnmatched: "ไม่ตรงกัน {count} แถว (Unmatched)",
    dashResetAllFilters: "รีเซ็ตตัวกรองทั้งหมด",
    dashSyncStatusSynced: "ซิงค์กับพรีวิวแล้ว",
    dashSyncStatusSyncing: "กำลังซิงค์กับพรีวิว...",
    dashForceSyncBtn: "บังคับซิงค์",
    dashForceSyncTitle: "ส่งสถานะตัวกรองและการค้นหาปัจจุบันไปยังพรีวิวลิงก์ทันที (cloud-id: latest)",
    dashForceSyncSuccess: "ซิงค์สถานะตัวกรองไปยังพรีวิวเรียบร้อยแล้ว (cloud-id: latest)",
  },
  zh: {
    filesOpeningFile: "正在打开文件...",
    filesSavingStorage: "正在保存到安全存储...",
    filesLoadedNeedsRef: "已加载 {name}（{rows} 行）。请上传参考文件以完成评估。",
    filesMasterBaseline: "主基线数据集",
    filesProcessing: "正在处理电子表格...",
    filesSelectMainSheet: "选择主文件工作表：",
    filesSheetsCount: "{count} 个工作表",
    filesActiveSheetLabel: "当前：",
    filesSelectRefSheetAria: "选择参考文件工作表",
    filesSheetOption: "📄 {sheet}（{rows} 行 · {cols} 列）",
    filesSingleSheet: "单工作表文件",
    filesColumnsDetected: "检测到的列 ({count})：",
    filesMoreColumns: " 还有 {count} 个",
    filesIncomingDesc: "待检查与分类的动态文件",
    filesReadyToEvaluate: "可评估",
    filesSelectIncomingSheet: "选择传入文件工作表：",
    filesSelectCompSheetAria: "选择比对文件工作表",
    excelReadingBuffer: "正在读取文件缓冲区...",
    excelDecompressing: "正在解压电子表格...",
    excelReadingSheet: "正在读取工作表“{sheet}”（{n}/{total}）...",
    excelDone: "完成",
    mapSummaryMore: "（还有 {count} 个）",
    mapNeedBothFiles: "请先上传两个文件以自动映射列。",
    mapAutoMappedCount: "（匹配了 {count} 列）",
    mapNoMatchesFound: "未检测到明显的列匹配。请手动选择列。",
    mapNeedMappingFirst: "保存预设前请至少添加一个列映射。",
    mapDefaultPresetName: "映射预设 ({cols})",
    mapPairCount: "{count} 个列对",
    mapPresetSaved: "已保存映射预设“{name}”！",
    mapPresetSaveFailed: "保存映射预设失败。",
    mapPresetApplied: "已应用预设“{name}”：加载了 {total} 个映射（参考 {mainFound}/{total}，比对 {compFound}/{total} 已匹配）。",
    mapPresetDeleted: "预设已删除。",
    mapPresetDeleteFailed: "删除预设失败。",
    mapTplPoName: "PO 与订单号匹配",
    mapTplPoDesc: "匹配采购订单号和零件号",
    mapTplSerialName: "零件号与序列键",
    mapTplSerialDesc: "通过零件和序列跟踪 ID 唯一标识",
    mapTplInvoiceName: "发票与供应商代码",
    mapTplInvoiceDesc: "通过发票 ID 和供应商代码进行应付账款对账",
    mapPresetsBtnTitle: "查看已保存的近期列映射键和行业模板",
    mapSavedRecentKeys: "已保存与近期键",
    mapSaveKeysBtnTitle: "将当前列映射键保存为预设",
    mapSaveKeys: "保存键",
    mapRecentKeys: "近期键：",
    mapRecentMappingName: "近期映射",
    mapRestoreLastUsed: "恢复上次使用",
    mapDeleteMappingAria: "删除映射",
    mapNormSectionDesc: "在比对前应用于键的预处理筛选器",
    mapSaveDialogTitle: "保存当前映射键",
    mapPresetNameLabel: "预设名称",
    mapPresetNamePh: "例如：PO 与检验键对",
    mapWillSavePairs: "将保存 {count} 个列对：",
    mapSavePreset: "保存预设",
    mapPresetsModalTitle: "已保存与近期列映射键",
    mapPresetsModalDesc: "快速恢复以前使用过的列键对或标准模板。",
    mapTabSaved: "已保存的预设 ({count})",
    mapTabRecent: "近期历史 ({count})",
    mapTabTemplates: "行业模板 ({count})",
    mapColCountBadge: "{count} 列",
    mapAllInFiles: "文件中 100%",
    mapSavedOn: "保存于 {date}",
    mapDeletePresetTitle: "删除预设",
    mapApplyPreset: "应用预设",
    mapNoPresets: "尚未保存自定义预设。",
    mapNoPresetsHint: "在上方配置列，然后点击“保存键”存储到此处。",
    mapRecentSession: "近期会话 #{n}",
    mapAutoSaved: "已自动保存",
    mapNoHistory: "尚无近期历史记录。",
    mapUseTemplate: "使用模板",
    mapPresetsStoredNote: "所有预设都安全地存储在本地浏览器存储中。",
    mapRestore: "恢复",
    layerDefaultName: "判定层 {n}",
    layerRuleAccepted: "已接受项",
    layerRuleReview: "需要复核",
    layerRuleRejected: "已拒绝缺陷",
    layerRuleDefinition: "规则定义",
    layerInspectionPresetName: "检验判定（Waive / Accept → 绿色，否则 → 黄色）",
    layerRuleContains: "{col} 包含“{val}”",
    layerRuleEitherContains: "任一包含“{val}”",
    layerDefaultPresetName: "判定规则集 ({name})",
    layerPresetDesc: "{layers} 层，{rules} 条规则",
    layerTplInspectionDesc: "如果检验状态含“Waive”或结果含“Accept” → 绿色，否则黄色复核。",
    layerTplQaName: "质量保证三级（接受 / 复核 / 拒绝）",
    layerTplQaDesc: "完整分流：接受（绿色）、待定/复核（黄色）、拒绝/缺陷（红色）。",
    layerTplQaLayerName: "QA 三级结果",
    layerTplAcceptedPass: "接受通过",
    layerTplNeedsReview: "需要工程复核",
    layerTplStrictName: "严格通过 / 失败验证",
    layerTplStrictDesc: "二元门控：精确的“Pass”或“Approved”为绿色，其他一律触发红色警报。",
    layerTplStrictLayerName: "严格合规门",
    layerTplPassed: "检验通过",
    layerTplApproved: "已正式批准",
    layerPresetsBtnTitle: "查看已保存的近期判定层（分层规则）",
    layerSavedRecentRules: "已保存与近期规则",
    layerSaveRulesBtnTitle: "将当前分层判定规则保存为命名预设",
    layerSaveRules: "保存规则",
    layerActiveRuleTitle: "当前判定规则：Waive 或 Accept → 绿色，否则 → 黄色",
    layerActiveRuleDesc1: "如果 {col} 包含 {val} → 绿色。",
    layerActiveRuleDesc2: "否则，如果 {col} 包含 {val} → 绿色。",
    layerActiveRuleDesc3: "如果都不匹配 → 黄色。",
    layerResetStandardRule: "重置为标准规则",
    layerMoveUpTitle: "在层级中上移该层",
    layerMoveDownTitle: "在层级中下移该层",
    layerDeleteLayerTitle: "删除判定层",
    layerPrimaryColumn: "主要评估列",
    layerSecondaryColumn: "次要列（可选多列）",
    layerNoSecondary: "-- 无（单列） --",
    layerComboLogic: "评估组合逻辑",
    layerLogicOr: "OR（任一条件匹配）",
    layerLogicAnd: "AND（两个条件都匹配）",
    layerValueRules: "值规则 ({count})",
    layerTargetAny: "任一列",
    layerTargetPrimary: "主列",
    layerTargetSecondary: "次列",
    layerValuePlaceholder: "例如：“Waive”或“Accept”",
    layerColorGreen: "绿色（通过 / Waive）",
    layerColorYellow: "黄色（复核）",
    layerColorRed: "红色（已拒绝缺陷）",
    layerDeleteRuleTitle: "删除规则",
    layerUseOriginalFill: "当没有值规则匹配时使用原始单元格填充",
    layerIfNoRuleMatch: "如果没有规则匹配：",
    layerFallbackNone: "无高亮",
    layerFallbackYellow: "黄色高亮",
    layerFallbackRed: "红色高亮",
    layerFallbackGreen: "绿色高亮",
    layerHierarchyHint: "规则按层级评估；第一个匹配的规则设置行样式。",
    layerSaveDialogTitle: "保存当前判定层",
    layerPresetNameLabel: "预设名称",
    layerPresetNamePh: "例如：标准检验 QA 规则",
    layerWillSave: "将保存 {layers} 个判定层，共 {rules} 条规则。",
    layerSavePreset: "保存预设",
    layerPresetsModalTitle: "已保存与近期判定层（分层规则）",
    layerPresetsModalDesc: "在已保存的规则预设之间切换、恢复近期会话或应用行业标准。",
    layerTabSaved: "已保存的预设 ({count})",
    layerTabRecent: "近期历史 ({count})",
    layerTabStandard: "标准规则 ({count})",
    layerCountBadge: "{count} 层",
    layerSavedOn: "保存于 {date}",
    layerDeletePresetTitle: "删除预设",
    layerApplyRules: "应用规则",
    layerNoPresets: "尚未保存自定义判定规则预设。",
    layerNoPresetsHint: "在上方自定义判定层，然后点击“保存规则”进行保存。",
    layerRecentState: "近期规则状态 #{n}",
    layerAutoSaved: "已自动保存",
    layerNoHistory: "尚无近期规则历史记录。",
    layerTemplateMeta: "{layers} 层 · {rules} 条值规则",
    layerApplyRule: "应用规则",
    layerFooterNote: "判定层按从上到下的顺序依次评估。",
    suggestionEngineTitle: "智能映射引擎",
    suggestionEngineSubtitle: "基于企业与行业术语智能分析表头（金额、采购单号、批号、数量、日期等）",
    suggestionEngineBadge: "智能建议",
    suggestionEngineApplyAll: "应用所有建议",
    suggestionEngineApplyOne: "映射",
    suggestionEngineApplied: "已应用",
    suggestionEngineActive: "当前映射",
    suggestionEngineReadyToMap: "可映射",
    suggestionEngineNoSuggestions: "未发现新的列映射建议",
    suggestionEngineTabDesc: "自动分析行业同义词（例如将 Amt、Total、Net 映射至金额/数值列）。",
    suggestionEngineConfidenceHigh: "高匹配度",
    suggestionEngineConfidenceMed: "中匹配度",
    suggestionEngineConfidenceLow: "低匹配度",
    dashFilterStatusShowing: "正在显示",
    dashFilterStatusOf: "共",
    dashFilterStatusRows: "行",
    dashFilterStatusFiltered: "正在显示 {count} / {total} 行",
    dashFilterStatusAccepted: "{count} 行已通过 (Accepted)",
    dashFilterStatusPostponed: "{count} 行待复核 (Postponed)",
    dashFilterStatusRejected: "{count} 行已拒绝 (Rejected)",
    dashFilterStatusHold: "{count} 行已暂扣 (Hold)",
    dashFilterStatusUnmatched: "{count} 行未匹配 (Unmatched)",
    dashResetAllFilters: "重置所有筛选",
    dashSyncStatusSynced: "已与预览同步",
    dashSyncStatusSyncing: "正在同步预览...",
    dashForceSyncBtn: "强制同步",
    dashForceSyncTitle: "立即将当前的视图筛选、搜索词和活动列推送到预览快照 (cloud-id: latest)",
    dashForceSyncSuccess: "仪表板视图状态已成功同步至预览快照 (cloud-id: latest)",
  },
};
