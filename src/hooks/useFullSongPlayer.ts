import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HYMN_SONGS } from '../data/mockData';
import { HymnSong, SongSection } from '../types';

export type RepeatMode = 'off' | 'all' | 'one';

interface TimelineSection extends SongSection {
  startSec: number;
  endSec: number;
}

function buildSongTimeline(song: HymnSong, playbackRate: number): TimelineSection[] {
  const beatSec = 60 / (song.tempoBpm * playbackRate);
  const totalMelodyBeats = song.melodyNotes.reduce((sum, n) => sum + n.beats, 0);
  const verseDurationSec = Math.max(24, totalMelodyBeats * beatSec);
  const introDurationSec = Math.max(8, beatSec * 12);
  const interludeDurationSec = Math.max(6, beatSec * 8);
  const outroDurationSec = Math.max(8, beatSec * 12);

  const sections: TimelineSection[] = [];
  let cursor = 0;

  const pushSection = (
    id: string,
    label: string,
    type: SongSection['type'],
    durationSec: number,
    verseNumber?: number
  ) => {
    sections.push({
      id,
      label,
      type,
      verseNumber,
      durationSec,
      startSec: cursor,
      endSec: cursor + durationSec,
    });
    cursor += durationSec;
  };

  pushSection('intro', 'Intro Musik', 'intro', introDurationSec);

  song.verses.forEach((v, idx) => {
    pushSection(`verse-${v.number}`, `Ayat ${v.number}`, 'verse', verseDurationSec, v.number);
    if (idx < song.verses.length - 1) {
      pushSection(`interlude-${idx + 1}`, 'Interlude', 'interlude', interludeDurationSec);
    }
  });

  pushSection('outro', 'Outro · Amin', 'outro', outroDurationSec);
  return sections;
}

