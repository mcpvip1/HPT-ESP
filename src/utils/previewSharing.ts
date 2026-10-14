import LZString from 'lz-string';
import { MatchedRow, MatchingStats, ColumnConfigItem } from '../types';

export interface SharedPreviewPayload {
  version: 1;
  createdAt: number;
  comparisonWbName: string;
  stats: MatchingStats;
  results: MatchedRow[];
  filter?: 'all' | 'green' | 'yellow' | 'red' | 'unmatched';
  searchTerm?: string;
  searchColumn?: string;
  columnConfigs?: ColumnConfigItem[];
}

/**
 * Encodes the preview data and active filter state into a shareable URL hash.
 */
export function generatePreviewLink(payload: SharedPreviewPayload): {
  url: string;
  isHashTooLong: boolean;
  charCount: number;
} {
  // Always cache latest shared preview locally so same-browser / testing works instantly
  try {
    localStorage.setItem('emp_shared_preview_latest', JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not cache preview locally', e);
  }

  // Strip unnecessary redundant data to optimize URL size
  const optimizedPayload: SharedPreviewPayload = {
    version: 1,
    createdAt: payload.createdAt || Date.now(),
    comparisonWbName: payload.comparisonWbName || 'Evaluation_Results',
    stats: payload.stats,
    results: payload.results,
    filter: payload.filter || 'all',
    searchTerm: payload.searchTerm || '',
    searchColumn: payload.searchColumn || 'all',
    columnConfigs: payload.columnConfigs,
  };

  const jsonStr = JSON.stringify(optimizedPayload);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const fullUrl = `${baseUrl}#preview=${compressed}`;

  // Check if exceeds standard URL safe limit (~25,000 characters)
  const isHashTooLong = fullUrl.length > 25000;

  return {
    url: fullUrl,
    isHashTooLong,
    charCount: fullUrl.length,
  };
}

/**
 * Checks if the current page was loaded via a preview link (#preview=... or ?preview=...),
 * and reconstructs the results, stats, and filter settings.
 */
export function parsePreviewFromUrl(): SharedPreviewPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const hash = window.location.hash;
    const search = window.location.search;

    let compressed: string | null = null;

    if (hash.startsWith('#preview=')) {
      compressed = hash.slice('#preview='.length);
    } else if (hash.includes('preview=')) {
      const match = hash.match(/preview=([^&]+)/);
      if (match) compressed = match[1];
    } else if (search.includes('preview=')) {
      const params = new URLSearchParams(search);
      compressed = params.get('preview');
    }

    if (compressed) {
      let decompressed = LZString.decompressFromEncodedURIComponent(compressed);
      if (!decompressed) {
        try {
          decompressed = LZString.decompressFromEncodedURIComponent(decodeURIComponent(compressed));
        } catch {
          // Ignore decode error
        }
      }
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        if (parsed && parsed.results && parsed.stats) {
          return parsed as SharedPreviewPayload;
        }
      }
    }

    // Fallback: If hash is just #preview or ?preview=true, load from cached preview in localStorage
    if (hash.includes('preview') || search.includes('preview')) {
      const cached = localStorage.getItem('emp_shared_preview_latest');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.results && parsed.stats) {
          return parsed as SharedPreviewPayload;
        }
      }
    }
  } catch (err) {
    console.error('Failed to parse preview from URL:', err);
  }

  return null;
}

/**
 * Copies preview link to clipboard with cross-browser fallback
 */
export async function copyPreviewLinkToClipboard(payload: SharedPreviewPayload): Promise<{ success: boolean; url: string }> {
  const { url } = generatePreviewLink(payload);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    }
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return { success: successful, url };
  } catch (e) {
    console.warn('Failed to copy to clipboard', e);
    return { success: false, url };
  }
}
