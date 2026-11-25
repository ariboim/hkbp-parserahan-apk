import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let displayMsg = 'Terjadi gangguan koneksi atau izin akses data.';
      try {
        const parsed = JSON.parse(this.state.errorMessage) as { error?: string };
        if (parsed?.error) {
          displayMsg = parsed.error.includes('Missing or insufficient permissions')
            ? 'Akses ditolak oleh aturan keamanan database. Pastikan Anda masuk dengan akun yang berwenang.'
            : parsed.error;
        }
      } catch {
        displayMsg = this.state.errorMessage || displayMsg;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-lg space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Gangguan Akses Data
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {displayMsg}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#1565C0] min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Tampilan</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
