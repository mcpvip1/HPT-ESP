/**
 * Real build-based update checking.
 *
 * The previous implementation hardcoded a "latest version" (v2.4.2) in
 * source and faked the update with a timed animation: it downloaded
 * nothing, reloaded nothing, and only flipped a localStorage flag. So the
 * displayed version never changed on real deploys, and dismissing the
 * prompt meant being nagged again on every open.
 *
 * Now the version is the Vite bundle's own content hash:
 * - At build time, a Vite plugin writes `dist/version.json` with the
 *   current bundle's hash and build timestamp.
 * - At runtime, the running bundle's hash is parsed from its own
 *   `import.meta.url`, and the latest hash is fetched fresh (no-store)
 *   from `version.json`.
 * - An update is offered only when the fetched hash differs from the
 *   running hash AND the user has not dismissed that exact hash.
 * - "Update" records the update in history and reloads the page, which is
 *   what actually loads the new bundle. If the reload still serves stale
 *   code (cached index.html), the prompt correctly reappears.
 * - When version.json cannot be fetched (offline, dev mode, or a deploy
 *   predating version.json), no prompt is shown: an unknown state must
 *   never be presented as an available update.
 */

export interface AppVersionInfo {
  /** Short build hash, e.g. 'B9OvoesV' — this IS the version now. */
  version: string;
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

/** Display info for the running build ('dev' when no bundle hash exists). */
export function getRunningVersionInfo(): AppVersionInfo {
  const { hash } = getRunningBuild();
  return {
    version: hash ?? 'dev',
    buildHash: hash ?? '',
    jsFile: hash ? `index-${hash}.js` : '',
    releaseDate: '',
    releaseTime: '',
    builtAt: '',
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
    const { hash, js, builtAt } = data as Record<string, unknown>;
    if (typeof hash !== 'string' || !hash || typeof builtAt !== 'string') return null;
    const { releaseDate, releaseTime } = formatBuildDate(builtAt);
    return {
      version: hash,
      buildHash: hash,
      jsFile: typeof js === 'string' && js ? js : `index-${hash}.js`,
      releaseDate,
      releaseTime,
      builtAt,
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

/** Pure prompt rule, unit-tested: unknown builds never prompt. */
export function shouldPromptUpdate(
  runningHash: string | null,
  latestHash: string | null,
  dismissedHash: string | null
): boolean {
  if (!runningHash || !latestHash) return false;
  return latestHash !== runningHash && latestHash !== dismissedHash;
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
    hasUpdate: shouldPromptUpdate(runningHash, latest.buildHash, getDismissedVersion()),
    runningHash,
    latest,
  };
}
