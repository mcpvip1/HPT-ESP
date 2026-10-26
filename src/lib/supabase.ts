import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'emp_supabase_url';
const STORAGE_KEY_KEY = 'emp_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://xopzbzpfpnuhkjxokuyj.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-5bs9QzdoRQ4ABkyefT6fg_8pmCDmzG';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let cachedClient: SupabaseClient | null = null;
let clientInitAttempted = false;

const configListeners = new Set<(isConfigured: boolean) => void>();

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let storedUrl = '';
  let storedKey = '';

  try {
    storedUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    storedKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
  } catch {}

  return {
    url: storedUrl || envUrl || DEFAULT_SUPABASE_URL,
    anonKey: storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const config = getStoredSupabaseConfig();
  return Boolean(
    config.url &&
    config.anonKey &&
    config.url.startsWith('https://') &&
    config.anonKey.length > 10
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getEffectiveWorkspaceId(user: User | null): string {
  if (user?.id) return user.id;
  try {
    let devId = localStorage.getItem('emp_device_workspace_id');
    if (!devId || !UUID_REGEX.test(devId)) {
      devId = generateUUID();
      localStorage.setItem('emp_device_workspace_id', devId);
    }
    return devId;
  } catch {
    return '00000000-0000-4000-8000-000000000001';
  }
}

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, error: 'Both Supabase URL and Anon Key are required.' };
  }

  if (!cleanUrl.startsWith('https://')) {
    return { success: false, error: 'Supabase URL must start with https://' };
  }

  try {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    cachedClient = null; // force re-creation
    const client = getSupabase();
    notifyConfigListeners(isSupabaseConfigured());
    return { success: !!client };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save configuration' };
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  } catch {}
  cachedClient = null;
  notifyConfigListeners(false);
}

export function subscribeSupabaseConfig(callback: (isConfigured: boolean) => void): () => void {
  configListeners.add(callback);
  callback(isSupabaseConfigured());
  return () => configListeners.delete(callback);
}

function notifyConfigListeners(configured: boolean) {
  configListeners.forEach((cb) => {
    try {
      cb(configured);
    } catch {}
  });
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase is not configured yet. Please enter your project credentials.') };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase is not configured yet.') };
  }
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { user: data.user, error };
}

export async function signUpWithEmailPassword(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: new Error('Supabase is not configured yet.') };
  }
  const { data, error } = await client.auth.signUp({ email, password });
  return { user: data.user, error };
}

export async function signOutSupabase(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };
  const { error } = await client.auth.signOut();
  return { error };
}

export function onSupabaseAuthStateChange(callback: (user: User | null) => void): () => void {
  const client = getSupabase();
  if (!client) {
    callback(null);
    return () => {};
  }

  // Initial user check
  client.auth.getUser().then(({ data }) => callback(data.user)).catch(() => callback(null));

  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/** Standard SQL schema for users to run in their Supabase SQL editor */
export const SUPABASE_SQL_SCHEMA = `-- 1. Workspaces table (stores entire workbooks & matching results in JSONB without chunking)
create table if not exists public.workspaces (
  user_id uuid primary key default gen_random_uuid(),
  reference_wb jsonb,
  comparison_wb jsonb,
  results jsonb,
  stats jsonb,
  settings jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.workspaces enable row level security;

-- 3. Policy: Allow full read/write operations for both guest (anon) and signed-in users
drop policy if exists "Allow all operations on workspaces" on public.workspaces;
create policy "Allow all operations on workspaces"
  on public.workspaces
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Allow guest & device workspaces (drops strict foreign key to auth.users if present)
alter table public.workspaces drop constraint if exists workspaces_user_id_fkey;
`;
