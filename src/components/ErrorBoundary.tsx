import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('ExcelMatchProDB');
      }
    } catch (e) {
      console.warn('Failed clearing storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Application Recovered from Error
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected exception occurred while rendering. You can safely reload the page or reset the workspace cache.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-rose-300 max-h-32 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleClearStorage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                title="Clears corrupted local cache and restarts fresh"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
