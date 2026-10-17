import { ColumnMapping } from '../types';

export type SuggestionCategory =
  | 'value'
  | 'identifier'
  | 'material'
  | 'tracking'
  | 'quantity'
  | 'date'
  | 'status'
  | 'partner'
  | 'location'
  | 'general';

export interface ColumnSuggestion {
  id: string;
  mainCol: string;
  comparisonCol: string;
  confidence: number; // 0 - 100
  confidenceTier: 'high' | 'medium' | 'low';
  category: SuggestionCategory;
  categoryLabel: string;
  reason: string;
  matchedTerms: [string, string];
  isAlreadyMapped: boolean;
}

export interface SuggestionAnalysisResult {
  totalSuggestions: number;
  unmappedSuggestionsCount: number;
  suggestions: ColumnSuggestion[];
  categories: { key: SuggestionCategory; label: string; count: number }[];
}

/**
 * Standard industry synonym pairs and semantic keyword dictionaries.
 * Covers Finance/Value ('Amt', 'Total', 'Net', 'Price'), Procurement ('PO', 'Order'),
 * Inventory/Tracking ('Lot', 'Batch', 'Serial'), Quantities, Quality/Status, etc.
 */
interface IndustryDomain {
  category: SuggestionCategory;
  categoryLabel: string;
  keywords: string[];
  synonymGroups: string[][];
}

const INDUSTRY_DOMAINS: IndustryDomain[] = [
  {
    category: 'value',
    categoryLabel: 'Financial & Value',
    keywords: [
      'amt', 'amount', 'total', 'net', 'net_amount', 'netamt', 'gross', 'value', 'val',
      'price', 'unit_price', 'cost', 'unit_cost', 'sum', 'balance', 'charge',
      'subtotal', 'line_total', 'extended_amount', 'ext_amt', 'grand_total', 'fee',
      'rate', 'billing', 'paid', 'payment', 'total_amount', 'net_value', 'money'
    ],
    synonymGroups: [
      ['amt', 'total', 'amount', 'net', 'value', 'price', 'cost', 'gross', 'subtotal', 'grandtotal'],
      ['unitprice', 'cost', 'unitcost', 'rate', 'price'],
      ['netamt', 'totalamt', 'netvalue', 'netamount', 'totalvalue', 'totalamount', 'linetotal', 'extendedamt']
    ],
  },
  {
    category: 'identifier',
    categoryLabel: 'Procurement & Document ID',
    keywords: [
      'po', 'ponumber', 'pono', 'order', 'orderid', 'orderno', 'docno', 'document',
      'invoice', 'invno', 'invid', 'sonumber', 'salesorder', 'contract', 'reqno',
      'requisition', 'billno', 'ticket', 'reference', 'refno', 'trackingno'
    ],
    synonymGroups: [
      ['po', 'ponumber', 'pono', 'purchaseorder', 'orderid', 'orderno', 'order'],
      ['invoice', 'invno', 'invid', 'billno', 'billingdoc'],
      ['salesorder', 'so', 'sono', 'order'],
      ['reqno', 'requisition', 'prno']
    ],
  },
  {
    category: 'material',
    categoryLabel: 'Part & Material Catalog',
    keywords: [
      'part', 'partnumber', 'partno', 'item', 'itemcode', 'itemno', 'material', 'matnr',
      'sku', 'product', 'productid', 'articleno', 'model', 'spec', 'component', 'catalog'
    ],
    synonymGroups: [
      ['part', 'item', 'material', 'product', 'sku', 'partnumber', 'itemcode', 'materialno', 'matnr', 'article']
    ],
  },
  {
    category: 'tracking',
    categoryLabel: 'Lot, Batch & Serialization',
    keywords: [
      'lot', 'lotnumber', 'lotno', 'batch', 'batchnumber', 'batchno', 'serial',
      'serialnumber', 'sn', 'tracker', 'traceid', 'heatno', 'wafer', 'die', 'reel'
    ],
    synonymGroups: [
      ['lot', 'batch', 'lotnumber', 'batchnumber', 'lotno', 'batchno', 'heattreat', 'heatno'],
      ['serial', 'serialnumber', 'sn', 'serialno', 'tag']
    ],
  },
  {
    category: 'quantity',
    categoryLabel: 'Quantity & Volume',
    keywords: [
      'qty', 'quantity', 'count', 'units', 'pcs', 'pieces', 'volume', 'vol',
      'orderqty', 'deliveredqty', 'receivedqty', 'shippedqty', 'acceptedqty',
      'rejectedqty', 'balanceqty', 'weight', 'uom', 'packsize'
    ],
    synonymGroups: [
      ['qty', 'quantity', 'count', 'pieces', 'pcs', 'units', 'volume'],
      ['deliveredqty', 'receivedqty', 'orderqty', 'shippedqty', 'actualqty']
    ],
  },
  {
    category: 'date',
    categoryLabel: 'Date & Timeline',
    keywords: [
      'date', 'trxdate', 'orderdate', 'deliverydate', 'shipdate', 'duedate',
      'invoicedate', 'createddate', 'timestamp', 'period', 'postdate', 'validto', 'expiredate'
    ],
    synonymGroups: [
      ['date', 'trxdate', 'orderdate', 'postingdate', 'timestamp', 'period', 'createddate'],
      ['duedate', 'deliverydate', 'promiseddate', 'shipdate', 'scheduledate']
    ],
  },
  {
    category: 'status',
    categoryLabel: 'Inspection & Status',
    keywords: [
      'status', 'state', 'result', 'inspectionstatus', 'qcstatus', 'condition',
      'passfail', 'flag', 'approval', 'stage', 'disposition', 'grade', 'remark'
    ],
    synonymGroups: [
      ['status', 'state', 'result', 'disposition', 'outcome', 'decision'],
      ['inspectionstatus', 'qcstatus', 'quality', 'grade', 'inspectionresult']
    ],
  },
  {
    category: 'partner',
    categoryLabel: 'Vendor & Customer',
    keywords: [
      'vendor', 'vendorcode', 'vendorname', 'supplier', 'suppliercode', 'customer',
      'customercode', 'client', 'carrier', 'partner', 'payee', 'shipper'
    ],
    synonymGroups: [
      ['vendor', 'supplier', 'vendorname', 'suppliername', 'vendorcode', 'suppliercode'],
      ['customer', 'client', 'buyer', 'account']
    ],
  },
  {
    category: 'location',
    categoryLabel: 'Warehouse & Location',
    keywords: [
      'warehouse', 'wh', 'plant', 'site', 'location', 'loc', 'facility',
      'bin', 'rack', 'storage', 'depot', 'store'
    ],
    synonymGroups: [
      ['warehouse', 'plant', 'facility', 'site', 'depot', 'wh', 'location']
    ],
  },
];

