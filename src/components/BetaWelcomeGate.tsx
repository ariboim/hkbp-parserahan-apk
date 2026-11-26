import React from 'react';
import { ArrowRight, MessageSquareHeart, ShieldAlert } from 'lucide-react';
import { ChurchLogo } from './ChurchLogo';

interface BetaWelcomeGateProps {
  onContinue: () => void;
  onGiveFeedback: () => void;
}

export const BetaWelcomeGate: React.FC<BetaWelcomeGateProps> = ({
  onContinue,
  onGiveFeedback,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Top Church Banner */}
        <div className="bg-gradient-to-br from-[#081C54] via-[#0F2E80] to-[#1565C0] text-white p-6 sm:p-7">
          <div className="flex items-center gap-4">
            <ChurchLogo size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300">
                Pratinjau Publik · Versi Beta
              </p>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-snug">
                HKBP Jatisampurna Wijk Parserahan
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                Portal Jemaat Digital · Admin Utama (Ketua): Roberth Simatupang
              </p>
            </div>
          </div>
        </div>

        {/* Notice Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Pemberitahuan Aplikasi Beta
              </p>
              <p>
                Saat ini Anda mengakses <strong>aplikasi beta</strong> yang masih{' '}
                <strong>dalam tahap pengembangan</strong>. Beberapa konten dan fitur masih
                terus disempurnakan.
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                Mohon berikan masukan dan saran Anda agar kami dapat mencapai finalisasi terbaik
                bagi pelayanan jemaat.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onContinue}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#0D47A1] hover:bg-[#1565C0] active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Lanjutkan ke Aplikasi Beta</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onGiveFeedback}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquareHeart className="w-4 h-4 text-[#0D47A1] dark:text-blue-400" />
              <span>Beri Masukan Melalui Kotak Aspirasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
