import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  Check,
  Copy,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Trash2,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  getSupabase,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';
import { RippleButton } from './RippleButton';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: (configured: boolean) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  onShowToast,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setIsConfigured(isSupabaseConfigured());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const res = saveSupabaseConfig(url, anonKey);
    if (!res.success) {
      onShowToast(res.error || 'Invalid configuration', 'error');
      return;
    }
    setIsConfigured(true);
    onShowToast('Supabase settings saved successfully!', 'success');
    if (onConfigChanged) onConfigChanged(true);
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const client = getSupabase();
      if (!client) {
        setTestResult({ ok: false, message: 'Client could not be initialized. Check URL and Key.' });
        return;
      }
      // Check database read and table presence
      const { data, error } = await client.from('workspaces').select('user_id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          setTestResult({
            ok: false,
            message: 'Connected to Supabase, but the "workspaces" table is not created yet. Run the SQL schema below in your Supabase SQL Editor.',
          });
          setShowSqlGuide(true);
        } else if (error.code === '42501') {
          setTestResult({
            ok: false,
            message: 'Connected to Supabase, but Row Level Security (RLS) is blocking read access. Run the SQL schema below in your Supabase SQL Editor.',
          });
          setShowSqlGuide(true);
        } else {
          setTestResult({
            ok: true,
            message: `Connected to Supabase successfully (${error.message || 'API responded'}).`,
          });
        }
      } else {
        // Test write / RLS permission with a transient probe
        const probeId = '00000000-0000-0000-0000-000000000000';
        const { error: writeErr } = await client.from('workspaces').upsert(
          { user_id: probeId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

        if (writeErr) {
          if (writeErr.code === '42501') {
            setTestResult({
              ok: true,
              message: 'Connected! Read access is active. For write access without signing in, apply the RLS policy SQL below in your Supabase SQL Editor.',
            });
            setShowSqlGuide(true);
          } else if (writeErr.code === '23503') {
            setTestResult({
              ok: true,
              message: 'RLS policy verified! To allow guest saves without user sign-in, run step 4 in the SQL editor below (alter table public.workspaces drop constraint if exists workspaces_user_id_fkey;).',
            });
            setShowSqlGuide(true);
          } else {
            setTestResult({
              ok: true,
              message: `Connected to Supabase (${writeErr.message}).`,
            });
          }
        } else {
          await client.from('workspaces').delete().eq('user_id', probeId);
          setTestResult({
            ok: true,
            message: 'Connection verified! Read and write cloud sync are 100% operational on Supabase.',
          });
        }
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setIsConfigured(false);
    setTestResult(null);
    onShowToast('Supabase configuration removed. Running in offline/local mode.', 'info');
    if (onConfigChanged) onConfigChanged(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
      onShowToast('SQL Schema copied to clipboard!', 'success');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                Supabase Migration & Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL Cloud Sync (No 1MB chunking, unlimited daily writes)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConfigured ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isConfigured ? 'Supabase Connected' : 'Local Mode (Supabase Not Configured)'}
              </span>
            </div>
            {isConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Disconnect
              </button>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Supabase Project URL
                </span>
                <span className="text-[11px] font-normal text-slate-400">https://xyz.supabase.co</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  Supabase Anon (Public) Key
                </span>
                <span className="text-[11px] font-normal text-slate-400">API Settings &gt; anon public</span>
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Test connection feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* SQL Schema helper */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-heading">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                Required Supabase SQL Schema
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Run this once in your <strong className="text-slate-700 dark:text-slate-300">Supabase SQL Editor</strong> to create the <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">workspaces</code> table. It uses native PostgreSQL JSONB columns so your entire workbook is stored seamlessly.
            </p>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 inline-flex items-center gap-1"
          >
            Open Supabase Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            {isConfigured && (
              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Test Connection
              </button>
            )}
            <RippleButton
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl border border-emerald-500/40 shadow-xs transition-all cursor-pointer"
            >
              Save Configuration
            </RippleButton>
          </div>
        </div>
      </div>
    </div>
  );
};
