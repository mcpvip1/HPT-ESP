/**
 * Real build-based update checking.
 *
 * Displayed version numbers come from release.json (V2.1.4 style), bumped
 * on every release push, with the change log carried in version.json.
 * The bundle content hash is still tracked underneath: it is what makes
 * the prompt fire even for a rebuild whose release number was not bumped.
 *
 * - At build time, a Vite plugin writes `dist/version.json` with the
 *   release version, change log, bundle hash, and build timestamp, and
 *   the same release version is baked into the bundle via define.
 * - At runtime, the latest version.json is fetched fresh (no-store).
 * - An update is offered only when the deployed version OR hash differs
 *   from the running build AND the user has not dismissed that exact hash.
 * - "Update" records the update in history and reloads the page, which is
 *   what actually loads the new bundle. If the reload still serves stale
 *   code (cached index.html), the prompt correctly reappears.
 * - When version.json cannot be fetched (offline, dev mode, or a deploy
 *   predating version.json), no prompt is shown: an unknown state must
 *   never be presented as an available update.
 */

export interface AppVersionInfo {
  /** Release version number, e.g. 'V2.1.4' (from release.json). */
  version: string;
  /** Vite bundle content hash, e.g. 'WTHRyv-2' (the per-build identity). */
  buildHash: string;
  jsFile: string;
  releaseDate: string;
  releaseTime: string;
  /** ISO build timestamp from version.json ('' for the running-build fallback). */
  builtAt: string;
  highlights?: Record<string, string[]>;
}

export interface UpdateHistoryEntry {
  version: string;
  builtAt: string;
  appliedAt: string;
}

const STORAGE_KEY_DISMISSED_VERSION = 'emp_app_dismissed_version';
const STORAGE_KEY_UPDATE_HISTORY = 'emp_app_update_history';
const MAX_HISTORY_ENTRIES = 10;

