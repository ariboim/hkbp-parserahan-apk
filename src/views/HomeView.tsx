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
  ClipboardList,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageSquareHeart,
  Music,
  Newspaper,
  Radio,
  ShieldCheck,
  Sparkles,
  Tv,
  Users,
} from 'lucide-react';
import { ASSETS } from '../data/mockData';
import {
  ActiveRoute,
  Devotional,
  LiveStreamConfig,
  ReminderSettings,
  UserProfile,
} from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { ChurchLogo } from '../components/ChurchLogo';

interface HomeViewProps {
  profile: UserProfile;
  devotional: Devotional;
  liveConfig: LiveStreamConfig;
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
  { id: 'daftar-anggota', label: 'Daftar Anggota', icon: ClipboardList, bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', route: { type: 'sub', view: 'daftar-anggota' } },
  { id: 'cari-gereja', label: 'Cari Gereja', icon: MapPin, bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', route: { type: 'sub', view: 'cari-gereja' } },
  { id: 'absensi', label: 'Absensi', icon: CheckCircle2, bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', route: { type: 'sub', view: 'absensi' } },
  { id: 'donasi', label: 'Donasi', icon: HeartHandshake, bg: 'bg-pink-50 dark:bg-pink-950/60', text: 'text-pink-700 dark:text-pink-300', route: { type: 'sub', view: 'donasi' } },
  { id: 'event', label: 'Event', icon: CalendarDays, bg: 'bg-orange-50 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-300', route: { type: 'sub', view: 'event' } },
  { id: 'hkbp-tv', label: 'HKBP TV', icon: Tv, bg: 'bg-red-50 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-300', route: { type: 'sub', view: 'hkbp-tv' } },
  { id: 'live-streaming', label: 'Live Streaming', icon: Radio, bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-300', route: { type: 'sub', view: 'live-streaming' } },
  { id: 'aspirasi', label: 'Aspirasi', icon: MessageSquareHeart, bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', route: { type: 'sub', view: 'aspirasi' } },
  { id: 'hasudungan', label: 'Cerita Alkitab', icon: BookMarked, bg: 'bg-lime-50 dark:bg-lime-950/60', text: 'text-lime-700 dark:text-lime-300', route: { type: 'sub', view: 'hasudungan' } },
  { id: 'game', label: 'Game HKBP', icon: Gamepad2, bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', route: { type: 'sub', view: 'game' } },
  { id: 'admin-aspirasi', label: 'Admin Aspirasi', icon: ShieldCheck, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-[#0D47A1] dark:text-blue-300', route: { type: 'sub', view: 'admin-aspirasi' } },
];

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  devotional,
  liveConfig,
  unreadNotifications,
  reminderSettings,
  onOpenNotifications,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 pb-8">
      {/* Top Hero Header */}
      <header className="rounded-3xl bg-gradient-to-br from-[#081C54] via-[#0F3184] to-[#1565C0] text-white p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/15">
          <p className="text-xs font-medium text-blue-100 truncate">
            Horas, {profile.name.split(' ')[0]} · {profile.role}
          </p>

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
              className={`min-h-[44px] min-w-[44px] w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-xs transition-transform hover:scale-105 ${
                profile.avatarUrl
                  ? 'border-2 border-white/85 bg-white'
                  : 'bg-white text-[#0D47A1] font-display font-extrabold text-sm hover:bg-blue-50'
              }`}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                profile.initials
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 sm:gap-5">
          <ChurchLogo size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-wider text-amber-300">
              HURIA KRISTEN BATAK PROTESTAN
            </p>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-snug mt-0.5 text-balance">
              HKBP Jatisampurna Wijk Parserahan
            </h1>
            <p className="text-xs text-blue-100/90 mt-1 leading-snug">
              Ressort Jatisampurna · Distrik XIX Bekasi
            </p>
          </div>
        </div>

        <div className="mt-4 sm:hidden">
          <PWAInstallButton compact />
        </div>
      </header>

      {/* Real-Time Live Streaming Banner when Live */}
      {liveConfig.isLive && (
        <button
          type="button"
          onClick={() => onNavigate({ type: 'sub', view: 'live-streaming' })}
          className="w-full text-left rounded-3xl bg-gradient-to-r from-rose-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 shadow-md hover:brightness-105 transition-all flex flex-wrap items-center justify-between gap-4"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wide text-rose-100">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span>SEDANG LIVE SEKARANG · JEMAAT LUAR KOTA & LUAR NEGERI</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold leading-snug">
              {liveConfig.title}
            </h2>
            <p className="text-xs text-rose-100 truncate">
              {liveConfig.speaker} · Klik untuk menyaksikan & kirim sapaan live
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-rose-700 text-xs font-extrabold shrink-0 shadow-xs">
            <Radio className="w-4 h-4" />
            <span>Tonton Live</span>
          </span>
        </button>
      )}

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
            17 Layanan Jemaat
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

      {/* HKBP Jatisampurna Wijk Parserahan Church Info Card */}
      <section className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-12">
        <div className="relative md:col-span-5 h-44 md:h-auto overflow-hidden">
          <ImageWithFallback
            src={ASSETS.churchParserahanHero}
            alt="Gedung Gereja HKBP Jatisampurna Wijk Parserahan"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3">
            <ChurchLogo size="sm" />
          </div>
        </div>
        <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400">
              Ressort Jatisampurna · Distrik XIX Bekasi
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Jadwal Ibadah HKBP Jatisampurna Wijk Parserahan
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
