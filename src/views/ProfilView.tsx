import React, { useState } from 'react';
import { BellRing, Check, Copy, LogOut, Moon, RefreshCw, Share2, Sun, Trophy } from 'lucide-react';
import { CardTheme, ReminderSettings, UserProfile } from '../types';
import { DigitalIdCard } from '../components/DigitalIdCard';
import { PWAInstallButton } from '../components/PWAInstallButton';

export const getShareBetaUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-gvgvciqeeotukjx2hl4cp4-963636008472.asia-southeast1.run.app';

interface ProfilViewProps {
  profile: UserProfile;
  accountType: 'jemaat' | 'admin';
  cardTheme: CardTheme;
  appDarkMode: boolean;
  xp: number;
  reminderSettings: ReminderSettings;
  onChangeCardTheme: (theme: CardTheme) => void;
  onSwitchAccount: () => void;
  onToggleDarkMode: () => void;
  onOpenNotifications: () => void;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  profile,
  accountType,
  cardTheme,
  appDarkMode,
  xp,
  reminderSettings,
  onChangeCardTheme,
  onSwitchAccount,
  onToggleDarkMode,
  onOpenNotifications,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareBetaLink = () => {
    const shareUrl = getShareBetaUrl();
    if (navigator.share) {
      navigator
        .share({
          title: 'HKBP Jatisampurna Wijk Parserahan (Beta)',
          text: 'Coba aplikasi beta HKBP Jatisampurna Wijk Parserahan dan berikan masukan untuk finalisasi terbaik:',
          url: shareUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Profile Card */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-2xl object-cover object-top shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#0D47A1] text-white font-display font-extrabold text-xl flex items-center justify-center shrink-0">
              {profile.initials}
            </div>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {profile.role} · {profile.weyk}
            </p>
            <p className="text-xs font-mono-nums text-[#0D47A1] dark:text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{xp} XP Game HKBP</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSwitchAccount}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[42px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {accountType === 'jemaat' ? 'Ganti ke Admin Utama (Ketua)' : 'Ganti ke Akun Jemaat'}
            </span>
          </button>
          <button
            type="button"
            onClick={onSwitchAccount}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 min-h-[42px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Digital ID Card + Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7">
          <DigitalIdCard
            profile={profile}
            theme={cardTheme}
            onChangeTheme={onChangeCardTheme}
          />
        </section>

        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Preferensi Aplikasi & Notifikasi
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Reminder Shortcut */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="w-full py-3.5 flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-400 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pengingat Renungan Harian
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {reminderSettings.enabled
                      ? `Aktif setiap pukul ${reminderSettings.time} WIB`
                      : 'Nonaktif'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0D47A1] dark:text-blue-400">Atur</span>
            </button>

            {/* Dark Mode Toggle */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 flex items-center justify-center">
                  {appDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Tampilan Gelap (Dark Mode)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nyaman dibaca saat saat teduh malam
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={appDarkMode}
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  appDarkMode ? 'bg-[#0D47A1]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                    appDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Share Public Beta Link */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bagikan Link Beta Publik
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Akses jemaat tanpa perlu domain khusus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleShareBetaLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[38px] shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <PWAInstallButton />
          </div>
        </section>
      </div>
    </div>
  );
};
