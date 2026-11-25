import React, { useEffect, useState } from 'react';
import { Bookmark, Check, Heart, Info, Music, Pause, Play, Share2 } from 'lucide-react';
import { HYMN_SONGS } from '../data/mockData';
import { useWebAudioHymn } from '../hooks/useWebAudioHymn';

interface MusikPlayerViewProps {
  songId: string;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onRecordPlay: (id: string) => void;
}

export const MusikPlayerView: React.FC<MusikPlayerViewProps> = ({
  songId,
  favoriteIds,
  onToggleFavorite,
  onRecordPlay,
}) => {
  const song = HYMN_SONGS.find((s) => s.id === songId) || HYMN_SONGS[0];
  const [activeTab, setActiveTab] = useState<'lirik' | 'notasi' | 'info'>('lirik');
  const [savedOffline, setSavedOffline] = useState(false);
  const [sharedFeedback, setSharedFeedback] = useState(false);

  const { isPlaying, progress, togglePlay, noteIndex } = useWebAudioHymn(
    song.melodyFreqs,
    song.tempoBpm
  );

  useEffect(() => {
    onRecordPlay(song.id);
  }, [song.id, onRecordPlay]);

  const isFav = favoriteIds.includes(song.id);

  const handleShare = () => {
    const shareText = `${song.code} ${song.title} (${song.book}) — HKBP Parserahan`;
    if (navigator.share) {
      navigator.share({ title: song.title, text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setSharedFeedback(true);
    window.setTimeout(() => setSharedFeedback(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Player Hero Card */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#0A2E6E] text-white p-5 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Music className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-100">
                {song.book} · {song.keySignature} · {song.timeSignature}
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                {song.code} — {song.title}
              </h1>
              <p className="text-xs text-blue-100/90 mt-1">{song.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Audio Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-200"
              style={{ width: `${isPlaying ? progress : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono-nums text-blue-100">
            <span>
              {isPlaying ? `Nada ${noteIndex + 1} / ${song.melodyFreqs.length}` : 'Siap diputar (Melodi Organ)'}
            </span>
            <span>{song.tempoBpm} BPM</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0D47A1] text-sm font-bold hover:bg-blue-50 active:scale-[0.98] transition-all min-h-[44px]"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Jeda Lagu' : 'Putar Lagu Ini'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(song.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              isFav
                ? 'bg-rose-500 text-white'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            <span>{isFav ? 'Favorit' : 'Favoritkan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSavedOffline((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              savedOffline ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {savedOffline ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{savedOffline ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 text-white hover:bg-white/25 text-xs font-semibold min-h-[44px] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{sharedFeedback ? 'Disalin' : 'Bagikan'}</span>
          </button>
        </div>
      </section>

      {/* Tabs: Lirik / Notasi / Info */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {([
            { id: 'lirik', label: 'Lirik' },
            { id: 'notasi', label: 'Notasi' },
            { id: 'info', label: 'Info' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors min-h-[38px] ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-[#0D47A1] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'lirik' && (
          <div className="space-y-6">
            {song.verses.map((verse) => (
              <div
                key={verse.number}
                className="pb-5 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
              >
                <p className="text-xs font-extrabold tracking-wider text-[#0D47A1] dark:text-blue-400 mb-2">
                  AYAT {verse.number}
                </p>
                <div className="space-y-1.5 text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                  {verse.lines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notasi' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Partitur Notasi Angka (Solmisasi) · {song.keySignature} · Birama {song.timeSignature}
            </p>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 font-mono text-sm sm:text-base text-slate-800 dark:text-slate-200 space-y-2 overflow-x-auto">
              {song.notation.map((bar, idx) => (
                <p key={idx} className="whitespace-nowrap">
                  {bar}
                </p>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 text-[#0D47A1] dark:text-blue-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Informasi Nyanyian</span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <dt className="text-xs text-slate-500 dark:text-slate-400">Koleksi</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{song.book}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <dt className="text-xs text-slate-500 dark:text-slate-400">Nada Dasar & Tempo</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {song.keySignature} · {song.tempoBpm} BPM ({song.timeSignature})
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 sm:col-span-2">
                <dt className="text-xs text-slate-500 dark:text-slate-400">Komposer / Sumber</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{song.composer}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
};
