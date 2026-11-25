import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Heart, Music, Play, Search } from 'lucide-react';
import { HYMN_SONGS } from '../data/mockData';
import { ActiveRoute, HymnSong } from '../types';

interface MusikViewProps {
  favoriteIds: string[];
  recentIds: string[];
  onToggleFavorite: (id: string) => void;
  onNavigate: (route: ActiveRoute) => void;
}

const BOOK_COLLECTIONS: {
  book: HymnSong['book'];
  countLabel: string;
  gradient: string;
  desc: string;
}[] = [
  {
    book: 'Buku Ende',
    countLabel: '864 Lagu',
    gradient: 'from-[#0D47A1] to-[#1976D2]',
    desc: 'Nyanyian Jemaat Bahasa Batak',
  },
  {
    book: 'Buku Nyanyian',
    countLabel: '560 Lagu',
    gradient: 'from-emerald-600 to-teal-700',
    desc: 'Terjemahan Bahasa Indonesia',
  },
  {
    book: 'Kidung Jemaat',
    countLabel: '478 Lagu',
    gradient: 'from-amber-600 to-orange-700',
    desc: 'Kidung Jemaat Klasik & Oikumene',
  },
  {
    book: 'Ende Sekolah Minggu',
    countLabel: '215 Lagu',
    gradient: 'from-rose-500 to-pink-600',
    desc: 'Lagu Pujian Anak HKBP',
  },
];

export const MusikView: React.FC<MusikViewProps> = ({
  favoriteIds,
  recentIds,
  onToggleFavorite,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [activeBook, setActiveBook] = useState<string>('Semua');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filteredSongs = useMemo(() => {
    return HYMN_SONGS.filter((song) => {
      if (onlyFavorites && !favoriteIds.includes(song.id)) return false;
      if (activeBook !== 'Semua' && song.book !== activeBook) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          song.title.toLowerCase().includes(q) ||
          song.code.toLowerCase().includes(q) ||
          song.subtitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeBook, favoriteIds, onlyFavorites, query]);

  const mostPlayed = useMemo(
    () => [...HYMN_SONGS].sort((a, b) => b.playCount - a.playCount).slice(0, 3),
    []
  );

  const lastPlayedSongs = useMemo(() => {
    const mapped = recentIds
      .map((id) => HYMN_SONGS.find((s) => s.id === id))
      .filter((s): s is HymnSong => Boolean(s));
    if (mapped.length > 0) return mapped.slice(0, 3);
    return HYMN_SONGS.filter((s) => ['be-167', 'be-28', 'bn-1'].includes(s.id));
  }, [recentIds]);

  const openSong = (songId: string) => {
    onNavigate({ type: 'sub', view: 'musik-player', param: songId });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-extrabold">Musik HKBP</h1>
        <p className="text-xs sm:text-sm text-blue-100 mt-1">
          Semua nyanyian gereja dalam satu tempat — lengkap dengan lirik, notasi angka, dan audio melodi.
        </p>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor atau judul lagu (mis. BE 167, Hata Ni Jahowa)..."
            className="w-full rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </section>

      {/* KOLEKSI BUKU */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
            KOLEKSI BUKU
          </h2>
          {activeBook !== 'Semua' && (
            <button
              type="button"
              onClick={() => setActiveBook('Semua')}
              className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400 hover:underline"
            >
              Tampilkan Semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {BOOK_COLLECTIONS.map((col) => {
            const firstMatch = HYMN_SONGS.find((s) => s.book === col.book);
            const isSelected = activeBook === col.book;
            return (
              <div
                key={col.book}
                className={`rounded-3xl bg-gradient-to-br ${col.gradient} text-white p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4 transition-transform ${
                  isSelected ? 'ring-3 ring-amber-400 scale-[1.01]' : ''
                }`}
              >
                <div>
                  <BookOpen className="w-5 h-5 opacity-85 mb-2" />
                  <h3 className="text-sm sm:text-base font-extrabold leading-snug">
                    {col.book}
                  </h3>
                  <p className="text-[11px] text-white/85 mt-0.5">{col.desc}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/20">
                  <button
                    type="button"
                    onClick={() => setActiveBook(isSelected ? 'Semua' : col.book)}
                    className="text-xs font-bold hover:underline min-h-[36px] text-left"
                  >
                    {col.countLabel}
                  </button>
                  <button
                    type="button"
                    aria-label={`Putar lagu dari ${col.book}`}
                    onClick={() => {
                      if (firstMatch) openSong(firstMatch.id);
                    }}
                    className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Paling Sering Didengar & Putar Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Paling Sering Didengar
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mostPlayed.map((song, idx) => (
              <div key={song.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openSong(song.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 font-mono-nums text-xs font-bold flex items-center justify-center shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {song.code} {song.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {song.book} · {song.playCount.toLocaleString('id-ID')}x diputar
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openSong(song.id)}
                  aria-label={`Putar ${song.title}`}
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-[#0D47A1] hover:text-white transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Putar Terakhir
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lastPlayedSongs.map((song) => (
              <div key={song.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openSong(song.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {song.code === 'BN 1' ? '1 HAI BANGKITLAH JIWAKU' : `${song.code} ${song.title}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {song.book} · {song.lastPlayed || 'Baru diputar'}
                    </p>
                  </div>
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Daftar Lagu & Filter Favorit */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Nyanyian {activeBook !== 'Semua' ? `· ${activeBook}` : ''}
          </h2>
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setOnlyFavorites(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[34px] ${
                !onlyFavorites
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua ({HYMN_SONGS.length})
            </button>
            <button
              type="button"
              onClick={() => setOnlyFavorites(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[34px] ${
                onlyFavorites
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Favorit ({favoriteIds.length})
            </button>
          </div>
        </div>

        {filteredSongs.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Tidak ada lagu yang sesuai dengan filter atau pencarian Anda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSongs.map((song) => {
              const isFav = favoriteIds.includes(song.id);
              return (
                <div key={song.id} className="py-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openSong(song.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {song.code} · {song.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {song.book} · {song.keySignature} · {song.verses.length} Ayat
                    </p>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(song.id)}
                      aria-label={isFav ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                      className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-colors ${
                        isFav
                          ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openSong(song.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] min-h-[40px]"
                    >
                      Buka
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