function createReverbImpulse(ctx: AudioContext, durationSec = 1.9, decay = 2.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export function useFullSongPlayer(initialSongId = 'be-167', onTrackStarted?: (songId: string) => void) {
  const [currentSongId, setCurrentSongId] = useState(initialSongId);
  const [hasLoadedTrack, setHasLoadedTrack] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [shuffle, setShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<0.85 | 1 | 1.15>(1);

  const currentSong = useMemo(
    () => HYMN_SONGS.find((s) => s.id === currentSongId) || HYMN_SONGS[0],
    [currentSongId]
  );

  const timeline = useMemo(
    () => buildSongTimeline(currentSong, playbackRate),
    [currentSong, playbackRate]
  );

  const totalDurationSec = useMemo(
    () => (timeline.length > 0 ? timeline[timeline.length - 1].endSec : 120),
    [timeline]
  );

  const currentSection = useMemo(() => {
    return (
      timeline.find((sec) => currentTimeSec >= sec.startSec && currentTimeSec < sec.endSec) ||
      timeline[timeline.length - 1]
    );
  }, [currentTimeSec, timeline]);

  // Calculate active verse & lyric line synced with currentTimeSec
  const { activeVerseNumber, activeLineIndex } = useMemo(() => {
    if (!currentSection || currentSection.type !== 'verse' || !currentSection.verseNumber) {
      return { activeVerseNumber: null, activeLineIndex: -1 };
    }
    const verseObj = currentSong.verses.find((v) => v.number === currentSection.verseNumber);
    if (!verseObj || verseObj.lines.length === 0) {
      return { activeVerseNumber: currentSection.verseNumber, activeLineIndex: 0 };
    }
    const progressInVerse = Math.min(
      0.999,
      Math.max(0, (currentTimeSec - currentSection.startSec) / currentSection.durationSec)
    );
    const lineIdx = Math.floor(progressInVerse * verseObj.lines.length);
    return { activeVerseNumber: currentSection.verseNumber, activeLineIndex: lineIdx };
  }, [currentSection, currentSong.verses, currentTimeSec]);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const dryBusRef = useRef<GainNode | null>(null);
  const wetBusRef = useRef<GainNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  const currentTimeRef = useRef(currentTimeSec);
  currentTimeRef.current = currentTimeSec;

  const lastScheduledStepRef = useRef<number>(-1);
  const lastMelodyStepRef = useRef<number>(-1);

  const ensureAudioGraph = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioCtxRef.current) {
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = isMuted ? 0 : volume;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;

      const dry = ctx.createGain();
      dry.gain.value = 0.85;

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx, 1.8, 2.7);

      const wet = ctx.createGain();
      wet.gain.value = 0.28;

      dry.connect(compressor);
      wet.connect(convolver);
      convolver.connect(compressor);
      compressor.connect(master);
      master.connect(ctx.destination);

      // White noise buffer for soft worship percussion
      const nb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = nb.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      audioCtxRef.current = ctx;
      masterGainRef.current = master;
      dryBusRef.current = dry;
      wetBusRef.current = wet;
      noiseBufferRef.current = nb;
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, [isMuted, volume]);

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        isMuted ? 0 : volume,
        audioCtxRef.current.currentTime,
        0.04
      );
    }
  }, [volume, isMuted]);

  const triggerWarmPadChord = useCallback((freqs: number[], durationSec: number, gainLevel: number) => {
    const ctx = audioCtxRef.current;
    const dry = dryBusRef.current;
    const wet = wetBusRef.current;
    if (!ctx || !dry || !wet) return;
    const now = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1450, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gainLevel, now + Math.min(0.35, durationSec * 0.25));
    env.gain.setValueAtTime(gainLevel * 0.85, now + durationSec * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec + 0.15);

    filter.connect(env);
    env.connect(dry);
    env.connect(wet);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + durationSec + 0.2);
    });
  }, []);

  const triggerPianoPluck = useCallback((freq: number, durationSec: number, gainLevel: number) => {
    const ctx = audioCtxRef.current;
    const dry = dryBusRef.current;
    const wet = wetBusRef.current;
    if (!ctx || !dry || !wet) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.22, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gainLevel, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(env);
    osc2.connect(overtoneGain);
    overtoneGain.connect(env);
    env.connect(dry);
    env.connect(wet);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
  }, []);

  const triggerBassNote = useCallback((freq: number, durationSec: number) => {
    const ctx = audioCtxRef.current;
    const dry = dryBusRef.current;
    if (!ctx || !dry) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq / 2, now);

    const oscWarm = ctx.createOscillator();
    oscWarm.type = 'triangle';
    oscWarm.frequency.setValueAtTime(freq / 2, now);

    const warmGain = ctx.createGain();
    warmGain.gain.value = 0.25;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.22, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(env);
    oscWarm.connect(warmGain);
    warmGain.connect(env);
    env.connect(dry);

    osc.start(now);
    oscWarm.start(now);
    osc.stop(now + durationSec + 0.05);
    oscWarm.stop(now + durationSec + 0.05);
  }, []);

  const triggerLeadVoice = useCallback((freq: number, durationSec: number, gainLevel: number) => {
    const ctx = audioCtxRef.current;
    const dry = dryBusRef.current;
    const wet = wetBusRef.current;
    if (!ctx || !dry || !wet) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, now);

    // Subtle human choir vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(4.8, now);
    lfoGain.gain.setValueAtTime(2.5, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const mix2 = ctx.createGain();
    mix2.gain.value = 0.35;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gainLevel, now + 0.06);
    env.gain.setValueAtTime(gainLevel * 0.85, now + Math.max(0.07, durationSec * 0.72));
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(filter);
    osc2.connect(mix2);
    mix2.connect(filter);
    filter.connect(env);
    env.connect(dry);
    env.connect(wet);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    lfo.stop(now + durationSec + 0.05);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
  }, []);

  const triggerSoftDrums = useCallback((beatInBar: number) => {
    const ctx = audioCtxRef.current;
    const dry = dryBusRef.current;
    const wet = wetBusRef.current;
    const nb = noiseBufferRef.current;
    if (!ctx || !dry || !wet || !nb) return;
    const now = ctx.currentTime;

    // Kick on beat 0 and 2
    if (beatInBar === 0 || beatInBar === 2) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(105, now);
      kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      kickGain.gain.setValueAtTime(0.18, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      kickOsc.connect(kickGain);
      kickGain.connect(dry);
      kickOsc.start(now);
      kickOsc.stop(now + 0.2);
    }

    // Soft shaker / brush hi-hat every beat
    const noise = ctx.createBufferSource();
    noise.buffer = nb;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = beatInBar === 1 || beatInBar === 3 ? 2800 : 5500;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(beatInBar === 1 || beatInBar === 3 ? 0.035 : 0.018, now);
    nGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.09);
    noise.connect(hp);
    hp.connect(nGain);
    nGain.connect(dry);
    nGain.connect(wet);
    noise.start(now);
    noise.stop(now + 0.1);
  }, []);

  const nextTrack = useCallback(() => {
    const idx = HYMN_SONGS.findIndex((s) => s.id === currentSongId);
    let nextIdx = (idx + 1) % HYMN_SONGS.length;
    if (shuffle && HYMN_SONGS.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * HYMN_SONGS.length);
      } while (nextIdx === idx);
    }
    const nextSong = HYMN_SONGS[nextIdx];
    setCurrentSongId(nextSong.id);
    setCurrentTimeSec(0);
    lastScheduledStepRef.current = -1;
    lastMelodyStepRef.current = -1;
    setHasLoadedTrack(true);
    setIsPlaying(true);
    onTrackStarted?.(nextSong.id);
  }, [currentSongId, onTrackStarted, shuffle]);

  const prevTrack = useCallback(() => {
    if (currentTimeRef.current > 4) {
      setCurrentTimeSec(0);
      lastScheduledStepRef.current = -1;
      lastMelodyStepRef.current = -1;
      return;
    }
    const idx = HYMN_SONGS.findIndex((s) => s.id === currentSongId);
    const prevIdx = (idx - 1 + HYMN_SONGS.length) % HYMN_SONGS.length;
    const prevSong = HYMN_SONGS[prevIdx];
    setCurrentSongId(prevSong.id);
    setCurrentTimeSec(0);
    lastScheduledStepRef.current = -1;
    lastMelodyStepRef.current = -1;
    setHasLoadedTrack(true);
    setIsPlaying(true);
    onTrackStarted?.(prevSong.id);
  }, [currentSongId, onTrackStarted]);

  // Main song playback loop & multi-track scheduler
  useEffect(() => {
    if (!isPlaying) return;
    ensureAudioGraph();

    const beatSec = 60 / (currentSong.tempoBpm * playbackRate);
    const beatsPerBar = currentSong.timeSignature.startsWith('3/') ? 3 : 4;
    let lastTickMs = performance.now();

    const interval = window.setInterval(() => {
      const nowMs = performance.now();
      const deltaSec = (nowMs - lastTickMs) / 1000;
      lastTickMs = nowMs;

      const nextTime = currentTimeRef.current + deltaSec;

      if (nextTime >= totalDurationSec) {
        if (repeatMode === 'one') {
          setCurrentTimeSec(0);
          lastScheduledStepRef.current = -1;
          lastMelodyStepRef.current = -1;
          return;
        }
        if (repeatMode === 'all') {
          nextTrack();
          return;
        }
        setCurrentTimeSec(0);
        setIsPlaying(false);
        lastScheduledStepRef.current = -1;
        lastMelodyStepRef.current = -1;
        return;
      }

      setCurrentTimeSec(nextTime);

      const section =
        timeline.find((sec) => nextTime >= sec.startSec && nextTime < sec.endSec) ||
        timeline[timeline.length - 1];

      const globalBeat = Math.floor(nextTime / beatSec);
      if (globalBeat !== lastScheduledStepRef.current) {
        lastScheduledStepRef.current = globalBeat;
        const barIndex = Math.floor(globalBeat / beatsPerBar) % currentSong.chords.length;
        const beatInBar = globalBeat % beatsPerBar;
        const chord = currentSong.chords[barIndex];

        // 1. Organ/Pad sustain at start of each bar
        if (beatInBar === 0) {
          triggerWarmPadChord(
            chord.chordHz,
            beatSec * beatsPerBar * 0.95,
            section.type === 'outro' ? 0.085 : 0.065
          );
          triggerBassNote(chord.bassHz, beatSec * 1.8);
        } else if (beatInBar === 2 && beatsPerBar === 4) {
          triggerBassNote(chord.bassHz * 1.5, beatSec * 1.4);
        }

        // 2. Piano arpeggio accompaniment on every beat
        const arpNote = chord.chordHz[beatInBar % chord.chordHz.length];
        triggerPianoPluck(arpNote * (beatInBar % 2 === 1 ? 2 : 1), beatSec * 0.9, 0.065);

        // 3. Soft worship drums during Verse & Interlude
        if (section.type === 'verse' || section.type === 'interlude') {
          triggerSoftDrums(beatInBar);
        }

        // 4. Intro / Interlude / Outro instrumental motif
        if (section.type !== 'verse') {
          const motifIdx = globalBeat % chord.chordHz.length;
          if (beatInBar % 2 === 0) {
            triggerLeadVoice(chord.chordHz[motifIdx] * 2, beatSec * 1.6, 0.055);
          }
        }
      }

      // 5. Lead vocal/choir melody aligned to verse timeline
      if (section.type === 'verse') {
        const verseElapsedBeats = (nextTime - section.startSec) / beatSec;
        let accum = 0;
        let foundIdx = 0;
        for (let i = 0; i < currentSong.melodyNotes.length; i++) {
          const note = currentSong.melodyNotes[i];
          if (verseElapsedBeats >= accum && verseElapsedBeats < accum + note.beats) {
            foundIdx = i;
            break;
          }
          accum += note.beats;
          if (i === currentSong.melodyNotes.length - 1) {
            foundIdx = i;
          }
        }
        const verseKey = (section.verseNumber || 1) * 1000 + foundIdx;
        if (verseKey !== lastMelodyStepRef.current) {
          lastMelodyStepRef.current = verseKey;
          const note = currentSong.melodyNotes[foundIdx];
          if (note) {
            triggerLeadVoice(note.freq, note.beats * beatSec * 0.92, 0.14);
          }
        }
      }
    }, 60);

    return () => window.clearInterval(interval);
  }, [
    currentSong,
    ensureAudioGraph,
    isPlaying,
    nextTrack,
    playbackRate,
    repeatMode,
    timeline,
    totalDurationSec,
    triggerBassNote,
    triggerLeadVoice,
    triggerPianoPluck,
    triggerSoftDrums,
    triggerWarmPadChord,
  ]);

  const playSong = useCallback(
    (songId: string, autoStart = true) => {
      if (songId !== currentSongId) {
        setCurrentSongId(songId);
        setCurrentTimeSec(0);
        lastScheduledStepRef.current = -1;
        lastMelodyStepRef.current = -1;
      }
      setHasLoadedTrack(true);
      if (autoStart) {
        ensureAudioGraph();
        setIsPlaying(true);
        onTrackStarted?.(songId);
      }
    },
    [currentSongId, ensureAudioGraph, onTrackStarted]
  );

  const togglePlay = useCallback(() => {
    setHasLoadedTrack(true);
    if (!isPlaying) {
      ensureAudioGraph();
      onTrackStarted?.(currentSong.id);
    }
    setIsPlaying((p) => !p);
  }, [currentSong.id, ensureAudioGraph, isPlaying, onTrackStarted]);

  const seekToSeconds = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(sec, totalDurationSec - 0.1));
      setCurrentTimeSec(clamped);
      lastScheduledStepRef.current = -1;
      lastMelodyStepRef.current = -1;
    },
    [totalDurationSec]
  );

  const jumpToSection = useCallback(
    (sectionId: string) => {
      const target = timeline.find((s) => s.id === sectionId);
      if (target) {
        seekToSeconds(target.startSec);
        if (!isPlaying) {
          ensureAudioGraph();
          setHasLoadedTrack(true);
          setIsPlaying(true);
        }
      }
    },
    [ensureAudioGraph, isPlaying, seekToSeconds, timeline]
  );

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === 'all' ? 'one' : prev === 'one' ? 'off' : 'all'));
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    currentSong,
    hasLoadedTrack,
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
    setVolume,
    toggleMute: () => setIsMuted((m) => !m),
    toggleShuffle: () => setShuffle((s) => !s),
    cycleRepeat,
    setPlaybackRate,
    playSong,
    togglePlay,
    nextTrack,
    prevTrack,
    seekToSeconds,
    jumpToSection,
  };
}
