import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { Language } from '../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface ShortcutItem {
  keys: string[];
  actionEn: string;
  actionMy: string;
  actionTh: string;
  actionZh: string;
  category: 'workflow' | 'search' | 'export';
}

const SHORTCUTS: ShortcutItem[] = [
  {
    keys: ['Ctrl', 'Enter'],
    actionEn: 'Execute Data Comparison & Matching',
    actionMy: 'ဒေတာနှိုင်းယှဉ်တွက်ချက်မှု လုပ်ဆောင်ရန်',
    actionTh: 'เริ่มการเปรียบเทียบและจับคู่ข้อมูล',
    actionZh: '执行数据比对与匹配计算',
    category: 'workflow',
  },
  {
    keys: ['Ctrl', 'M'],
    actionEn: 'Open Matching Rules & Decision Engine Modal',
    actionMy: 'ကိုက်ညီမှု စည်းမျဉ်းများနှင့် ဆုံးဖြတ်ချက် Modal ဖွင့်ရန်',
    actionTh: 'เปิดหน้าต่างกฎการจับคู่และกระบวนการตัดสินใจ',
    actionZh: '打开列映射规则与决策引擎面板',
    category: 'workflow',
  },
  {
    keys: ['/'],
    actionEn: 'Focus Real-Time Search Input across all columns',
    actionMy: 'ကော်လံအားလုံးရှာဖွေမှု အကွက်သို့ သွားရန်',
    actionTh: 'ไปยังช่องค้นหาข้อมูลแบบเรียลไทม์',
    actionZh: '聚焦全列实时搜索框',
    category: 'search',
  },
  {
    keys: ['Ctrl', 'K'],
    actionEn: 'Quick Focus Search Bar',
    actionMy: 'ရှာဖွေရန် အမြန်အကွက်ဖွင့်ပါ',
    actionTh: 'ค้นหาด่วนทันใจ',
    actionZh: '快速定位搜索输入框',
    category: 'search',
  },
  {
    keys: ['Ctrl', 'E'],
    actionEn: 'Export Styled Excel Workbook with Summary & Exceptions',
    actionMy: 'အရောင်စုံ သတ်မှတ်ထားသော Excel ဖိုင် ဒေါင်းလုဒ်လုပ်ရန်',
    actionTh: 'ส่งออกไฟล์ Excel พร้อมสีและรายงานสรุป',
    actionZh: '导出带颜色高亮、总结和异常的 Excel 工作簿',
    category: 'export',
  },
  {
    keys: ['Esc'],
    actionEn: 'Close Active Modal / Clear Focus',
    actionMy: 'လက်ရှိ Modal ပိတ်ရန် / Focus ဖျက်ရန်',
    actionTh: 'ปิดหน้าต่างที่เปิดอยู่ / ยกเลิกการเลือก',
    actionZh: '关闭当前弹窗 / 取消聚焦',
    category: 'workflow',
  },
  {
    keys: ['?'],
    actionEn: 'Show Keyboard Shortcuts Reference',
    actionMy: 'ကီးဘုတ် ဖြတ်လမ်းများ လမ်းညွှန်ပြသရန်',
    actionTh: 'แสดงแป้นพิมพ์ลัดทั้งหมด',
    actionZh: '显示键盘快捷键帮助指南',
    category: 'workflow',
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const formatKey = (key: string) => {
    if (key === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
    return key;
  };

  const getAction = (item: ShortcutItem) => {
    if (language === 'my') return item.actionMy;
    if (language === 'th') return item.actionTh;
    if (language === 'zh') return item.actionZh;
    return item.actionEn;
  };

  const title =
    language === 'my'
      ? 'ကီးဘုတ် ဖြတ်လမ်းများ လမ်းညွှန်'
      : language === 'th'
      ? 'คู่มือแป้นพิมพ์ลัด'
      : language === 'zh'
      ? '键盘快捷键指南'
      : 'Keyboard Shortcuts Guide';

  const subtitle =
    language === 'my'
      ? 'လျင်မြန်စွာ အသုံးပြုနိုင်ရန် ကီးဘုတ်ဖြတ်လမ်းများကို အသုံးပြုပါ'
      : language === 'th'
      ? 'เพิ่มความเร็วในการทำงานด้วยคีย์ลัดระดับโปร'
      : language === 'zh'
      ? '使用专业快捷键大幅提升数据比对效率'
      : 'Pro keyboard shortcuts for ultra-fast matching & navigation';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-card,#ffffff)] border border-[var(--border,#cbd5e1)] dark:bg-slate-900 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--border-light,#e2e8f0)] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary,#0f172a)] dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-[var(--text-muted,#64748b)] dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 divide-y divide-[var(--border-light,#f1f5f9)] dark:divide-slate-800/80 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
            >
              <span className="text-xs font-medium text-[var(--text-primary,#0f172a)] dark:text-slate-200">
                {getAction(item)}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="inline-flex items-center justify-center min-w-[26px] h-6 px-2 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-2xs"
                  >
                    {formatKey(k)}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-[var(--border-light,#e2e8f0)] dark:border-slate-800 flex items-center justify-between text-xs text-[var(--text-muted,#64748b)] dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Command className="w-3.5 h-3.5 opacity-70" />
            ExcelMatch Pro Enterprise Suite
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            {language === 'my' ? 'ပိတ်ပါ' : language === 'th' ? 'ปิด' : language === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
