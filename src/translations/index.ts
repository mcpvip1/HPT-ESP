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
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appName: "ExcelMatch Pro",
    appSubtitle: "Intelligent Auto-Sorting, Matching & Decision Engine",
    step1: "1. Files",
    step2: "2. Results & Export",
    step3: "Results & Export",
    rulesLogicSetting: "Rules & Logic Setting",
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
    appName: "ExcelMatch Pro",
    appSubtitle: "အလိုအလျောက် Excel အချက်အလက်နှိုင်းယှဉ်စစ်ဆေးရေး အင်ဂျင်",
    step1: "၁. ဖိုင်များ",
    step2: "၂. ရလဒ်နှင့် ထုတ်ယူမှု",
    step3: "ရလဒ်နှင့် ထုတ်ယူမှု",
    rulesLogicSetting: "စည်းမျဉ်း သတ်မှတ်ချက်",
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
    appName: "ExcelMatch Pro",
    appSubtitle: "ระบบเปรียบเทียบข้อมูล จัดเรียง และประเมินผลอัตโนมัติสำหรับ Excel",
    step1: "1. ไฟล์ข้อมูล",
    step2: "2. ผลลัพธ์และส่งออก",
    step3: "ผลลัพธ์และส่งออก",
    rulesLogicSetting: "Rules & Logic Setting",
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
    appName: "ExcelMatch Pro",
    appSubtitle: "企业级智能 Excel 自动比对、多列匹配与决策引擎",
    step1: "1. 数据文件",
    step2: "2. 结果与导出",
    step3: "结果与导出",
    rulesLogicSetting: "规则与逻辑设置",
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
