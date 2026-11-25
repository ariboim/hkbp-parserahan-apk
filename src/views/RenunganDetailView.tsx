import React, { useState } from 'react';
import { BellRing, BookOpen, Calendar, Clock, Music, Sparkles } from 'lucide-react';
import { ARCHIVE_DEVOTIONALS } from '../data/mockData';
import { ActiveRoute, Devotional, ReminderSettings } from '../types';

interface RenunganDetailViewProps {
  initialDevotional: Devotional;
  reminderSettings: ReminderSettings;
  onToggleReminder: (next: boolean) => void;
  onChangeTime: (time: string) => void;
  onSendTestReminder: () => void;
  onNavigate: (route: ActiveRoute) => void;
}

export const RenunganDetailView: React.FC<RenunganDetailViewProps> = ({
  initialDevotional,
  reminderSettings,
  onToggleReminder,
  onChangeTime,
  onSendTestReminder,
  onNavigate,
}) => {
  const [selectedId, setSelectedId] = useState(initialDevotional.id);
  const [language, setLanguage] = useState<'indo' | 'batak'>('indo');

  const current = ARCHIVE_DEVOTIONALS.find((d) => d.id === selectedId) || initialDevotional;

  return (
    <div className="space-y-6 pb-8">
      {/* Archive Selector */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {ARCHIVE_DEVOTIONALS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
              selectedId === item.id
                ? 'bg-[#0D47A1] text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {item.dateLabel}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Devotional Content */}
        <article className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-[#0D47A1] dark:text-blue-400" />
              <span>{current.dateLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#0D47A1] dark:text-blue-400">
                {current.readingRef}
              </span>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setLanguage('indo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[34px] ${
                  language === 'indo'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Indonesia
              </button>
              <button
                type="button"
                onClick={() => setLanguage('batak')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[34px] ${
                  language === 'batak'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Bahasa Batak
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {current.title}
          </h2>

          {/* Scripture Box (no thick left border) */}
          <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D47A1] dark:text-blue-300 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>{language === 'batak' ? current.batakRef : current.readingRef}</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed italic">
              “{language === 'batak' ? current.batakQuote : current.quote}”
            </p>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
            {current.reflection.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Prayer */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Tangiang / Doa Penutup
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {current.prayer}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'sub', view: 'musik-player', param: current.hymnId })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-sm font-semibold hover:bg-[#1565C0] transition-colors min-h-[44px]"
            >
              <Music className="w-4 h-4" />
              <span>Putar & Baca Lirik {current.hymnRef}</span>
            </button>
          </div>
        </article>

        {/* Daily Reminder Panel */}
        <aside className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#0D47A1] dark:text-blue-400" />
                <span>Pengingat Harian</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Jadwalkan notifikasi harian untuk membaca renungan dan ayat harian HKBP.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reminderSettings.enabled}
              onClick={() => onToggleReminder(!reminderSettings.enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
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

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Waktu Pengingat</span>
              </span>
              <input
                type="time"
                value={reminderSettings.time}
                onChange={(e) => onChangeTime(e.target.value)}
                disabled={!reminderSettings.enabled}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-mono-nums font-semibold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={onSendTestReminder}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kirim Contoh Pengingat Sekarang</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
