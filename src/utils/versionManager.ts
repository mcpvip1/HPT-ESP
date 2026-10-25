export interface AppVersionInfo {
  version: string;
  releaseDate: string;
  releaseTime: string;
  buildNumber: string;
  highlights: Record<string, string[]>;
}

export const CURRENT_LATEST_VERSION: AppVersionInfo = {
  version: 'v2.4.2',
  releaseDate: 'October 25, 2026',
  releaseTime: '07:15 AM',
  buildNumber: '2026.10.25-0715',
  highlights: {
    en: [
      'High-performance Excel multi-sheet data auto-matching engine',
      'Instant cloud workspace synchronization & real-time preview',
      'Refined light & dark mode interface with enhanced contrast',
      'Automated background integrity verification & update manager',
    ],
    my: [
      'Excel ဖိုင်များစွာ စစ်ဆေးမှုနှင့် ဒေတာ တိုက်ဆိုင်စစ်ဆေးသည့်စနစ်',
      'Cloud Workspace အချိန်နှင့်တပြေးညီ ချိတ်ဆက်မှုစနစ်',
      'Light & Dark Mode အလင်းအမှောင် ရွေးချယ်မှုအဆင့်မြှင့်တင်ထားခြင်း',
      'စနစ်ပိုင်းဆိုင်ရာ နောက်ဆုံးဗားရှင်းသို့ အလိုအလျောက် အဆင့်မြှင့်ခြင်း',
    ],
    th: [
      'เครื่องมือจับคู่ข้อมูล Excel หลายชีตความเร็วสูงที่แม่นยำ',
      'การซิงค์ข้อมูลบน Cloud Workspace และแสดงตัวอย่างแบบเรียลไทม์',
      'ปรับปรุงชุดสีโหมดสว่างและมืดให้อ่านง่าย สบายตายิ่งขึ้น',
      'ระบบตรวจสอบและอัปเดตเวอร์ชันอัตโนมัติพร้อมการตรวจสอบความสมบูรณ์',
    ],
    zh: [
      '高性能多工作表 Excel 智能比对与决策匹配引擎',
      '即时云端工作区同步与实时共享预览体验',
      '优化明暗双主题企业级视觉色彩与高对比度界面',
      '自动后台数据完整性校验与最新系统更新管理器',
    ],
  },
};

export const STORAGE_KEY_INSTALLED_VERSION = 'emp_app_installed_version';
export const STORAGE_KEY_LAST_CHECKED = 'emp_app_last_check_ts';
export const STORAGE_KEY_LAST_UPDATED_AT = 'emp_app_last_updated_at';

/**
 * Gets the current installed version stored on the device.
 * Defaults to 'v2.4.0' if not previously set, ensuring first visit triggers update check.
 */
export function getInstalledVersion(): string {
  try {
    const val = localStorage.getItem(STORAGE_KEY_INSTALLED_VERSION);
    if (val) return val;
  } catch {}
  return 'v2.4.0';
}

/**
 * Checks if a newer version is available compared to the locally recorded version.
 */
export async function checkAppUpdate(simulateDelayMs: number = 1200): Promise<{
  hasUpdate: boolean;
  installedVersion: string;
  latestVersion: AppVersionInfo;
}> {
  // Simulate network check latency
  if (simulateDelayMs > 0) {
    await new Promise((r) => setTimeout(r, simulateDelayMs));
  }

  const installed = getInstalledVersion();
  const hasUpdate = installed !== CURRENT_LATEST_VERSION.version;

  try {
    localStorage.setItem(STORAGE_KEY_LAST_CHECKED, String(Date.now()));
  } catch {}

  return {
    hasUpdate,
    installedVersion: installed,
    latestVersion: CURRENT_LATEST_VERSION,
  };
}

/**
 * Marks the application as updated to the latest version.
 */
export async function applyAppUpdate(): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY_INSTALLED_VERSION, CURRENT_LATEST_VERSION.version);
    localStorage.setItem(STORAGE_KEY_LAST_UPDATED_AT, String(Date.now()));
  } catch {}
}

/**
 * Resets the installed version to an earlier build for demonstration/testing.
 */
export function resetVersionForTesting(): void {
  try {
    localStorage.setItem(STORAGE_KEY_INSTALLED_VERSION, 'v2.4.0');
    localStorage.removeItem(STORAGE_KEY_LAST_UPDATED_AT);
  } catch {}
}
