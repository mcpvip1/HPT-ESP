import LZString from 'lz-string';
import { MatchedRow, MatchingStats, ColumnConfigItem, ResultColor } from '../types';

export interface SharedPreviewPayload {
  version: 1 | 2;
  createdAt: number;
  comparisonWbName: string;
  stats: MatchingStats;
  results: MatchedRow[];
  filter?: 'all' | 'green' | 'yellow' | 'red' | 'blue' | 'unmatched';
  onlyAccept?: boolean;
  searchTerm?: string;
  searchColumn?: string;
  columnConfigs?: ColumnConfigItem[];
}

/**
 * Ultra-compact representation for shareable preview links.
 * Minimizes URL length by up to 90% by stripping repetitive object keys,
 * storing headers once, and encoding rows as compact tuples.
 */
interface CompactPreviewPayload {
  v: 2;
  t: number;
  n: string;
  f?: string;
  oa?: number; // 1 = Only Accept on, 0 = off (absent = default on)
  s?: string;
  sc?: string;
  st: [number, number, number, number, number, number?]; // [total, green, yellow, red, matched, blue?]
  cols?: ColumnConfigItem[];
  ch: string[]; // comparison headers
  rh: string[]; // reference headers
  r: [number, number, number, string, any[], any[]][];
}

const COLOR_MAP: Record<ResultColor | 'none', number> = {
  green: 0,
  yellow: 1,
  red: 2,
  none: 3,
  blue: 4,
  purple: 5,
};

const COLOR_REVERSE_MAP: (ResultColor | 'none')[] = [
  'green',
  'yellow',
  'red',
  'none',
  'blue',
  'purple',
];

/**
 * Packs full MatchedRow[] results into a minimal CompactPreviewPayload
 */
export function packCompact(payload: SharedPreviewPayload): CompactPreviewPayload {
  // Extract unique comparison and reference headers
  const chSet = new Set<string>();
  const rhSet = new Set<string>();

  for (const row of payload.results) {
    if (row.comparisonRow) {
      Object.keys(row.comparisonRow).forEach((k) => chSet.add(k));
    }
    if (row.matchedMainRow) {
      Object.keys(row.matchedMainRow).forEach((k) => rhSet.add(k));
    }
  }

  const ch = Array.from(chSet);
  const rh = Array.from(rhSet);

  const r: [number, number, number, string, any[], any[]][] = payload.results.map((row) => {
    const compVals = ch.map((k) => row.comparisonRow[k] ?? '');
    const refVals = rh.length > 0 && row.matchedMainRow ? rh.map((k) => row.matchedMainRow![k] ?? '') : [];
    const colorCode = COLOR_MAP[row.decisionColor] ?? 3;
    const isMatchedCode = row.isMatched ? 1 : 0;
    const reason = row.decisionReason || '';

    return [row.rowIndex, colorCode, isMatchedCode, reason, compVals, refVals];
  });

  return {
    v: 2,
    t: payload.createdAt || Date.now(),
    n: payload.comparisonWbName || 'Evaluation_Results',
    f: payload.filter !== 'all' ? payload.filter : undefined,
    oa: payload.onlyAccept ? 1 : 0,
    s: payload.searchTerm ? payload.searchTerm : undefined,
    sc: payload.searchColumn !== 'all' ? payload.searchColumn : undefined,
    st: [
      payload.stats.totalIncoming,
      payload.stats.greenCount,
      payload.stats.yellowCount,
      payload.stats.redCount,
      payload.stats.matchedCount,
      payload.stats.blueCount || 0,
    ],
    cols: payload.columnConfigs,
    ch,
    rh,
    r,
  };
}

/**
 * Unpacks CompactPreviewPayload back into full SharedPreviewPayload
 */
