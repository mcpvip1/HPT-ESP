// Batch B translations: results dashboard, rules modal, column filter.
import { Language } from '../types';

export interface BatchBKeys {
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
  dashValueMatched: string;
  dashValueUnmatched: string;
  dashValueEmpty: string;
  dashValueBlanks: string;
  colDecisionStatus: string;
  dashOnlyAcceptTitle: string;
  dashOnlyAccept: string;
  dashRefreshTitle: string;
  dashRefresh: string;
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
}

export const batchB: Record<Language, BatchBKeys> = {
  en: {
    dashRefreshedLatest: "Refreshed to latest data & column view settings",
    dashRefreshCompleted: "Refresh completed",
    dashColumnLayoutSaved: "Column layout saved! Synced to preview.",
    dashColumnsRestored: "All columns restored to default order and visibility",
    dashSignInForShare: "Sign in with Google (Sync button) to enable live share links.",
    dashSharePublishFailed: "Could not publish the share link. Check that Firestore rules allow the /shares collection, then try again.",
    dashShareCreated: "Live share link created — anyone with the link sees your latest results.",
    dashShareRevokeFailed: "Could not revoke the share link (network or permissions). Try again.",
    dashShareStopped: "Live sharing turned off — the link no longer works.",
    dashCopyLinkFailed: "Could not copy the link.",
    dashFilterNameAll: "All records",
    dashPreviewLinkCopied: "Result Preview link with {filter} and custom columns copied! Anyone clicking it sees this result view only.",
    dashExcelExported: "Professional Excel exported with {count} customized columns",
    dashExportFailed: "Export failed",
    dashCsvExported: "CSV exported with {count} customized columns",
    badgePassed: "PASSED",
    badgeReview: "REVIEW",
    badgeRejected: "REJECTED",
    badgeNoRule: "NO RULE",
    dashValueMatched: "Matched",
    dashValueUnmatched: "Unmatched",
    dashValueEmpty: "(Empty)",
    dashValueBlanks: "(Blanks)",
    colDecisionStatus: "Decision Status",
    dashOnlyAcceptTitle: "Filter to only show Accept records (hiding superseded Postpone rows for duplicate keys)",
    dashOnlyAccept: "Only Accept",
    dashRefreshTitle: "Refresh results data",
    dashRefresh: "Refresh",
    dashSaveViewTitle: "Save custom column order and visibility (syncs to preview links)",
    dashSaveSyncView: "Save & Sync View",
    dashSaveView: "Save View",
    dashColumnsTitle: "Customize and reorder columns for Results Table and Excel Export",
    dashColumns: "Columns",
    dashQuickCopyTitle: "Quick copy preview link (clean short link)",
    dashLinkCopied: "Link Copied!",
    dashCopyLink: "Copy Link",
    dashLiveShareOnTitle: "Live share link is ON — viewers see your latest results & filter",
    dashLiveShareOffTitle: "Create a public live-share link (viewers need no sign-in)",
    dashSharingLive: "Sharing Live",
    dashLiveShare: "Live Share",
    dashPublicLiveShareLink: "Public live-share link",
    dashLiveShareDesc: "Anyone with this link sees your latest results and active filter — no sign-in needed. Updates automatically as you work.",
    dashCopied: "Copied",
    dashCopy: "Copy",
    dashStopSharing: "Stop sharing (revoke link)",
    dashSharePreviewTitle: "Configure and share result preview link with other users",
    dashSharePreview: "Share Preview",
    dashExportExcelTitle: "Export clean professional Excel workbook retaining solid Green, Yellow, and Red fills",
    dashExportCsvTitle: "Export selected columns to CSV",
    dashSearchScopeTitle: "Search Scope",
    dashSearchScopeAll: "All Columns (Real-time)",
    dashSearchScopeOutcome: "Decision Outcome",
    dashSearchScopeReason: "Evaluation Reason",
    dashSearchScopeUnmatched: "Unmatched Discrepancy",
    dashSearchScopeMatchKey: "Match Key",
    dashOptgroupComparison: "Comparison Data Columns",
    dashOptgroupReference: "Reference Data Columns",
    dashSearchPlaceholder: "Search rows in real-time (type anything to filter instantly)...",
    dashClearSearchTitle: "Clear search",
    dashRowsFound: "{count} found",
    dashActiveColumnFilters: "Excel Column Filters:",
    dashValsSelected: "{count} selected",
    dashClearFilterOn: "Clear filter on {label}",
    dashClearAllColumnFilters: "Clear all column filters",
    dashClickToSortBy: "Click to sort by {label}",
    dashFilterLikeExcelTitle: "Filter {label} like Excel (multi-select checklist & search)",
    dashFilterAria: "Filter {label}",
    dashMoveColumnLeft: "Move column left (earlier in table)",
    dashMoveColumnRight: "Move column right (later in table)",
    dashAllColumnsHidden: "All Table Columns are Currently Hidden",
    dashAllColumnsHiddenDesc: "You currently have 0 columns enabled for the table view. To see data rows again, restore all columns or configure your column choices.",
    dashRestoreAllColumns: "Restore All Columns",
    dashChooseColumns: "Choose Columns",
    dashClearSearchFilter: "Clear search filter ({term})",
    dashCellMatched: "Matched",
    dashCellUnmatched: "UNMATCHED",
    dashCellDiffers: "Differs",
    dashUnidentified: "Unidentified",
    dashRefDifferingFields: "Ref match has differing fields",
    dashMissingInRef: "Missing in Reference file",
    dashInspectRowTitle: "Inspect row discrepancy",
    dashShowingAllRows: "Showing all {count} rows",
    dashFilteredFromTotal: "(filtered from {count} total)",
    dashFullResultView: "Full Result View",
    dashRowsUnit: "rows",
    rulesModalTitle: "Rules & Logic Setting",
    rulesSavedOnce: "Saved Once",
    rulesModalDesc: "Configure your key matching and evaluation logic once. Applied automatically whenever a file is imported.",
    rulesSavedShort: "Saved!",
    rulesSaveSettings: "Save Settings",
    rulesTabMapping: "1. Column Mapping & Normalization",
    rulesTabDecision: "2. Decision Layers & Rules",
    rulesStorageNote: "Permanent Browser Storage (IndexedDB)",
    rulesPersistNote: "Saved settings persist across refreshes and apply automatically on file import.",
    rulesEvaluating: "Evaluating...",
    rulesSaveShowResults: "Save & Show Results",
    filterHeaderPrefix: "Filter:",
    filterCloseMenu: "Close filter menu",
    filterSortAsc: "Sort A → Z",
    filterSortDesc: "Sort Z → A",
    filterSearchValues: "Search values...",
    filterSelectAll: "(Select All)",
    filterNoMatchingValues: "No matching values found",
    filterClearFilter: "Clear Filter",
    filterApply: "Apply",
  },
  my: {
    dashRefreshedLatest: "နောက်ဆုံးဒေတာနှင့် ကော်လံမြင်ကွင်း ဆက်တင်များသို့ ပြန်လည်ရယူပြီးပြီ",
    dashRefreshCompleted: "ပြန်လည်ရယူခြင်း ပြီးဆုံးပြီ",
    dashColumnLayoutSaved: "ကော်လံအပြင်အဆင် သိမ်းဆည်းပြီးပြီ! အစမ်းကြည့်မှုသို့ ထပ်တူညီပြီးပြီ။",
    dashColumnsRestored: "ကော်လံအားလုံး မူလအစီအစဉ်နှင့် မြင်နိုင်မှုသို့ ပြန်လည်ရောက်ရှိပြီ",
    dashSignInForShare: "တိုက်ရိုက် မျှဝေလင့်ခ်များ ဖွင့်ရန် Google ဖြင့် ဝင်ရောက်ပါ (Sync ခလုတ်)။",
    dashSharePublishFailed: "မျှဝေလင့်ခ်ကို ထုတ်ဝေ၍ မရပါ။ Firestore စည်းမျဉ်းများက /shares collection ကို ခွင့်ပြုထားခြင်း ရှိ/မရှိ စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။",
    dashShareCreated: "တိုက်ရိုက် မျှဝေလင့်ခ် ဖန်တီးပြီးပြီ — လင့်ခ်ရှိသူတိုင်း သင့်နောက်ဆုံးရလဒ်များကို မြင်ရမည်။",
    dashShareRevokeFailed: "မျှဝေလင့်ခ်ကို ရုပ်သိမ်း၍ မရပါ (ကွန်ရက် သို့မဟုတ် ခွင့်ပြုချက်)။ ထပ်ကြိုးစားပါ။",
    dashShareStopped: "တိုက်ရိုက် မျှဝေမှုကို ပိတ်လိုက်ပြီ — လင့်ခ် အလုပ်မလုပ်တော့ပါ။",
    dashCopyLinkFailed: "လင့်ခ်ကို ကူးယူ၍ မရပါ။",
    dashFilterNameAll: "မှတ်တမ်းအားလုံး",
    dashPreviewLinkCopied: "{filter} နှင့် စိတ်ကြိုက်ကော်လံများပါဝင်သော ရလဒ် အစမ်းကြည့်လင့်ခ် ကူးယူပြီးပြီ! နှိပ်သူတိုင်း ဤရလဒ်မြင်ကွင်းကိုသာ မြင်ရမည်။",
    dashExcelExported: "စိတ်ကြိုက်ကော်လံ {count} ခုပါဝင်သော Professional Excel ထုတ်ယူပြီးပြီ",
    dashExportFailed: "ထုတ်ယူ၍ မရပါ",
    dashCsvExported: "စိတ်ကြိုက်ကော်လံ {count} ခုပါဝင်သော CSV ထုတ်ယူပြီးပြီ",
    badgePassed: "အောင်မြင်သည်",
    badgeReview: "ပြန်လည်သုံးသပ်ရန်",
    badgeRejected: "ပယ်ချထားသည်",
    badgeNoRule: "စည်းမျဉ်းမရှိ",
    dashValueMatched: "ကိုက်ညီသည်",
    dashValueUnmatched: "မကိုက်ညီပါ",
    dashValueEmpty: "(မရှိ)",
    dashValueBlanks: "(ဗလာ)",
    colDecisionStatus: "ဆုံးဖြတ်ချက် အခြေအနေ",
    dashOnlyAcceptTitle: "Accept မှတ်တမ်းများကိုသာ ပြရန် စစ်ထုတ်မည် (ထပ်နေသော သော့များအတွက် အစားထိုးခံရသော Postpone အတန်းများကို ဝှက်ထားမည်)",
    dashOnlyAccept: "Accept သာ",
    dashRefreshTitle: "ရလဒ်ဒေတာကို ပြန်လည်ရယူရန်",
    dashRefresh: "ပြန်လည်ရယူရန်",
    dashSaveViewTitle: "စိတ်ကြိုက် ကော်လံအစီအစဉ်နှင့် မြင်နိုင်မှုကို သိမ်းဆည်းရန် (အစမ်းကြည့်လင့်ခ်များသို့ ထပ်တူညီမည်)",
    dashSaveSyncView: "မြင်ကွင်းကို သိမ်းဆည်း & ထပ်တူညီရန်",
    dashSaveView: "မြင်ကွင်း သိမ်းဆည်းရန်",
    dashColumnsTitle: "ရလဒ်ဇယားနှင့် Excel ထုတ်ယူမှုအတွက် ကော်လံများကို စိတ်ကြိုက်ပြင်ဆင်ပြီး ပြန်စီရန်",
    dashColumns: "ကော်လံများ",
    dashQuickCopyTitle: "အစမ်းကြည့်လင့်ခ် အမြန်ကူးယူရန် (တိုတောင်းသော လင့်ခ်)",
    dashLinkCopied: "လင့်ခ် ကူးယူပြီးပြီ!",
    dashCopyLink: "လင့်ခ် ကူးယူရန်",
    dashLiveShareOnTitle: "တိုက်ရိုက် မျှဝေလင့်ခ် ဖွင့်ထားသည် — ကြည့်ရှုသူများ သင့်နောက်ဆုံးရလဒ်နှင့် စစ်ထုတ်မှုကို မြင်ရမည်",
    dashLiveShareOffTitle: "အများသူငှာ တိုက်ရိုက် မျှဝေလင့်ခ် ဖန်တီးရန် (ကြည့်ရှုသူများ ဝင်ရောက်ရန် မလိုအပ်ပါ)",
    dashSharingLive: "တိုက်ရိုက် မျှဝေနေသည်",
    dashLiveShare: "တိုက်ရိုက် မျှဝေရန်",
    dashPublicLiveShareLink: "အများသူငှာ တိုက်ရိုက် မျှဝေလင့်ခ်",
    dashLiveShareDesc: "လင့်ခ်ရှိသူတိုင်း သင့်နောက်ဆုံးရလဒ်များနှင့် လက်ရှိ စစ်ထုတ်မှုကို မြင်ရမည် — ဝင်ရောက်ရန် မလိုအပ်ပါ။ သင်လုပ်ဆောင်သည်နှင့်အမျှ အလိုအလျောက် အပ်ဒိတ်ဖြစ်မည်။",
    dashCopied: "ကူးယူပြီးပြီ",
    dashCopy: "ကူးယူရန်",
    dashStopSharing: "မျှဝေမှုကို ရပ်ရန် (လင့်ခ် ရုပ်သိမ်းရန်)",
    dashSharePreviewTitle: "အခြားအသုံးပြုသူများနှင့် ရလဒ် အစမ်းကြည့်လင့်ခ်ကို ပြင်ဆင်၍ မျှဝေရန်",
    dashSharePreview: "အစမ်းကြည့်မှု မျှဝေရန်",
    dashExportExcelTitle: "အစိမ်း၊ အဝါ၊ အနီ အပြည့်အဝ ဖြည့်စွက်မှုများကို ထိန်းသိမ်းထားသော သန့်ရှင်းသည့် Professional Excel workbook ထုတ်ယူရန်",
    dashExportCsvTitle: "ရွေးချယ်ထားသော ကော်လံများကို CSV သို့ ထုတ်ယူရန်",
    dashSearchScopeTitle: "ရှာဖွေမှု နယ်ပယ်",
    dashSearchScopeAll: "ကော်လံအားလုံး (အချိန်နှင့်တပြေးညီ)",
    dashSearchScopeOutcome: "ဆုံးဖြတ်ချက် ရလဒ်",
    dashSearchScopeReason: "အကဲဖြတ်ချက် အကြောင်းရင်း",
    dashSearchScopeUnmatched: "မကိုက်ညီမှု ကွဲလွဲချက်",
    dashSearchScopeMatchKey: "ကိုက်ညီသောသော့",
    dashOptgroupComparison: "နှိုင်းယှဉ် ဒေတာ ကော်လံများ",
    dashOptgroupReference: "အခြေခံ ဒေတာ ကော်လံများ",
    dashSearchPlaceholder: "အတန်းများကို အချိန်နှင့်တပြေးညီ ရှာဖွေရန် (ချက်ချင်း စစ်ထုတ်ရန် တစ်ခုခု ရိုက်ထည့်ပါ)...",
    dashClearSearchTitle: "ရှာဖွေမှုကို ရှင်းရန်",
    dashRowsFound: "{count} ခု တွေ့ရှိသည်",
    dashActiveColumnFilters: "Excel ကော်လံ စစ်ထုတ်မှုများ:",
    dashValsSelected: "{count} ခု ရွေးချယ်ထားသည်",
    dashClearFilterOn: "{label} ပေါ်ရှိ စစ်ထုတ်မှုကို ရှင်းရန်",
    dashClearAllColumnFilters: "ကော်လံ စစ်ထုတ်မှုအားလုံးကို ရှင်းရန်",
    dashClickToSortBy: "{label} အလိုက် စီရန် နှိပ်ပါ",
    dashFilterLikeExcelTitle: "{label} ကို Excel ကဲ့သို့ စစ်ထုတ်ရန် (ရွေးချယ်စရာ စာရင်းနှင့် ရှာဖွေမှု)",
    dashFilterAria: "{label} ကို စစ်ထုတ်ရန်",
    dashMoveColumnLeft: "ကော်လံကို ဘယ်သို့ ရွှေ့ရန် (ဇယားတွင် အစောပိုင်း)",
    dashMoveColumnRight: "ကော်လံကို ညာသို့ ရွှေ့ရန် (ဇယားတွင် နောက်ပိုင်း)",
    dashAllColumnsHidden: "ဇယား ကော်လံအားလုံး လက်ရှိ ဝှက်ထားသည်",
    dashAllColumnsHiddenDesc: "ဇယားမြင်ကွင်းအတွက် ဖွင့်ထားသော ကော်လံ 0 ခု ရှိသည်။ ဒေတာအတန်းများကို ပြန်လည်မြင်လိုပါက ကော်လံအားလုံးကို ပြန်လည်ရယူပါ သို့မဟုတ် ကော်လံရွေးချယ်မှုများကို ပြင်ဆင်ပါ။",
    dashRestoreAllColumns: "ကော်လံအားလုံး ပြန်လည်ရယူရန်",
    dashChooseColumns: "ကော်လံများ ရွေးချယ်ရန်",
    dashClearSearchFilter: "ရှာဖွေမှု စစ်ထုတ်မှု ({term}) ကို ရှင်းရန်",
    dashCellMatched: "ကိုက်ညီသည်",
    dashCellUnmatched: "မကိုက်ညီပါ",
    dashCellDiffers: "ကွဲပြားသည်",
    dashUnidentified: "မဖော်ထုတ်နိုင်ပါ",
    dashRefDifferingFields: "အခြေခံ ကိုက်ညီမှုတွင် ကွဲပြားသော အကွက်များရှိသည်",
    dashMissingInRef: "အခြေခံဖိုင်တွင် မရှိပါ",
    dashInspectRowTitle: "အတန်း ကွဲလွဲချက်ကို စစ်ဆေးရန်",
    dashShowingAllRows: "အတန်း {count} ခုလုံး ပြသနေသည်",
    dashFilteredFromTotal: "(စုစုပေါင်း {count} မှ စစ်ထုတ်ထားသည်)",
    dashFullResultView: "ရလဒ် အပြည့်အစုံ မြင်ကွင်း",
    dashRowsUnit: "အတန်းများ",
    rulesModalTitle: "စည်းမျဉ်းနှင့် ယုတ္တိဗေဒ ဆက်တင်",
    rulesSavedOnce: "တစ်ကြိမ် သိမ်းဆည်းပြီးပြီ",
    rulesModalDesc: "သော့ ကိုက်ညီမှုနှင့် အကဲဖြတ်ယုတ္တိဗေဒကို တစ်ကြိမ် ပြင်ဆင်ပါ။ ဖိုင် ထည့်သွင်းတိုင်း အလိုအလျောက် အသုံးချမည်။",
    rulesSavedShort: "သိမ်းဆည်းပြီးပြီ!",
    rulesSaveSettings: "ဆက်တင်များ သိမ်းဆည်းရန်",
    rulesTabMapping: "၁။ ကော်လံမြေပုံ & ပုံမှန်ဖြစ်စေခြင်း",
    rulesTabDecision: "၂။ ဆုံးဖြတ်ချက် အလွှာများနှင့် စည်းမျဉ်းများ",
    rulesStorageNote: "အမြဲတမ်း ဘရောင်ဇာ သိုလှောင်မှု (IndexedDB)",
    rulesPersistNote: "သိမ်းဆည်းထားသော ဆက်တင်များသည် ပြန်လည်ဖွင့်တိုင်း တည်ရှိနေပြီး ဖိုင် ထည့်သွင်းတိုင်း အလိုအလျောက် အသုံးချမည်။",
    rulesEvaluating: "အကဲဖြတ်နေသည်...",
    rulesSaveShowResults: "သိမ်းဆည်း & ရလဒ်များ ပြသရန်",
    filterHeaderPrefix: "စစ်ထုတ်ရန်:",
    filterCloseMenu: "စစ်ထုတ်မှု မီနူး ပိတ်ရန်",
    filterSortAsc: "A → Z အလိုက် စီရန်",
    filterSortDesc: "Z → A အလိုက် စီရန်",
    filterSearchValues: "တန်ဖိုးများ ရှာဖွေရန်...",
    filterSelectAll: "(အားလုံး ရွေးချယ်ရန်)",
    filterNoMatchingValues: "ကိုက်ညီသော တန်ဖိုးများ မတွေ့ပါ",
    filterClearFilter: "စစ်ထုတ်မှု ရှင်းရန်",
    filterApply: "အသုံးချရန်",
  },
  th: {
    dashRefreshedLatest: "รีเฟรชเป็นข้อมูลล่าสุดและการตั้งค่ามุมมองคอลัมน์แล้ว",
    dashRefreshCompleted: "รีเฟรชเสร็จสมบูรณ์",
    dashColumnLayoutSaved: "บันทึกเค้าโครงคอลัมน์แล้ว! ซิงค์ไปยังตัวอย่างแล้ว",
    dashColumnsRestored: "กู้คืนคอลัมน์ทั้งหมดเป็นลำดับและการมองเห็นเริ่มต้นแล้ว",
    dashSignInForShare: "ลงชื่อเข้าใช้ด้วย Google (ปุ่มซิงค์) เพื่อเปิดใช้งานลิงก์แชร์สด",
    dashSharePublishFailed: "ไม่สามารถเผยแพร่ลิงก์แชร์ได้ ตรวจสอบว่ากฎ Firestore อนุญาตคอลเลกชัน /shares แล้วลองอีกครั้ง",
    dashShareCreated: "สร้างลิงก์แชร์สดแล้ว — ทุกคนที่มีลิงก์จะเห็นผลลัพธ์ล่าสุดของคุณ",
    dashShareRevokeFailed: "ไม่สามารถเพิกถอนลิงก์แชร์ได้ (เครือข่ายหรือสิทธิ์) ลองอีกครั้ง",
    dashShareStopped: "ปิดการแชร์สดแล้ว — ลิงก์ใช้งานไม่ได้อีกต่อไป",
    dashCopyLinkFailed: "ไม่สามารถคัดลอกลิงก์ได้",
    dashFilterNameAll: "ระเบียนทั้งหมด",
    dashPreviewLinkCopied: "คัดลอกลิงก์ตัวอย่างผลลัพธ์พร้อม {filter} และคอลัมน์ที่กำหนดเองแล้ว! ทุกคนที่คลิกจะเห็นเฉพาะมุมมองผลลัพธ์นี้",
    dashExcelExported: "ส่งออก Professional Excel พร้อมคอลัมน์ที่กำหนดเอง {count} คอลัมน์แล้ว",
    dashExportFailed: "ส่งออกล้มเหลว",
    dashCsvExported: "ส่งออก CSV พร้อมคอลัมน์ที่กำหนดเอง {count} คอลัมน์แล้ว",
    badgePassed: "ผ่าน",
    badgeReview: "ตรวจสอบ",
    badgeRejected: "ปฏิเสธ",
    badgeNoRule: "ไม่มีกฎ",
    dashValueMatched: "ตรงกัน",
    dashValueUnmatched: "ไม่ตรงกัน",
    dashValueEmpty: "(ว่างเปล่า)",
    dashValueBlanks: "(ว่าง)",
    colDecisionStatus: "สถานะการตัดสินใจ",
    dashOnlyAcceptTitle: "กรองเพื่อแสดงเฉพาะระเบียนที่ยอมรับ (ซ่อนแถว Postpone ที่ถูกแทนที่สำหรับคีย์ที่ซ้ำกัน)",
    dashOnlyAccept: "เฉพาะที่ยอมรับ",
    dashRefreshTitle: "รีเฟรชข้อมูลผลลัพธ์",
    dashRefresh: "รีเฟรช",
    dashSaveViewTitle: "บันทึกลำดับและการมองเห็นคอลัมน์ที่กำหนดเอง (ซิงค์ไปยังลิงก์ตัวอย่าง)",
    dashSaveSyncView: "บันทึก & ซิงค์มุมมอง",
    dashSaveView: "บันทึกมุมมอง",
    dashColumnsTitle: "ปรับแต่งและจัดเรียงคอลัมน์ใหม่สำหรับตารางผลลัพธ์และการส่งออก Excel",
    dashColumns: "คอลัมน์",
    dashQuickCopyTitle: "คัดลอกลิงก์ตัวอย่างด่วน (ลิงก์สั้น)",
    dashLinkCopied: "คัดลอกลิงก์แล้ว!",
    dashCopyLink: "คัดลอกลิงก์",
    dashLiveShareOnTitle: "ลิงก์แชร์สดเปิดอยู่ — ผู้ดูจะเห็นผลลัพธ์และตัวกรองล่าสุดของคุณ",
    dashLiveShareOffTitle: "สร้างลิงก์แชร์สดสาธารณะ (ผู้ดูไม่ต้องลงชื่อเข้าใช้)",
    dashSharingLive: "กำลังแชร์สด",
    dashLiveShare: "แชร์สด",
    dashPublicLiveShareLink: "ลิงก์แชร์สดสาธารณะ",
    dashLiveShareDesc: "ทุกคนที่มีลิงก์นี้จะเห็นผลลัพธ์ล่าสุดและตัวกรองที่ใช้งานของคุณ — ไม่ต้องลงชื่อเข้าใช้ อัปเดตอัตโนมัติขณะที่คุณทำงาน",
    dashCopied: "คัดลอกแล้ว",
    dashCopy: "คัดลอก",
    dashStopSharing: "หยุดแชร์ (เพิกถอนลิงก์)",
    dashSharePreviewTitle: "กำหนดค่าและแชร์ลิงก์ตัวอย่างผลลัพธ์กับผู้ใช้อื่น",
    dashSharePreview: "แชร์ตัวอย่าง",
    dashExportExcelTitle: "ส่งออกเวิร์กบุ๊ก Excel ระดับมืออาชีพที่คงสีเขียว เหลือง และแดงแบบทึบไว้",
    dashExportCsvTitle: "ส่งออกคอลัมน์ที่เลือกเป็น CSV",
    dashSearchScopeTitle: "ขอบเขตการค้นหา",
    dashSearchScopeAll: "ทุกคอลัมน์ (เรียลไทม์)",
    dashSearchScopeOutcome: "ผลการตัดสินใจ",
    dashSearchScopeReason: "เหตุผลการประเมิน",
    dashSearchScopeUnmatched: "ความคลาดเคลื่อนที่ไม่ตรงกัน",
    dashSearchScopeMatchKey: "คีย์ที่ตรงกัน",
    dashOptgroupComparison: "คอลัมน์ข้อมูลเปรียบเทียบ",
    dashOptgroupReference: "คอลัมน์ข้อมูลอ้างอิง",
    dashSearchPlaceholder: "ค้นหาแถวแบบเรียลไทม์ (พิมพ์อะไรก็ได้เพื่อกรองทันที)...",
    dashClearSearchTitle: "ล้างการค้นหา",
    dashRowsFound: "พบ {count} แถว",
    dashActiveColumnFilters: "ตัวกรองคอลัมน์ Excel:",
    dashValsSelected: "เลือกแล้ว {count} รายการ",
    dashClearFilterOn: "ล้างตัวกรองบน {label}",
    dashClearAllColumnFilters: "ล้างตัวกรองคอลัมน์ทั้งหมด",
    dashClickToSortBy: "คลิกเพื่อจัดเรียงตาม {label}",
    dashFilterLikeExcelTitle: "กรอง {label} แบบ Excel (เช็กลิสต์หลายรายการ & ค้นหา)",
    dashFilterAria: "กรอง {label}",
    dashMoveColumnLeft: "ย้ายคอลัมน์ไปทางซ้าย (ก่อนหน้าในตาราง)",
    dashMoveColumnRight: "ย้ายคอลัมน์ไปทางขวา (ถัดไปในตาราง)",
    dashAllColumnsHidden: "คอลัมน์ตารางทั้งหมดถูกซ่อนอยู่ในขณะนี้",
    dashAllColumnsHiddenDesc: "คุณเปิดใช้งาน 0 คอลัมน์สำหรับมุมมองตาราง หากต้องการดูแถวข้อมูลอีกครั้ง ให้กู้คืนคอลัมน์ทั้งหมดหรือกำหนดค่าตัวเลือกคอลัมน์ของคุณ",
    dashRestoreAllColumns: "กู้คืนคอลัมน์ทั้งหมด",
    dashChooseColumns: "เลือกคอลัมน์",
    dashClearSearchFilter: "ล้างตัวกรองการค้นหา ({term})",
    dashCellMatched: "ตรงกัน",
    dashCellUnmatched: "ไม่ตรงกัน",
    dashCellDiffers: "ต่างกัน",
    dashUnidentified: "ไม่สามารถระบุได้",
    dashRefDifferingFields: "ข้อมูลอ้างอิงที่ตรงกันมีฟิลด์ที่แตกต่างกัน",
    dashMissingInRef: "ไม่มีในไฟล์อ้างอิง",
    dashInspectRowTitle: "ตรวจสอบความคลาดเคลื่อนของแถว",
    dashShowingAllRows: "กำลังแสดง {count} แถวทั้งหมด",
    dashFilteredFromTotal: "(กรองจากทั้งหมด {count} แถว)",
    dashFullResultView: "มุมมองผลลัพธ์แบบเต็ม",
    dashRowsUnit: "แถว",
    rulesModalTitle: "การตั้งค่ากฎและตรรกะ",
    rulesSavedOnce: "บันทึกครั้งเดียว",
    rulesModalDesc: "กำหนดค่าการจับคู่คีย์และตรรกะการประเมินของคุณเพียงครั้งเดียว ใช้โดยอัตโนมัติทุกครั้งที่นำเข้าไฟล์",
    rulesSavedShort: "บันทึกแล้ว!",
    rulesSaveSettings: "บันทึกการตั้งค่า",
    rulesTabMapping: "1. การแมปคอลัมน์ & การปรับมาตรฐาน",
    rulesTabDecision: "2. เลเยอร์การตัดสินใจ & กฎ",
    rulesStorageNote: "ที่เก็บข้อมูลถาวรของเบราว์เซอร์ (IndexedDB)",
    rulesPersistNote: "การตั้งค่าที่บันทึกไว้จะคงอยู่เมื่อรีเฟรชและใช้โดยอัตโนมัติเมื่อนำเข้าไฟล์",
    rulesEvaluating: "กำลังประเมิน...",
    rulesSaveShowResults: "บันทึก & แสดงผลลัพธ์",
    filterHeaderPrefix: "ตัวกรอง:",
    filterCloseMenu: "ปิดเมนูตัวกรอง",
    filterSortAsc: "เรียง A → Z",
    filterSortDesc: "เรียง Z → A",
    filterSearchValues: "ค้นหาค่า...",
    filterSelectAll: "(เลือกทั้งหมด)",
    filterNoMatchingValues: "ไม่พบค่าที่ตรงกัน",
    filterClearFilter: "ล้างตัวกรอง",
    filterApply: "ใช้",
  },
  zh: {
    dashRefreshedLatest: "已刷新为最新数据和列视图设置",
    dashRefreshCompleted: "刷新完成",
    dashColumnLayoutSaved: "列布局已保存！已同步到预览。",
    dashColumnsRestored: "所有列已恢复为默认顺序和可见性",
    dashSignInForShare: "使用 Google 登录（同步按钮）以启用实时共享链接。",
    dashSharePublishFailed: "无法发布共享链接。请检查 Firestore 规则是否允许 /shares 集合，然后重试。",
    dashShareCreated: "实时共享链接已创建 — 拥有链接的任何人都可以看到您的最新结果。",
    dashShareRevokeFailed: "无法撤销共享链接（网络或权限问题）。请重试。",
    dashShareStopped: "已关闭实时共享 — 该链接不再有效。",
    dashCopyLinkFailed: "无法复制链接。",
    dashFilterNameAll: "所有记录",
    dashPreviewLinkCopied: "已复制包含 {filter} 和自定义列的结果预览链接！点击的任何人只能看到此结果视图。",
    dashExcelExported: "已导出包含 {count} 个自定义列的专业 Excel",
    dashExportFailed: "导出失败",
    dashCsvExported: "已导出包含 {count} 个自定义列的 CSV",
    badgePassed: "通过",
    badgeReview: "复核",
    badgeRejected: "拒绝",
    badgeNoRule: "无规则",
    dashValueMatched: "已匹配",
    dashValueUnmatched: "未匹配",
    dashValueEmpty: "(空)",
    dashValueBlanks: "(空白)",
    colDecisionStatus: "判定状态",
    dashOnlyAcceptTitle: "仅筛选显示已接受的记录（隐藏重复键中被取代的 Postpone 行）",
    dashOnlyAccept: "仅接受",
    dashRefreshTitle: "刷新结果数据",
    dashRefresh: "刷新",
    dashSaveViewTitle: "保存自定义列顺序和可见性（同步到预览链接）",
    dashSaveSyncView: "保存并同步视图",
    dashSaveView: "保存视图",
    dashColumnsTitle: "为结果表和 Excel 导出自定义列并重新排序",
    dashColumns: "列",
    dashQuickCopyTitle: "快速复制预览链接（简短链接）",
    dashLinkCopied: "链接已复制！",
    dashCopyLink: "复制链接",
    dashLiveShareOnTitle: "实时共享链接已开启 — 查看者可以看到您的最新结果和筛选器",
    dashLiveShareOffTitle: "创建公共实时共享链接（查看者无需登录）",
    dashSharingLive: "正在实时共享",
    dashLiveShare: "实时共享",
    dashPublicLiveShareLink: "公共实时共享链接",
    dashLiveShareDesc: "拥有此链接的任何人都可以看到您的最新结果和当前筛选器 — 无需登录。您工作时会自动更新。",
    dashCopied: "已复制",
    dashCopy: "复制",
    dashStopSharing: "停止共享（撤销链接）",
    dashSharePreviewTitle: "配置结果预览链接并与其他用户共享",
    dashSharePreview: "共享预览",
    dashExportExcelTitle: "导出保留绿色、黄色和红色实心填充的专业 Excel 工作簿",
    dashExportCsvTitle: "将选定的列导出为 CSV",
    dashSearchScopeTitle: "搜索范围",
    dashSearchScopeAll: "所有列（实时）",
    dashSearchScopeOutcome: "判定结果",
    dashSearchScopeReason: "评估原因",
    dashSearchScopeUnmatched: "未匹配差异",
    dashSearchScopeMatchKey: "匹配键",
    dashOptgroupComparison: "比对数据列",
    dashOptgroupReference: "参考数据列",
    dashSearchPlaceholder: "实时搜索行（输入任何内容即时筛选）...",
    dashClearSearchTitle: "清除搜索",
    dashRowsFound: "找到 {count} 行",
    dashActiveColumnFilters: "Excel 列筛选器：",
    dashValsSelected: "已选择 {count} 项",
    dashClearFilterOn: "清除 {label} 上的筛选器",
    dashClearAllColumnFilters: "清除所有列筛选器",
    dashClickToSortBy: "点击按 {label} 排序",
    dashFilterLikeExcelTitle: "像 Excel 一样筛选 {label}（多选清单和搜索）",
    dashFilterAria: "筛选 {label}",
    dashMoveColumnLeft: "将列左移（在表格中前移）",
    dashMoveColumnRight: "将列右移（在表格中后移）",
    dashAllColumnsHidden: "所有表格列当前均已隐藏",
    dashAllColumnsHiddenDesc: "表格视图当前启用了 0 列。要重新查看数据行，请恢复所有列或配置列选项。",
    dashRestoreAllColumns: "恢复所有列",
    dashChooseColumns: "选择列",
    dashClearSearchFilter: "清除搜索筛选器 ({term})",
    dashCellMatched: "已匹配",
    dashCellUnmatched: "未匹配",
    dashCellDiffers: "不同",
    dashUnidentified: "无法识别",
    dashRefDifferingFields: "参考匹配存在不同字段",
    dashMissingInRef: "参考文件中缺失",
    dashInspectRowTitle: "检查行差异",
    dashShowingAllRows: "正在显示全部 {count} 行",
    dashFilteredFromTotal: "（从总计 {count} 行中筛选）",
    dashFullResultView: "完整结果视图",
    dashRowsUnit: "行",
    rulesModalTitle: "规则与逻辑设置",
    rulesSavedOnce: "一次保存",
    rulesModalDesc: "只需配置一次键匹配和评估逻辑。每次导入文件时自动应用。",
    rulesSavedShort: "已保存！",
    rulesSaveSettings: "保存设置",
    rulesTabMapping: "1. 列映射与标准化",
    rulesTabDecision: "2. 判定层与规则",
    rulesStorageNote: "浏览器永久存储 (IndexedDB)",
    rulesPersistNote: "已保存的设置在刷新后仍然保留，并在导入文件时自动应用。",
    rulesEvaluating: "评估中...",
    rulesSaveShowResults: "保存并显示结果",
    filterHeaderPrefix: "筛选：",
    filterCloseMenu: "关闭筛选菜单",
    filterSortAsc: "按 A → Z 排序",
    filterSortDesc: "按 Z → A 排序",
    filterSearchValues: "搜索值...",
    filterSelectAll: "(全选)",
    filterNoMatchingValues: "未找到匹配的值",
    filterClearFilter: "清除筛选器",
    filterApply: "应用",
  },
};
