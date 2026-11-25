import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  ExternalLink,
  Heart,
  Info,
  ListMusic,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HYMN_SONGS } from '../data/mockData';
import { HymnSong, SongSection } from '../types';
import { RepeatMode } from '../hooks/useFullSongPlayer';
import { formatMmSs } from '../components/MiniPlayerBar';

interface MusikPlayerViewProps {
  song: HymnSong;
  isPlaying: boolean;
  currentTimeSec: number;
  totalDurationSec: number;
  timeline: (SongSection & { startSec: number; endSec: number })[];
  currentSection?: SongSection;
  activeVerseNumber: number | null;
  activeLineIndex: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  playbackRate: 0.85 | 1 | 1.15;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (sec: number) => void;
  onJumpSection: (sectionId: string) => void;
  onChangeVolume: (val: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onChangeSpeed: (rate: 0.85 | 1 | 1.15) => void;
  onSelectSong: (songId: string) => void;
}

const VISUALIZER_BARS = [
  0.35, 0.58, 0.82, 0.45, 0.9, 0.65, 0.4, 0.78, 0.95, 0.55, 0.72, 0.42,
  0.86, 0.6, 0.38, 0.8, 0.68, 0.48, 0.92, 0.52, 0.74, 0.44, 0.64, 0.36,
];

export const MusikPlayerView: React.FC<MusikPlayerViewProps> = ({
  song,
  isPlaying,
  currentTimeSec,
  totalDurationSec,
  timeline,
  currentSection,
  activeVerseNumber,
  activeLineIndex,
  volume,
  isMuted,
  repeatMode,
  shuffle,
  playbackRate,
  favoriteIds,
  onToggleFavorite,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onJumpSection,
  onChangeVolume,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onChangeSpeed,
  onSelectSong,
}) => {
  const [activeTab, setActiveTab] = useState<'lirik' | 'notasi' | 'antrean'>('lirik');
  const [savedOffline, setSavedOffline] = useState(false);
  const [sharedFeedback, setSharedFeedback] = useState(false);

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

  const progressPct = totalDurationSec > 0 ? Math.min(100, (currentTimeSec / totalDurationSec) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Spotify / YouTube Music Style Full Player Stage */}
      <section className={`rounded-3xl bg-gradient-to-br ${song.coverGradient} text-white p-5 sm:p-7 shadow-lg space-y-6`}>
        {/* Top Track Info & Album Cover */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black/25 backdrop-blur-xs border border-white/20 flex flex-col items-center justify-center shrink-0 relative overflow-hidden p-3">
            <Music className="w-9 h-9 text-amber-300" />
            <span className="mt-1.5 text-[10px] font-mono-nums font-bold tracking-wider text-white/90">
              {song.code}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold text-white/80">
              {song.book} · {song.arrangementStyle}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
              {song.code} — {song.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/85">{song.subtitle}</p>
            <p className="text-[11px] text-amber-200 font-medium pt-0.5">
              {isPlaying
                ? `Sedang Diputar · ${currentSection?.label || 'Musik Utuh'}`
                : `Musik Utuh 1 Lagu · ${formatMmSs(totalDurationSec)} (${song.verses.length} Ayat + Intro/Interlude)`}
            </p>
          </div>
        </div>

        {/* Live Audio Spectrum Visualizer */}
        <div className="flex items-end gap-1 h-8 px-1" aria-hidden="true">
          {VISUALIZER_BARS.map((heightRatio, idx) => {
            const dynamicScale = isPlaying
              ? 0.35 + 0.65 * Math.abs(Math.sin(currentTimeSec * 4 + idx * 0.7))
              : 0.22;
            const barH = Math.round(heightRatio * dynamicScale * 100);
            return (
              <div
                key={idx}
                className="flex-1 rounded-full bg-white/80 transition-all duration-150"
                style={{ height: `${Math.max(15, barH)}%`, opacity: isPlaying ? 0.9 : 0.35 }}
              />
            );
          })}
        </div>

        {/* Seekable Scrubber Bar + Section Chips */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <input
                type="range"
                aria-label="Posisi lagu"
                min={0}
                max={Math.max(1, Math.floor(totalDurationSec))}
                value={Math.floor(currentTimeSec)}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/25 accent-amber-400"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono-nums text-white/85">
              <span>{formatMmSs(currentTimeSec)}</span>
              <span>{Math.round(progressPct)}% · {song.keySignature}</span>
              <span>{formatMmSs(totalDurationSec)}</span>
            </div>
          </div>

          {/* Clickable Song Sections (Intro / Ayat 1 / Interlude / Ayat 2 / Outro) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {timeline.map((sec) => {
              const isCurrent = currentSection?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onJumpSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors min-h-[34px] ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-black/25 text-white/85 hover:bg-black/40'
                  }`}
                >
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spotify-Style Transport Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onToggleShuffle}
              aria-label="Acak daftar lagu"
              className={`min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center transition-colors ${
                shuffle ? 'bg-amber-400 text-slate-950' : 'text-white/80 hover:bg-white/15'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              aria-label="Lagu sebelumnya"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu penuh'}
              className="w-14 h-14 rounded-full bg-white text-[#0D47A1] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Lagu berikutnya"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={onCycleRepeat}
              aria-label={`Mode ulang: ${repeatMode}`}
              className={`min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center transition-colors ${
                repeatMode !== 'off' ? 'bg-amber-400 text-slate-950' : 'text-white/80 hover:bg-white/15'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Volume + Speed Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Bunyikan suara' : 'Bisukan suara'}
                className="min-h-[38px] min-w-[38px] rounded-lg hover:bg-white/15 flex items-center justify-center"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                aria-label="Volume suara"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 rounded-full appearance-none cursor-pointer bg-white/30 accent-white"
              />
            </div>

            <div className="inline-flex items-center rounded-xl bg-black/25 p-0.5">
              {([0.85, 1, 1.15] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onChangeSpeed(rate)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono-nums font-bold min-h-[30px] ${
                    playbackRate === rate ? 'bg-white text-slate-950' : 'text-white/80'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Row: Favorit / Simpan / Bagikan / YouTube */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(song.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold min-h-[40px] transition-colors ${
              isFav ? 'bg-rose-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            <span>{isFav ? 'Disukai' : 'Favoritkan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSavedOffline((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold min-h-[40px] transition-colors ${
              savedOffline ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {savedOffline ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{savedOffline ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 text-xs font-semibold min-h-[40px] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{sharedFeedback ? 'Disalin' : 'Bagikan'}</span>
          </button>

          <a
            href={song.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/30 text-white hover:bg-black/45 text-xs font-semibold min-h-[40px] transition-colors ml-auto"
          >
            <span>Versi Video YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* Tabs: Lirik Sinkron / Notasi & Akor / Antrean & Info */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {([
            { id: 'lirik', label: 'Lirik Sinkron' },
            { id: 'notasi', label: 'Notasi & Akor' },
            { id: 'antrean', label: 'Antrean & Info' },
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
            {song.verses.map((verse) => {
              const isVerseActive = activeVerseNumber === verse.number;
              const targetSection = timeline.find(
                (sec) => sec.type === 'verse' && sec.verseNumber === verse.number
              );
              return (
                <div
                  key={verse.number}
                  className={`p-4 rounded-2xl border transition-all ${
                    isVerseActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="text-xs font-extrabold tracking-wider text-[#0D47A1] dark:text-blue-400">
                      AYAT {verse.number} {isVerseActive && isPlaying ? '· Sedang Dinyanyikan' : ''}
                    </p>
                    {targetSection && (
                      <button
                        type="button"
                        onClick={() => onJumpSection(targetSection.id)}
                        className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400 hover:underline"
                      >
                        Putar dari Ayat {verse.number}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {verse.lines.map((line, i) => {
                      const isLineActive = isVerseActive && activeLineIndex === i;
                      return (
                        <p
                          key={i}
                          className={`text-base sm:text-lg leading-relaxed transition-colors ${
                            isLineActive
                              ? 'font-extrabold text-[#0D47A1] dark:text-amber-300'
                              : isVerseActive
                              ? 'font-semibold text-slate-900 dark:text-white'
                              : 'font-medium text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'notasi' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Notasi Angka (Solmisasi) · {song.keySignature} · Birama {song.timeSignature}
              </p>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 font-mono text-sm sm:text-base text-slate-800 dark:text-slate-200 space-y-2 overflow-x-auto">
                {song.notation.map((bar, idx) => (
                  <p key={idx} className="whitespace-nowrap">
                    {bar}
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Progresi Akor Iringan Musik Penuh
              </p>
              <div className="flex flex-wrap gap-2">
                {song.chords.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-xs font-mono-nums font-bold text-[#0D47A1] dark:text-blue-300"
                  >
                    Bar {idx + 1}: {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'antrean' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#0D47A1] dark:text-blue-400 font-bold text-sm">
                <ListMusic className="w-4 h-4" />
                <span>Antrean Putar (Seperti Spotify / YouTube)</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {HYMN_SONGS.map((track) => {
                  const isCurrent = track.id === song.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => onSelectSong(track.id)}
                      className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        isCurrent
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isCurrent ? 'text-[#0D47A1] dark:text-blue-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {track.code} · {track.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {track.arrangementStyle}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400 shrink-0">
                        {isCurrent && isPlaying ? 'Diputar' : 'Putar'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-[#0D47A1] dark:text-blue-400 font-bold">
                <Info className="w-4 h-4" />
                <span>Informasi Lagu & Aransemen</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Koleksi & Gaya</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {song.book} · {song.arrangementStyle}
                  </dd>
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
          </div>
        )}
      </section>
    </div>
  );
};