function safeGet(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemove(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {}
}

/** Extract the Vite content hash from a bundle URL (null for dev / unknown). */
export function parseBuildHash(url: string): string | null {
  const match = url.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js(?:[?#]|$)/);
  return match ? match[1] : null;
}

/** The bundle this page actually loaded (null hash in dev mode). */
export function getRunningBuild(): { hash: string | null; jsFile: string | null } {
  try {
    const hash = parseBuildHash(import.meta.url);
    return { hash, jsFile: hash ? `index-${hash}.js` : null };
  } catch {
    return { hash: null, jsFile: null };
  }
}

/** Release version baked into this bundle ('dev' outside a Vite build). */
export function getRunningReleaseVersion(): string {
  try {
    return typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__ ? __APP_VERSION__ : 'dev';
  } catch {
    return 'dev';
  }
}

function getRunningBuiltAt(): string {
  try {
    return typeof __APP_BUILT_AT__ !== 'undefined' && __APP_BUILT_AT__ ? __APP_BUILT_AT__ : '';
  } catch {
    return '';
  }
}

/** Display info for the running build ('dev' when no bundle hash exists). */
export function getRunningVersionInfo(): AppVersionInfo {
  const { hash } = getRunningBuild();
  const builtAt = getRunningBuiltAt();
  const { releaseDate, releaseTime } = formatBuildDate(builtAt);
  return {
    version: getRunningReleaseVersion(),
    buildHash: hash ?? '',
    jsFile: hash ? `index-${hash}.js` : '',
    releaseDate,
    releaseTime,
    builtAt,
  };
}

function formatBuildDate(iso: string): { releaseDate: string; releaseTime: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { releaseDate: '', releaseTime: '' };
  return {
    releaseDate: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    releaseTime: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

/** One-line build stamp for tooltips, e.g. 'Oct 26, 2026, 4:47 PM'. */
export function formatBuildDisplay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const { releaseDate, releaseTime } = formatBuildDate(iso);
  return `${releaseDate}, ${releaseTime}`;
}

/** Fetch the currently deployed build (null when unreachable or malformed). */
export async function fetchLatestVersion(): Promise<AppVersionInfo | null> {
  // Vite always defines BASE_URL in real builds ('/HPT-ESP/' in prod);
  // the fallback only guards non-Vite runtimes (tests, previews).
  let baseUrl = '/';
  try {
    const configured = (import.meta as unknown as { env?: { BASE_URL?: unknown } })?.env
      ?.BASE_URL;
    if (typeof configured === 'string' && configured) baseUrl = configured;
  } catch {}
  try {
    const response = await fetch(`${baseUrl}version.json`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return null;
    const { hash, js, builtAt, version, highlights } = data as Record<string, unknown>;
    if (typeof hash !== 'string' || !hash || typeof builtAt !== 'string') return null;
    const { releaseDate, releaseTime } = formatBuildDate(builtAt);
    return {
      version: typeof version === 'string' && version ? version : hash,
      buildHash: hash,
      jsFile: typeof js === 'string' && js ? js : `index-${hash}.js`,
      releaseDate,
      releaseTime,
      builtAt,
      highlights:
        highlights && typeof highlights === 'object'
          ? (highlights as Record<string, string[]>)
          : undefined,
    };
  } catch {
    return null;
  }
}

/** The build hash the user dismissed with "Remind Me Later" (if any). */
export function getDismissedVersion(): string | null {
  return safeGet(STORAGE_KEY_DISMISSED_VERSION);
}

export function dismissVersion(hash: string): void {
  if (hash) safeSet(STORAGE_KEY_DISMISSED_VERSION, hash);
}

export function clearDismissedVersion(): void {
  safeRemove(STORAGE_KEY_DISMISSED_VERSION);
}

export function getUpdateHistory(): UpdateHistoryEntry[] {
  try {
    const raw = safeGet(STORAGE_KEY_UPDATE_HISTORY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is UpdateHistoryEntry =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as UpdateHistoryEntry).version === 'string' &&
        typeof (entry as UpdateHistoryEntry).appliedAt === 'string'
    );
  } catch {
    return [];
  }
}

/** Record an update the user chose (newest first, capped, deduped by build). */
export function recordUpdateApplied(info: AppVersionInfo): void {
  if (!info.buildHash) return;
  try {
    const list = getUpdateHistory().filter((entry) => entry.version !== info.buildHash);
    list.unshift({
      version: info.buildHash,
      builtAt: info.builtAt,
      appliedAt: new Date().toISOString(),
    });
    safeSet(STORAGE_KEY_UPDATE_HISTORY, JSON.stringify(list.slice(0, MAX_HISTORY_ENTRIES)));
  } catch {}
}

/**
 * Pure prompt rule, unit-tested: unknown builds never prompt. A prompt
 * fires when the release number OR the bundle hash differs — so a rebuild
 * whose release number was not bumped still prompts — unless the user
 * dismissed exactly that build.
 */
export function shouldPromptUpdate(
  runningVersion: string,
  runningHash: string | null,
  latestVersion: string | null,
  latestHash: string | null,
  dismissedHash: string | null
): boolean {
  if (!runningHash || !latestHash) return false;
  if (latestHash === dismissedHash) return false;
  return latestVersion !== runningVersion || latestHash !== runningHash;
}

/**
 * True update check: a prompt appears only when the deployed build really
 * differs from the running build and the user has not dismissed that build.
 */
export async function checkAppUpdate(): Promise<{
  hasUpdate: boolean;
  runningHash: string | null;
  latest: AppVersionInfo | null;
}> {
  const { hash: runningHash } = getRunningBuild();
  if (!runningHash) return { hasUpdate: false, runningHash, latest: null };
  const latest = await fetchLatestVersion();
  if (!latest) return { hasUpdate: false, runningHash, latest: null };
  return {
    hasUpdate: shouldPromptUpdate(
      getRunningReleaseVersion(),
      runningHash,
      latest.version,
      latest.buildHash,
      getDismissedVersion()
    ),
    runningHash,
    latest,
  };
}
