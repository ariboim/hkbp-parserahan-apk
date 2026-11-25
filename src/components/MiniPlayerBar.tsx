import React from 'react';
import { Music, Pause, Play, SkipForward } from 'lucide-react';
import { HymnSong, SongSection } from '../types';

interface MiniPlayerBarProps {
  song: HymnSong;
  isPlaying: boolean;
  currentTimeSec: number;
  totalDurationSec: number;
  currentSection?: SongSection;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenPlayer: () => void;
}

export function formatMmSs(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const MiniPlayerBar: React.FC<MiniPlayerBarProps> = ({
  song,
  isPlaying,
  currentTimeSec,
  totalDurationSec,
  currentSection,
  onTogglePlay,
  onNext,
  onOpenPlayer,
}) => {
  const progressPct = totalDurationSec > 0 ? Math.min(100, (currentTimeSec / totalDurationSec) * 100) : 0;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-2 right-2 lg:left-auto lg:right-6 lg:w-[400px] z-35 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 overflow-hidden">
      {/* Top thin progress bar */}
      <div className="h-1 bg-slate-800 w-full">
        <div
          className="h-full bg-amber-400 transition-all duration-150"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenPlayer}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
        >
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${song.coverGradient} flex items-center justify-center shrink-0`}
          >
            <Music className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {song.code} · {song.title}
            </p>
            <p className="text-[11px] text-slate-300 font-mono-nums truncate">
              {currentSection ? currentSection.label : 'Musik Utuh'} · {formatMmSs(currentTimeSec)} / {formatMmSs(totalDurationSec)}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white text-slate-950 flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Lagu berikutnya"
            className="min-h-[40px] min-w-[40px] rounded-xl text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