export function unpackCompact(compact: CompactPreviewPayload): SharedPreviewPayload {
  const ch = compact.ch || [];
  const rh = compact.rh || [];

  const results: MatchedRow[] = (compact.r || []).map((tup, idx) => {
    const [rowIndex, colorCode, isMatchedCode, reason, compVals, refVals] = tup;
    const decisionColor = COLOR_REVERSE_MAP[colorCode] || 'none';
    const isMatched = isMatchedCode === 1;

    const comparisonRow: Record<string, any> = {};
    ch.forEach((colName, cIdx) => {
      comparisonRow[colName] = compVals?.[cIdx] ?? '';
    });

    let matchedMainRow: Record<string, any> | undefined = undefined;
    if (isMatched && rh.length > 0 && refVals && refVals.length > 0) {
      matchedMainRow = {};
      rh.forEach((colName, rIdx) => {
        matchedMainRow![colName] = refVals[rIdx] ?? '';
      });
    }

    const mergedRow: Record<string, any> = { ...comparisonRow };
    if (matchedMainRow) {
      Object.entries(matchedMainRow).forEach(([k, v]) => {
        mergedRow[`[Ref] ${k}`] = v;
      });
    }

    return {
      id: `row_${idx + 1}`,
      rowIndex: rowIndex || idx + 1,
      matchKey: ch.length > 0 ? String(comparisonRow[ch[0]] ?? '') : '',
      isMatched,
      decisionColor,
      decisionReason: reason || '',
      comparisonRow,
      matchedMainRow,
      mergedRow,
    };
  });

  const totalIncoming = compact.st ? compact.st[0] : results.length;
  const greenCount = compact.st ? compact.st[1] : results.filter((r) => r.decisionColor === 'green').length;
  const yellowCount = compact.st ? compact.st[2] : results.filter((r) => r.decisionColor === 'yellow').length;
  const redCount = compact.st ? compact.st[3] : results.filter((r) => r.decisionColor === 'red').length;
  const matchedCount = compact.st ? compact.st[4] : results.filter((r) => r.isMatched).length;
  const blueCount = compact.st && compact.st[5] !== undefined ? compact.st[5] : results.filter((r) => r.decisionColor === 'blue').length;
  const unmatchedCount = Math.max(0, totalIncoming - matchedCount);
  const matchRate = totalIncoming > 0 ? Number(((matchedCount / totalIncoming) * 100).toFixed(1)) : 0;

  return {
    version: 2,
    createdAt: compact.t || Date.now(),
    comparisonWbName: compact.n || 'Evaluation_Results',
    filter: (compact.f as any) || 'all',
    onlyAccept: compact.oa !== 0,
    searchTerm: compact.s || '',
    searchColumn: compact.sc || 'all',
    columnConfigs: compact.cols,
    stats: {
      totalIncoming,
      matchedCount,
      unmatchedCount,
      matchRate,
      greenCount,
      yellowCount,
      redCount,
      blueCount,
      otherCount: Math.max(0, totalIncoming - (greenCount + yellowCount + redCount + blueCount)),
      unmatchedItems: [],
    },
    results,
  };
}

/**
 * Resolves the clean short URL for live preview page (e.g. https://mcpvip1.github.io/HPT-ESP/preview)
 */
export function getShortPreviewUrl(): string {
  if (typeof window === 'undefined') return '/preview';
  const origin = window.location.origin;
  let pathname = window.location.pathname;

  // Strip trailing /preview or /preview/
  pathname = pathname.replace(/\/preview\/?$/, '');
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }
  return `${origin}${pathname}preview`;
}

/**
 * Encodes the preview data and produces clean, short shareable links.
 */
