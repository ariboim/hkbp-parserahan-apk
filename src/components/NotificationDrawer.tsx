import React from 'react';
import { Bell, BellRing, CheckCheck, Clock, Sparkles, X } from 'lucide-react';
import { ActiveRoute, AppNotification, ReminderSettings } from '../types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onNavigate: (route: ActiveRoute) => void;
  reminderSettings: ReminderSettings;
  onToggleReminder: (next: boolean) => void;
  onChangeTime: (time: string) => void;
  onSendTestReminder: () => void;
}

const PRESET_TIMES = ['05:30', '06:00', '07:00', '19:00', '21:00'];

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onNavigate,
  reminderSettings,
  onToggleReminder,
  onChangeTime,
  onSendTestReminder,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#0D47A1] dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notifikasi & Pengingat Harian
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel notifikasi"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Daily Devotional Reminder Settings */}
          <section className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#0D47A1] dark:text-blue-400" />
                  <span>Pengingat Renungan Harian</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Terima pengingat otomatis setiap hari agar tetap setia membaca firman & Buku Ende.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reminderSettings.enabled}
                onClick={() => onToggleReminder(!reminderSettings.enabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  reminderSettings.enabled ? 'bg-[#0D47A1]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                    reminderSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {reminderSettings.enabled && (
              <div className="space-y-3 pt-2 border-t border-blue-100 dark:border-blue-900/60">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="reminder-time-input" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jam Pengingat</span>
                  </label>
                  <input
                    id="reminder-time-input"
                    type="time"
                    value={reminderSettings.time}
                    onChange={(e) => onChangeTime(e.target.value)}
                    className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-mono-nums font-semibold text-slate-900 dark:text-white min-h-[40px]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChangeTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono-nums font-medium transition-colors min-h-[36px] ${
                        reminderSettings.time === t
                          ? 'bg-[#0D47A1] text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t} WIB
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Izin Browser:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {reminderSettings.browserPermission === 'granted'
                        ? 'Aktif'
                        : reminderSettings.browserPermission === 'denied'
                        ? 'Diblokir (Notifikasi In-App aktif)'
                        : reminderSettings.browserPermission === 'unsupported'
                        ? 'Mode In-App'
                        : 'Menunggu izin'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={onSendTestReminder}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-[#0D47A1] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors min-h-[40px] whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Uji Pengingat</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Inbox Notifications */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400">
                Pemberitahuan Terbaru
              </h3>
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D47A1] dark:text-blue-400 hover:underline min-h-[36px]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai semua dibaca</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.targetRoute) {
                      onNavigate(n.targetRoute);
                      onClose();
                    }
                  }}
                  className={`w-full text-left p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-[#0D47A1] dark:text-blue-400">
                      {n.type === 'renungan' ? 'Renungan Harian' : n.type === 'warta' ? 'Warta Jemaat' : 'HKBP TV'}
                    </span>
                    <span className="font-mono-nums">{n.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {n.message}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
