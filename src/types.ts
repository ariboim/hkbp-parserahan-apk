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
  | 'aspirasi';

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
  role: 'Jemaat' | 'Pengurus / Admin';
  email: string;
  memberId: string;
  weyk: string;
  status: 'Aktif';
  verified: boolean;
  initials: string;
}
