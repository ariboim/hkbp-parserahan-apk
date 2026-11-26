export type MainTab = 'beranda' | 'alkitab' | 'timeline' | 'musik' | 'profil';

export type SubView =
  | 'renungan'
  | 'hasudungan'
  | 'musik-player'
  | 'hkbp-tv'
  | 'cari-gereja'
  | 'game'
  | 'almanak'
  | 'pengajaran'
  | 'media'
  | 'organisasi'
  | 'absensi'
  | 'donasi'
  | 'event'
  | 'aspirasi'
  | 'admin-aspirasi'
  | 'live-streaming'
  | 'daftar-anggota'
  | 'warta-keuangan';

export type ActiveRoute =
  | { type: 'tab'; tab: MainTab }
  | { type: 'sub'; view: SubView; param?: string };

export type CardTheme = 'default' | 'dark' | 'girly';

export interface Devotional {
  id: string;
  dateLabel: string;
  isoDate: string;
  readingRef: string;
  batakRef: string;
  quote: string;
  batakQuote: string;
  hymnRef: string;
  hymnId: string;
  title: string;
  reflection: string[];
  prayer: string;
}

export interface BibleStory {
  id: string;
  passage: string;
  title: string;
  batakExcerpt: string;
  imageUrl: string;
  fallbackGradient: string;
  paragraphsBatak: string[];
  paragraphsIndo: string[];
  moralLesson: string;
}

export interface HymnVerse {
  number: number;
  lines: string[];
}

export interface SongChordBar {
  name: string;
  bassHz: number;
  chordHz: number[];
}

export interface SongSection {
  id: string;
  label: string;
  type: 'intro' | 'verse' | 'interlude' | 'outro';
  verseNumber?: number;
  durationSec: number;
}

export interface HymnSong {
  id: string;
  book: 'Buku Ende' | 'Buku Nyanyian' | 'Kidung Jemaat' | 'Ende Sekolah Minggu';
  code: string;
  title: string;
  subtitle: string;
  arrangementStyle: string;
  coverGradient: string;
  keySignature: string;
  tempoBpm: number;
  timeSignature: string;
  composer: string;
  playCount: number;
  lastPlayed?: string;
  youtubeUrl: string;
  verses: HymnVerse[];
  notation: string[];
  chords: SongChordBar[];
  melodyNotes: { freq: number; beats: number }[];
}

export interface TvVideo {
  id: string;
  number: string;
  category: 'HKBP TV' | 'Karaoke' | 'Instrumentalia';
  subCategory: string;
  title: string;
  speakerOrArtist: string;
  date: string;
  duration: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  description: string;
}

export interface ChurchLocation {
  id: string;
  number: number;
  name: string;
  ressort: string;
  distrik: string;
  address: string;
  pastor: string;
  distanceKm: number;
  schedules: string[];
  phone: string;
  mapX: number; // percentage 0..100
  mapY: number; // percentage 0..100
  lat: number;
  lng: number;
  isHomeChurch?: boolean;
}

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export interface TimelinePost {
  id: string;
  author: string;
  role: string;
  avatarInitials: string;
  avatarUrl?: string;
  timestamp: string;
  category: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedByMe: boolean;
  comments: { id: string; author: string; text: string; time: string }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'renungan' | 'warta' | 'event';
  read: boolean;
  targetRoute?: ActiveRoute;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "06:00"
  browserPermission: NotificationPermission | 'unsupported';
  lastSentDate: string | null;
}

export interface UserProfile {
  name: string;
  role: 'Jemaat' | 'Admin Utama (Ketua)';
  email: string;
  memberId: string;
  weyk: string;
  status: 'Aktif';
  verified: boolean;
  initials: string;
  avatarUrl?: string;
}

export type AspirationStatus = 'Baru' | 'Dibaca' | 'Ditindaklanjuti' | 'Selesai';

export interface AspirationRecord {
  id: string;
  senderName: string;
  weyk: string;
  subject: string;
  message: string;
  status: AspirationStatus;
  adminNote?: string;
  authorUid?: string;
  createdAtMs: number;
  updatedAtMs?: number;
}

export interface LiveStreamConfig {
  title: string;
  speaker: string;
  scheduleIso: string;
  streamUrl: string;
  description: string;
  isLive: boolean;
  updatedAtMs?: number;
}

export interface LiveMessageRecord {
  id: string;
  streamId: string;
  senderName: string;
  location: string;
  message: string;
  isAdmin: boolean;
  createdAtMs: number;
}

export interface WijkMemberInput {
  rhjNumber: string;
  memberName: string;
  spouseName: string;
  childrenNames: string;
  address: string;
  whatsappNumber: string;
}

export interface WijkMemberRecord extends WijkMemberInput {
  id: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export type WartaKeuanganCategory =
  | 'Persembahan & Kolekte'
  | 'Ucapan Syukur / Hamauliateon'
  | 'Toktok Ripe / Iuran Wijk'
  | 'Diakonia & Sosial'
  | 'Operasional & Pelayanan'
  | 'Setoran Huria / Pusat';

export interface WartaKeuanganEntry {
  id: string;
  date: string;
  category: WartaKeuanganCategory;
  description: string;
  type: 'masuk' | 'keluar';
  amount: number;
  notes?: string;
}

export interface WartaKeuanganReport {
  id: string;
  isSample: boolean;
  sampleLabel: string;
  periodLabel: string;
  dateRange: string;
  openingBalance: number;
  chairName: string;
  treasurerName: string;
  entries: WartaKeuanganEntry[];
}