/**
 * Normalizes a header string for intelligent heuristic comparison:
 * strips prefixes like 'col_', '#', 'fld_', removes non-alphanumeric, lowercases.
 */
export function normalizeHeaderKey(header: string): string {
  if (!header) return '';
  return header
    .toLowerCase()
    .replace(/^col(?:umn)?_?/i, '')
    .replace(/^fld_?/i, '')
    .replace(/[#_.\-\s/\\()[\]:]+/g, '')
    .trim();
}

/**
 * Breaks a header into semantic tokens for multi-term matching
 */
export function tokenizeHeader(header: string): string[] {
  if (!header) return [];
  // Split on camelCase, spaces, underscores, dashes, punctuation
  const words = header
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  return words;
}

/**
 * Identifies if a term or header belongs to a specific industry domain
 */
export function detectIndustryCategory(header: string): {
  category: SuggestionCategory;
  categoryLabel: string;
  matchedKeyword?: string;
} {
  const clean = normalizeHeaderKey(header);
  const tokens = tokenizeHeader(header);

  for (const domain of INDUSTRY_DOMAINS) {
    // Check direct clean match
    if (domain.keywords.includes(clean)) {
      return { category: domain.category, categoryLabel: domain.categoryLabel, matchedKeyword: clean };
    }
    // Check token match
    for (const token of tokens) {
      if (domain.keywords.includes(token)) {
        return { category: domain.category, categoryLabel: domain.categoryLabel, matchedKeyword: token };
      }
    }
    // Check substring
    for (const kw of domain.keywords) {
      if (clean.includes(kw) && kw.length >= 3) {
        return { category: domain.category, categoryLabel: domain.categoryLabel, matchedKeyword: kw };
      }
    }
  }

  return { category: 'general', categoryLabel: 'General Match' };
}

/**
 * Computes semantic similarity and industry terminology match between two column headers.
 */
export function evaluateHeaderMatch(
  mainCol: string,
  compCol: string
): {
  isMatch: boolean;
  confidence: number;
  confidenceTier: 'high' | 'medium' | 'low';
  category: SuggestionCategory;
  categoryLabel: string;
  reason: string;
  matchedTerms: [string, string];
} {
  const mainNorm = normalizeHeaderKey(mainCol);
  const compNorm = normalizeHeaderKey(compCol);

  if (!mainNorm || !compNorm) {
    return {
      isMatch: false,
      confidence: 0,
      confidenceTier: 'low',
      category: 'general',
      categoryLabel: 'General Match',
      reason: 'Empty header',
      matchedTerms: ['', ''],
    };
  }

  // 1. Exact identical header match
  if (mainCol.trim() === compCol.trim()) {
    const cat = detectIndustryCategory(mainCol);
    return {
      isMatch: true,
      confidence: 100,
      confidenceTier: 'high',
      category: cat.category,
      categoryLabel: cat.categoryLabel,
      reason: `Exact identical column header (${mainCol})`,
      matchedTerms: [mainCol, compCol],
    };
  }

  // 2. Exact normalized match (e.g. "PO Number" vs "po_number" or "Lot #" vs "LotNo")
  if (mainNorm === compNorm) {
    const cat = detectIndustryCategory(mainCol);
    return {
      isMatch: true,
      confidence: 98,
      confidenceTier: 'high',
      category: cat.category,
      categoryLabel: cat.categoryLabel,
      reason: `Exact normalized name match ('${mainCol}' ↔ '${compCol}')`,
      matchedTerms: [mainCol, compCol],
    };
  }

  const mainTokens = tokenizeHeader(mainCol);
  const compTokens = tokenizeHeader(compCol);

  // 3. Search industry synonym groups (e.g., 'Amt' and 'Total' or 'Net' and 'Value')
  for (const domain of INDUSTRY_DOMAINS) {
    for (const group of domain.synonymGroups) {
      let mainGroupHit: string | null = null;
      let compGroupHit: string | null = null;

      // Check whole normalized match with group
      for (const synonym of group) {
        if (mainNorm === synonym || mainTokens.includes(synonym)) {
          mainGroupHit = synonym;
        }
        if (compNorm === synonym || compTokens.includes(synonym)) {
          compGroupHit = synonym;
        }
      }

      // Check substring hits if token hit didn't happen (e.g. "total_amount" contains "total")
      if (!mainGroupHit) {
        for (const synonym of group) {
          if (mainNorm.includes(synonym) && synonym.length >= 3) {
            mainGroupHit = synonym;
            break;
          }
        }
      }
      if (!compGroupHit) {
        for (const synonym of group) {
          if (compNorm.includes(synonym) && synonym.length >= 3) {
            compGroupHit = synonym;
            break;
          }
        }
      }

      if (mainGroupHit && compGroupHit) {
        // High confidence industry terminology match (e.g., 'Amt' and 'Total' or 'Net' and 'Value')
        const isExactSynonym =
          (mainTokens.includes(mainGroupHit) || mainNorm === mainGroupHit) &&
          (compTokens.includes(compGroupHit) || compNorm === compGroupHit);

        const confidence = isExactSynonym ? 95 : 88;
        return {
          isMatch: true,
          confidence,
          confidenceTier: 'high',
          category: domain.category,
          categoryLabel: domain.categoryLabel,
          reason: `Industry terminology synonym: '${mainCol}' matches '${compCol}' under ${domain.categoryLabel} (${mainGroupHit} ↔ ${compGroupHit})`,
          matchedTerms: [mainGroupHit, compGroupHit],
        };
      }
    }
  }

  // 4. Token overlap match (e.g. "Order Date" vs "Delivery Date", "PO Line Number" vs "PO Line")
  const commonTokens = mainTokens.filter((t) => compTokens.includes(t) && t.length >= 2);
  if (commonTokens.length > 0) {
    const totalTokens = Math.max(mainTokens.length, compTokens.length);
    const overlapRatio = commonTokens.length / totalTokens;
    const cat = detectIndustryCategory(mainCol);

    if (overlapRatio >= 0.5 || commonTokens.length >= 2) {
      return {
        isMatch: true,
        confidence: Math.round(70 + overlapRatio * 20),
        confidenceTier: overlapRatio >= 0.7 ? 'high' : 'medium',
        category: cat.category,
        categoryLabel: cat.categoryLabel,
        reason: `Shared key terminology: '${commonTokens.join(', ')}' in '${mainCol}' & '${compCol}'`,
        matchedTerms: [commonTokens[0], commonTokens[0]],
      };
    }
  }

  // 5. Substring containment for terms >= 4 chars (e.g. "MaterialDescription" vs "Material")
  if (
    (mainNorm.length >= 4 && compNorm.includes(mainNorm)) ||
    (compNorm.length >= 4 && mainNorm.includes(compNorm))
  ) {
    const cat = detectIndustryCategory(mainCol);
    return {
      isMatch: true,
      confidence: 72,
      confidenceTier: 'medium',
      category: cat.category,
      categoryLabel: cat.categoryLabel,
      reason: `Column header name containment between '${mainCol}' and '${compCol}'`,
      matchedTerms: [mainNorm.slice(0, 5), compNorm.slice(0, 5)],
    };
  }

  return {
    isMatch: false,
    confidence: 0,
    confidenceTier: 'low',
    category: 'general',
    categoryLabel: 'General Match',
    reason: 'No standard terminology overlap found',
    matchedTerms: ['', ''],
  };
}

/**
 * Suggestion Engine analyzer:
 * Scans all headers in main and comparison files, evaluates them using industry terminology,
 * eliminates duplicate pairings with lower confidence, checks against existing active mappings,
 * and sorts recommendations by confidence.
 */
export function analyzeColumnSuggestions(
  mainHeaders: string[],
  compHeaders: string[],
  existingMappings: ColumnMapping[] = []
): SuggestionAnalysisResult {
  if (!mainHeaders || !compHeaders || mainHeaders.length === 0 || compHeaders.length === 0) {
    return {
      totalSuggestions: 0,
      unmappedSuggestionsCount: 0,
      suggestions: [],
      categories: [],
    };
  }

  const existingMapLookup = new Set(
    existingMappings.map((m) => `${m.mainCol.trim()}|||${m.comparisonCol.trim()}`)
  );

  const rawSuggestions: ColumnSuggestion[] = [];
  const usedPairs = new Set<string>();

  for (const mainCol of mainHeaders) {
    for (const compCol of compHeaders) {
      const evalResult = evaluateHeaderMatch(mainCol, compCol);
      if (evalResult.isMatch && evalResult.confidence >= 65) {
        const pairKey = `${mainCol}|||${compCol}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        const isAlreadyMapped = existingMapLookup.has(pairKey);

        rawSuggestions.push({
          id: `sug_${encodeURIComponent(mainCol)}_${encodeURIComponent(compCol)}`,
          mainCol,
          comparisonCol: compCol,
          confidence: evalResult.confidence,
          confidenceTier: evalResult.confidenceTier,
          category: evalResult.category,
          categoryLabel: evalResult.categoryLabel,
          reason: evalResult.reason,
          matchedTerms: evalResult.matchedTerms,
          isAlreadyMapped,
        });
      }
    }
  }

  // Rank suggestions by confidence descending
  rawSuggestions.sort((a, b) => b.confidence - a.confidence);

  // Filter so that each mainCol and compCol has its best intelligent match,
  // while keeping secondary alternatives accessible if needed.
  const selected: ColumnSuggestion[] = [];
  const claimedMain = new Set<string>();
  const claimedComp = new Set<string>();

  // First pass: pick best unmapped matches
  for (const s of rawSuggestions) {
    if (!claimedMain.has(s.mainCol) && !claimedComp.has(s.comparisonCol)) {
      selected.push(s);
      claimedMain.add(s.mainCol);
      claimedComp.add(s.comparisonCol);
    }
  }

  // Second pass: add high-confidence alternatives if any main/comp didn't get picked
  for (const s of rawSuggestions) {
    if (s.confidence >= 85 && !selected.some((x) => x.id === s.id)) {
      selected.push(s);
    }
  }

  // Sort final selected list: unmapped first, then highest confidence
  selected.sort((a, b) => {
    if (a.isAlreadyMapped !== b.isAlreadyMapped) {
      return a.isAlreadyMapped ? 1 : -1;
    }
    return b.confidence - a.confidence;
  });

  // Calculate category aggregates
  const categoryCounts: Record<SuggestionCategory, { label: string; count: number }> = {
    value: { label: 'Financial & Value', count: 0 },
    identifier: { label: 'Procurement & Document ID', count: 0 },
    material: { label: 'Part & Material Catalog', count: 0 },
    tracking: { label: 'Lot, Batch & Serial', count: 0 },
    quantity: { label: 'Quantity & Volume', count: 0 },
    date: { label: 'Date & Timeline', count: 0 },
    status: { label: 'Inspection & Status', count: 0 },
    partner: { label: 'Vendor & Customer', count: 0 },
    location: { label: 'Warehouse & Location', count: 0 },
    general: { label: 'General Match', count: 0 },
  };

  for (const s of selected) {
    if (categoryCounts[s.category]) {
      categoryCounts[s.category].count++;
    }
  }

  const categories = (Object.keys(categoryCounts) as SuggestionCategory[])
    .filter((k) => categoryCounts[k].count > 0)
    .map((k) => ({
      key: k,
      label: categoryCounts[k].label,
      count: categoryCounts[k].count,
    }));

  const unmappedCount = selected.filter((s) => !s.isAlreadyMapped).length;

  return {
    totalSuggestions: selected.length,
    unmappedSuggestionsCount: unmappedCount,
    suggestions: selected,
    categories,
  };
}
