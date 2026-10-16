import {
  WorkbookData,
  ColumnMapping,
  NormalizationRules,
  DecisionLayer,
  Language,
  SavedMappingPreset,
  SavedDecisionPreset,
} from '../types';

const DB_NAME = 'ExcelMatchProDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

// Fast in-memory cache for sandboxed iframes
const memoryStore = new Map<string, any>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }

    // Timeout guard: if IndexedDB is blocked or sluggish in sandbox iframe, reject after 1500ms
    const timer = setTimeout(() => {
      reject(new Error('IndexedDB connection timed out'));
    }, 1500);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        resolve(request.result);
      };

      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error);
      };

      request.onblocked = () => {
        clearTimeout(timer);
        reject(new Error('IndexedDB blocked'));
      };
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

export async function saveToIDB(key: string, value: any): Promise<void> {
  memoryStore.set(key, value);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => {
          db.close();
          resolve();
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      } catch (txErr) {
        db.close();
        reject(txErr);
      }
    });
  } catch {
    // Fallback: Safe LocalStorage persistence without freezing main thread
    try {
      if (key === StorageKeys.REFERENCE_WORKBOOK && value && value.rows) {
        // Avoid stringifying 50MB of rows into localStorage!
        const safeWorkbook = {
          ...value,
          rows: value.rows.slice(0, 300), // Keep a small preview
          _totalCount: value.rows.length,
          _isTrimmedForStorage: value.rows.length > 300,
        };
        localStorage.setItem(`emp_${key}`, JSON.stringify(safeWorkbook));
      } else {
        localStorage.setItem(`emp_${key}`, JSON.stringify(value));
      }
    } catch {
      // Storage quota reached or denied; memoryStore has it for this session
    }
  }
}

export async function getFromIDB<T>(key: string): Promise<T | null> {
  // Check memory store first
  if (memoryStore.has(key)) {
    return memoryStore.get(key) as T;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          db.close();
          const result = req.result !== undefined ? req.result : null;
          if (result) memoryStore.set(key, result);
          resolve(result);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      } catch (txErr) {
        db.close();
        reject(txErr);
      }
    });
  } catch {
    try {
      const val = localStorage.getItem(`emp_${key}`);
      if (val) {
        const parsed = JSON.parse(val);
        memoryStore.set(key, parsed);
        return parsed as T;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export async function deleteFromIDB(key: string): Promise<void> {
  memoryStore.delete(key);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => {
          db.close();
          resolve();
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      } catch (txErr) {
        db.close();
        reject(txErr);
      }
    });
  } catch {
    try {
      localStorage.removeItem(`emp_${key}`);
    } catch {
      // Ignored
    }
  }
}

export const StorageKeys = {
  REFERENCE_WORKBOOK: 'reference_workbook',
  COMPARISON_WORKBOOK: 'comparison_workbook',
  COLUMN_MAPPINGS: 'column_mappings',
  NORMALIZATION_RULES: 'normalization_rules',
  DECISION_LAYERS: 'decision_layers',
  LANGUAGE: 'language',
  SAVED_MAPPING_PRESETS: 'saved_mapping_presets',
  SAVED_DECISION_PRESETS: 'saved_decision_presets',
};

export const defaultNormalizationRules: NormalizationRules = {
  trimSpaces: true,
  ignoreCase: true,
  removeSpacesAndHyphens: false,
  ignoreLeadingZeros: false,
};

export const defaultDecisionLayers: DecisionLayer[] = [
  {
    id: 'layer_inspection',
    name: 'Inspection Decision (Waive / Accept → Green, Else → Yellow)',
    source: 'merged',
    primaryColumn: 'Inspection Status',
    secondaryColumn: 'Inspection Result',
    matchLogic: 'or',
    rules: [
      {
        id: 'r_waive',
        targetColumn: 'primary',
        condition: 'contains',
        value: 'Waive',
        color: 'green',
        label: 'Inspection Status contains "Waive"',
      },
      {
        id: 'r_accept',
        targetColumn: 'secondary',
        condition: 'contains',
        value: 'Accept',
        color: 'green',
        label: 'Inspection Result contains "Accept"',
      },
      {
        id: 'r_any_waive',
        targetColumn: 'any',
        condition: 'contains',
        value: 'Waive',
        color: 'green',
        label: 'Either Column contains "Waive"',
      },
      {
        id: 'r_any_accept',
        targetColumn: 'any',
        condition: 'contains',
        value: 'Accept',
        color: 'green',
        label: 'Either Column contains "Accept"',
      },
      {
        id: 'r_postpone',
        targetColumn: 'any',
        condition: 'contains',
        value: 'Postpone',
        color: 'yellow',
        label: 'Inspection Status/Result contains "Postpone"',
      },
    ],
    fallbackToOriginalFill: false,
    fallbackColor: 'yellow',
  },
];