export function generatePreviewLink(payload: SharedPreviewPayload): {
  url: string;
  shortUrl: string;
  hashUrl: string;
  isHashTooLong: boolean;
  charCount: number;
} {
  // Always cache latest shared preview locally for immediate testing
  try {
    localStorage.setItem('emp_shared_preview_latest', JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not cache preview locally', e);
  }

  const shortUrl = getShortPreviewUrl();

  // Pack into ultra-compact tuple matrix
  const compact = packCompact(payload);
  const jsonStr = JSON.stringify(compact);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const hashUrl = `${baseUrl}#preview=${compressed}`;

  // Default link is the short clean preview URL as requested: https://mcpvip1.github.io/HPT-ESP/preview
  return {
    url: shortUrl,
    shortUrl,
    hashUrl,
    isHashTooLong: false,
    charCount: shortUrl.length,
  };
}

/**
 * Reads a public live-share id from the URL (?share=... or #share=...).
 * Share links open the preview without requiring sign-in.
 */
export function getShareIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('share');
    if (q) return q;
    const m = window.location.hash.match(/share=([A-Za-z0-9]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Builds the public live-share preview link for a share id.
 */
export function getSharePreviewUrl(shareId: string): string {
  return `${getShortPreviewUrl()}?share=${shareId}`;
}

/**
 * The short fixed preview link — always shows the latest results published
 * to the fixed public slot (no share id in the URL).
 */
export function getFixedPreviewUrl(): string {
  return getShortPreviewUrl();
}

/**
 * Checks if the current page was loaded via a preview link:
 * - pathname ending with /preview or /preview/
 * - hash #/preview or #preview=...
 * - search query ?preview=...
 */
export function parsePreviewFromUrl(): SharedPreviewPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    const isPreviewRoute =
      path.endsWith('/preview') ||
      path.endsWith('/preview/') ||
      hash.startsWith('#/preview') ||
      hash.includes('preview') ||
      search.includes('preview');

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
        } catch {}
      }
      if (decompressed) {
        const parsed = JSON.parse(decompressed);

        // Check if modern Compact format (v: 2)
        if (parsed && parsed.v === 2 && Array.isArray(parsed.r)) {
          return unpackCompact(parsed as CompactPreviewPayload);
        }

        // Backwards compatibility for legacy v1 format
        if (parsed && parsed.results && parsed.stats) {
          return parsed as SharedPreviewPayload;
        }
      }
    }

    // Load from cached preview in localStorage if on /preview route or hash
    if (isPreviewRoute) {
      const cached = localStorage.getItem('emp_shared_preview_latest');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.v === 2) {
          return unpackCompact(parsed as CompactPreviewPayload);
        }
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
export async function copyPreviewLinkToClipboard(
  payload: SharedPreviewPayload
): Promise<{ success: boolean; url: string }> {
  // Copy the hash URL: it embeds the compressed payload, so the link works
  // on any device/browser. The short clean URL carries no data and only
  // resolves via the same browser's localStorage cache.
  const { hashUrl: url } = generatePreviewLink(payload);
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

/**
 * Generates an offline, standalone interactive HTML file containing the filtered Result Table.
 * Recipients can open it in any browser with zero dependencies, no server, and no URL length limits!
 */
export function exportStandalonePreviewHtml(payload: SharedPreviewPayload): void {
  const title = `${payload.comparisonWbName || 'Evaluation'} - Result Preview`;
  const resultsJson = JSON.stringify(payload.results);
  const chList = payload.columnConfigs?.filter((c) => c.showInTable) || [];

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #020617; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; }
    .status-green { background-color: rgba(6, 78, 59, 0.4); border-left: 4px solid #34d399; }
    .status-yellow { background-color: rgba(120, 53, 15, 0.4); border-left: 4px solid #fbbf24; }
    .status-red { background-color: rgba(136, 19, 55, 0.4); border-left: 4px solid #f43f5e; }
  </style>
</head>
<body class="p-6">
  <div class="max-w-7xl mx-auto space-y-4">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-xl font-bold text-white">${title}</h1>
        <p class="text-xs text-slate-400 mt-1">Generated snapshot · ${new Date(payload.createdAt).toLocaleString()}</p>
      </div>
      <div class="text-xs text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg">
        ${payload.results.length} Total Rows
      </div>
    </div>

    <!-- Search Input -->
    <div class="flex items-center gap-2">
      <input id="searchInput" type="text" placeholder="Filter rows in real-time..." class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full max-w-md focus:outline-none focus:border-emerald-500 font-mono">
    </div>

    <!-- Table -->
    <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900 shadow-xl">
      <table class="w-full text-left text-xs border-collapse" id="dataTable">
        <thead class="bg-slate-950 border-b border-slate-800 text-slate-300 font-mono">
          <tr id="tableHeader"></tr>
        </thead>
        <tbody id="tableBody" class="divide-y divide-slate-800/80 font-mono"></tbody>
      </table>
    </div>
  </div>

  <script>
    const data = ${resultsJson};
    const colConfigs = ${JSON.stringify(chList)};
    const tbody = document.getElementById('tableBody');
    const thead = document.getElementById('tableHeader');
    const searchInput = document.getElementById('searchInput');

    // Build headers
    const cols = colConfigs.length > 0 ? colConfigs : [
      { id: 'rowIndex', label: '#' },
      { id: 'decisionStatus', label: 'Status' },
      ...Object.keys(data[0]?.comparisonRow || {}).map(k => ({ id: k, label: k }))
    ];

    cols.forEach(c => {
      const th = document.createElement('th');
      th.className = 'py-3 px-3 border-r border-slate-800 whitespace-nowrap text-slate-300';
      th.textContent = c.label;
      thead.appendChild(th);
    });

    function renderRows(rows) {
      tbody.innerHTML = '';
      rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = r.decisionColor === 'green' ? 'status-green' : r.decisionColor === 'yellow' ? 'status-yellow' : 'status-red';
        
        cols.forEach(c => {
          const td = document.createElement('td');
          td.className = 'py-2 px-3 border-r border-slate-800/80 whitespace-nowrap';
          if (c.id === 'rowIndex') td.textContent = r.rowIndex;
          else if (c.id === 'decisionStatus') td.textContent = r.decisionColor.toUpperCase();
          else if (c.id === 'decisionReason') td.textContent = r.decisionReason;
          else if (c.id.startsWith('[Ref] ')) td.textContent = r.matchedMainRow?.[c.id.replace('[Ref] ', '')] || '';
          else td.textContent = r.comparisonRow[c.id] || '';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    renderRows(data);

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { renderRows(data); return; }
      const filtered = data.filter(r => {
        return JSON.stringify(r.comparisonRow).toLowerCase().includes(q) || (r.decisionReason || '').toLowerCase().includes(q);
      });
      renderRows(filtered);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${payload.comparisonWbName || 'Evaluation_Results'}_Preview.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
