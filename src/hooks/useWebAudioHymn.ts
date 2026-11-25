import { useCallback, useEffect, useRef, useState } from 'react';

export function useWebAudioHymn(melodyFreqs: number[], tempoBpm: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [noteIndex, setNoteIndex] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playNote = useCallback((freq: number, durationSec: number) => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.18, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.08, now + durationSec * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc1.connect(gain);
    osc2.connect(subGain);
    subGain.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }

    if (melodyFreqs.length === 0) return;
    setIsPlaying(true);
    const beatMs = Math.round((60 / Math.max(tempoBpm, 60)) * 1000);
    let current = noteIndex >= melodyFreqs.length ? 0 : noteIndex;

    playNote(melodyFreqs[current], (beatMs / 1000) * 0.92);
    setNoteIndex(current);

    timerRef.current = window.setInterval(() => {
      current = (current + 1) % melodyFreqs.length;
      setNoteIndex(current);
      playNote(melodyFreqs[current], (beatMs / 1000) * 0.92);
    }, beatMs);
  }, [isPlaying, melodyFreqs, noteIndex, playNote, stop, tempoBpm]);

  const seekTo = useCallback((idx: number) => {
    setNoteIndex(Math.max(0, Math.min(idx, Math.max(0, melodyFreqs.length - 1))));
  }, [melodyFreqs.length]);

  useEffect(() => {
    stop();
    setNoteIndex(0);
  }, [melodyFreqs, stop]);

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stop]);

  const progress = melodyFreqs.length > 0 ? ((noteIndex + 1) / melodyFreqs.length) * 100 : 0;

  return {
    isPlaying,
    noteIndex,
    progress,
    togglePlay,
    stop,
    seekTo,
  };
}
