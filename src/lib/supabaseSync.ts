import { getSupabase } from './supabase';
import type {
  ColumnConfigItem,
  ColumnMapping,
  DecisionLayer,
  MatchedRow,
  MatchingStats,
  NormalizationRules,
  SavedDecisionPreset,
  SavedMappingPreset,
  WorkbookData,
} from '../types';

export interface StoredColumnSettings {
  order: string[];
  visibility: Record<string, { table: boolean; export: boolean }>;
  updatedAt?: number;
}

export interface WorkspaceSettings {
  normalization: NormalizationRules;
  layers: DecisionLayer[];
  mappings: ColumnMapping[];
  holdColumn: string;
  holdValues: string[];
  holdReason: string;
  releasedRowIds: string[];
  mappingPresets?: SavedMappingPreset[];
  decisionPresets?: SavedDecisionPreset[];
  columnConfigs?: StoredColumnSettings;
  updatedAt: number;
}

export interface FullWorkspacePayload {
  referenceWb?: WorkbookData | null;
  comparisonWb?: WorkbookData | null;
  results?: MatchedRow[] | null;
  stats?: MatchingStats | null;
  settings?: WorkspaceSettings | null;
}

/** Tiny debounce helper */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number
): ((...args: Args) => void) & { cancel: () => void } {
  let t: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (t) clearTimeout(t);
    t = undefined;
  };
  return debounced;
}

/**
 * Upsert workspace data into Supabase `workspaces` table.
 * PostgreSQL JSONB stores whole workbooks and results in a single row without chunking.
 */
export async function syncWorkspaceToSupabase(
  userId: string,
  payload: FullWorkspacePayload
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Supabase client or user not authenticated' };
  }

  try {
    const updatePayload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (payload.referenceWb !== undefined) updatePayload.reference_wb = payload.referenceWb;
    if (payload.comparisonWb !== undefined) updatePayload.comparison_wb = payload.comparisonWb;
    if (payload.results !== undefined) updatePayload.results = payload.results;
    if (payload.stats !== undefined) updatePayload.stats = payload.stats;
    if (payload.settings !== undefined) updatePayload.settings = payload.settings;

    const { error } = await client
      .from('workspaces')
      .upsert(updatePayload, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase workspace sync error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Failed to sync to Supabase:', err);
    return { success: false, error: err?.message || 'Sync failed' };
  }
}

/**
 * Fetch the entire user workspace from Supabase.
 */
export async function fetchWorkspaceFromSupabase(
  userId: string
): Promise<{ success: boolean; data?: FullWorkspacePayload; error?: string }> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, error: 'Supabase client or user not authenticated' };
  }

  try {
    const { data, error } = await client
      .from('workspaces')
      .select('reference_wb, comparison_wb, results, stats, settings, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch workspace error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: undefined };
    }

    return {
      success: true,
      data: {
        referenceWb: data.reference_wb,
        comparisonWb: data.comparison_wb,
        results: data.results,
        stats: data.stats,
        settings: data.settings,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch from Supabase' };
  }
}

/**
 * Sync only settings (rules, mappings, layers, column configs) to Supabase.
 */
export async function syncSettingsToSupabase(
  userId: string,
  settings: WorkspaceSettings
): Promise<{ success: boolean; error?: string }> {
  return syncWorkspaceToSupabase(userId, { settings });
}

/**
 * Delete / reset cloud workspace in Supabase.
 */
export async function wipeSupabaseWorkspace(userId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !userId) return false;
  try {
    const { error } = await client
      .from('workspaces')
      .delete()
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}