// -------------------------------------------------------------
// Column Mapping Presets & Recent History Management
// -------------------------------------------------------------

export async function getSavedMappingPresets(): Promise<SavedMappingPreset[]> {
  const presets = await getFromIDB<SavedMappingPreset[]>(StorageKeys.SAVED_MAPPING_PRESETS);
  return presets || [];
}

export async function saveMappingPreset(preset: SavedMappingPreset): Promise<SavedMappingPreset[]> {
  const current = await getSavedMappingPresets();
  const existingIdx = current.findIndex((p) => p.id === preset.id || p.name.toLowerCase() === preset.name.toLowerCase());
  let updated: SavedMappingPreset[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = preset;
  } else {
    updated = [preset, ...current];
  }
  await saveToIDB(StorageKeys.SAVED_MAPPING_PRESETS, updated);
  return updated;
}

export async function deleteMappingPreset(id: string): Promise<SavedMappingPreset[]> {
  const current = await getSavedMappingPresets();
  const updated = current.filter((p) => p.id !== id);
  await saveToIDB(StorageKeys.SAVED_MAPPING_PRESETS, updated);
  return updated;
}

// Recent Mappings Auto-History
const RECENT_MAPPINGS_KEY = 'recent_mappings_history';

export function getRecentMappings(): { id: string; timestamp: number; mappings: ColumnMapping[]; summary: string }[] {
  try {
    const raw = localStorage.getItem(RECENT_MAPPINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecentMapping(mappings: ColumnMapping[]): void {
  if (!mappings || mappings.length === 0) return;
  try {
    const history = getRecentMappings();
    // Generate signature to avoid duplicates
    const signature = mappings.map((m) => `${m.mainCol}::${m.comparisonCol}`).join('|');
    const filtered = history.filter(
      (h) => h.mappings.map((m) => `${m.mainCol}::${m.comparisonCol}`).join('|') !== signature
    );
    const summary = mappings.map((m) => `${m.mainCol} ↔ ${m.comparisonCol}`).slice(0, 3).join(', ') + (mappings.length > 3 ? ` (+${mappings.length - 3} more)` : '');
    const entry = {
      id: `rec_map_${Date.now()}`,
      timestamp: Date.now(),
      mappings,
      summary,
    };
    const updated = [entry, ...filtered].slice(0, 8); // Keep last 8
    localStorage.setItem(RECENT_MAPPINGS_KEY, JSON.stringify(updated));
  } catch {}
}

// -------------------------------------------------------------
// Decision Layer Presets & Recent History Management
// -------------------------------------------------------------

export async function getSavedDecisionPresets(): Promise<SavedDecisionPreset[]> {
  const presets = await getFromIDB<SavedDecisionPreset[]>(StorageKeys.SAVED_DECISION_PRESETS);
  return presets || [];
}

export async function saveDecisionPreset(preset: SavedDecisionPreset): Promise<SavedDecisionPreset[]> {
  const current = await getSavedDecisionPresets();
  const existingIdx = current.findIndex((p) => p.id === preset.id || p.name.toLowerCase() === preset.name.toLowerCase());
  let updated: SavedDecisionPreset[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = preset;
  } else {
    updated = [preset, ...current];
  }
  await saveToIDB(StorageKeys.SAVED_DECISION_PRESETS, updated);
  return updated;
}

export async function deleteDecisionPreset(id: string): Promise<SavedDecisionPreset[]> {
  const current = await getSavedDecisionPresets();
  const updated = current.filter((p) => p.id !== id);
  await saveToIDB(StorageKeys.SAVED_DECISION_PRESETS, updated);
  return updated;
}

// Recent Decision Layers Auto-History
const RECENT_LAYERS_KEY = 'recent_decision_layers_history';

export function getRecentDecisionLayers(): { id: string; timestamp: number; layers: DecisionLayer[]; summary: string }[] {
  try {
    const raw = localStorage.getItem(RECENT_LAYERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecentDecisionLayers(layers: DecisionLayer[]): void {
  if (!layers || layers.length === 0) return;
  try {
    const history = getRecentDecisionLayers();
    const signature = JSON.stringify(layers.map((l) => ({ name: l.name, p: l.primaryColumn, s: l.secondaryColumn, rc: l.rules.length })));
    const filtered = history.filter(
      (h) => JSON.stringify(h.layers.map((l) => ({ name: l.name, p: l.primaryColumn, s: l.secondaryColumn, rc: l.rules.length }))) !== signature
    );
    const summary = layers.map((l) => l.name).join(' → ');
    const entry = {
      id: `rec_layer_${Date.now()}`,
      timestamp: Date.now(),
      layers,
      summary,
    };
    const updated = [entry, ...filtered].slice(0, 8); // Keep last 8
    localStorage.setItem(RECENT_LAYERS_KEY, JSON.stringify(updated));
  } catch {}
}
