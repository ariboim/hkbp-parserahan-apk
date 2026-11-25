import React from 'react';
import {
  Bell,
  BellRing,
  BookMarked,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageSquareHeart,
  Music,
  Newspaper,
  Sparkles,
  Tv,
  Users,
} from 'lucide-react';
import { ASSETS } from '../data/mockData';
import { ActiveRoute, Devotional, ReminderSettings, UserProfile } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface HomeViewProps {
  profile: UserProfile;
  devotional: Devotional;
  unreadNotifications: number;
  reminderSettings: ReminderSettings;
  onOpenNotifications: () => void;
  onNavigate: (route: ActiveRoute) => void;
}

interface MenuTile {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  bg: string;
  text: string;
  route: ActiveRoute;
}

const MENU_ITEMS: MenuTile[] = [
  { id: 'almanak', label: 'Almanak', icon: Calendar, bg: 'bg-sky-50 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300', route: { type: 'sub', view: 'almanak' } },
  { id: 'alkitab', label: 'Alkitab', icon: BookOpen, bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', route: { type: 'tab', tab: 'alkitab' } },
  { id: 'musik', label: 'Musik', icon: Music, bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-300', route: { type: 'tab', tab: 'musik' } },
  { id: 'pengajaran', label: 'Pengajaran', icon: GraduationCap, bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', route: { type: 'sub', view: 'pengajaran' } },
  { id: 'media', label: 'Media', icon: Newspaper, bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', route: { type: 'sub', view: 'media' } },
  { id: 'organisasi', label: 'Organisasi', icon: Users, bg: 'bg-violet-50 dark:bg-violet-950/60', text: 'text-violet-700 dark:text-violet-300', route: { type: 'sub', view: 'organisasi' } },
  { id: 'cari-gereja', label: 'Cari Gereja', icon: MapPin, bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', route: { type: 'sub', view: 'cari-gereja' } },
  { id: 'absensi', label: 'Absensi', icon: CheckCircle2, bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', route: { type: 'sub', view: 'absensi' } },
  { id: 'donasi', label: 'Donasi', icon: HeartHandshake, bg: 'bg-pink-50 dark:bg-pink-950/60', text: 'text-pink-700 dark:text-pink-300', route: { type: 'sub', view: 'donasi' } },
  { id: 'event', label: 'Event', icon: CalendarDays, bg: 'bg-orange-50 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-300', route: { type: 'sub', view: 'event' } },
  { id: 'hkbp-tv', label: 'HKBP TV', icon: Tv, bg: 'bg-red-50 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-300', route: { type: 'sub', view: 'hkbp-tv' } },
  { id: 'aspirasi', label: 'Aspirasi', icon: MessageSquareHeart, bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', route: { type: 'sub', view: 'aspirasi' } },
  { id: 'hasudungan', label: 'Cerita Alkitab', icon: BookMarked, bg: 'bg-lime-50 dark:bg-lime-950/60', text: 'text-lime-700 dark:text-lime-300', route: { type: 'sub', view: 'hasudungan' } },
  { id: 'game', label: 'Game HKBP', icon: Gamepad2, bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', route: { type: 'sub', view: 'game' } },
];

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  devotional,
  unreadNotifications,
  reminderSettings,
  onOpenNotifications,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 pb-8">
      {/* Top Hero Header */}
      <header className="rounded-3xl bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#0B3B8C] text-white p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-100">
              Horas, {profile.name.split(' ')[0]}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
              HKBP Parserahan
            </h1>
            <p className="text-xs text-blue-100/90 mt-0.5 leading-snug">
              Wijk parserahan HKBP Jatisampurna
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Buka notifikasi dan pengingat renungan"
              className="relative min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-slate-950 font-mono-nums text-[11px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'tab', tab: 'profil' })}
              aria-label="Buka profil dan kartu identitas digital"
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white text-[#0D47A1] font-display font-extrabold text-sm flex items-center justify-center shadow-xs hover:bg-blue-50 transition-colors"
            >
              {profile.initials}
            </button>
          </div>
        </div>

        <div className="mt-4 sm:hidden">
          <PWAInstallButton compact />
        </div>
      </header>

      {/* Main Responsive Split on Desktop: Renungan + Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Renungan Hari Ini Card */}
        <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Renungan Hari Ini
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {devotional.dateLabel} · {devotional.readingRef}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNotifications}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors min-h-[38px]"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>
                {reminderSettings.enabled ? `Pengingat ${reminderSettings.time}` : 'Atur Pengingat'}
              </span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {devotional.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
              “{devotional.quote}”
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'sub', view: 'musik-player', param: devotional.hymnId })}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors min-h-[40px]"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Nyanyian: {devotional.hymnRef}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ type: 'sub', view: 'renungan' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] transition-colors min-h-[40px]"
            >
              <span>Baca Lengkap</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Spotlight Cards on Desktop Side / Mobile Stack */}
        <section className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'sub', view: 'hasudungan' })}
            className="group text-left rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-row items-stretch"
          >
            <div className="w-28 sm:w-32 shrink-0 overflow-hidden">
              <ImageWithFallback
                src={ASSETS.storyAdamHawa}
                alt="Hasudungan Ni Roha Cerita Alkitab Bahasa Batak"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#0D47A1] dark:text-blue-400">
                  Cerita Alkitab · Bahasa Batak
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  Hasudungan Ni Roha
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  Baca kisah Si Adam dohot Si Haoa serta cerita Alkitab bergambar.
                </p>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0D47A1] dark:text-blue-400">
                <span>Buka Seri</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ type: 'sub', view: 'game' })}
            className="group text-left rounded-3xl bg-gradient-to-r from-[#0D47A1] to-[#1976D2] text-white p-4 sm:p-5 shadow-xs hover:brightness-105 transition-all flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Belajar Sambil Bermain</span>
              </div>
              <h3 className="text-base font-bold mt-1">Cerdas Cermat Alkitab</h3>
              <p className="text-xs text-blue-100 mt-0.5 line-clamp-1">
                Uji wawasan firman & sejarah HKBP untuk raih XP.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
          </button>
        </section>
      </div>

      {/* MENU UTAMA Grid */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
            MENU UTAMA
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            14 Layanan Jemaat
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 sm:gap-4">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.route)}
                className="group flex flex-col items-center text-center gap-2 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.97] transition-all min-h-[76px]"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${item.bg} ${item.text} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* HKBP Parserahan Church Info Card */}
      <section className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-5 h-44 md:h-auto overflow-hidden">
          <ImageWithFallback
            src={ASSETS.churchParserahanHero}
            alt="Gedung Gereja HKBP Parserahan"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400">
              Ressort Parserahan · Distrik IV Toba
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Jadwal Ibadah HKBP Parserahan
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
              Minggu Pagi (B. Indonesia) 07.30 WIB · Sekolah Minggu 08.00 WIB · Minggu Siang (B. Batak) 10.00 WIB.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'sub', view: 'absensi' })}
              className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] transition-colors min-h-[40px]"
            >
              Isi Absensi Ibadah
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'sub', view: 'cari-gereja' })}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
            >
              Lihat Lokasi Gereja
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
