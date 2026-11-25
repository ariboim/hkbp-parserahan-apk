import React, { useState } from 'react';
import { Award, Bell, CheckCircle2, Flame, Gamepad2, Lock, Play, RotateCcw, Sparkles, Trophy, XCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/mockData';

interface GameViewProps {
  xp: number;
  onAddXp: (amount: number) => void;
}

const UPCOMING_GAMES = [
  {
    id: 'musa-pacman',
    title: 'Musa vs Firaun Pacman',
    desc: 'Kumpulkan manna di padang gurun sambil menghindari pasukan kereta Mesir.',
    eta: 'Segera Hadir',
  },
  {
    id: 'daud-goliat',
    title: 'Daud vs Goliat',
    desc: 'Arahkan umban dengan tepat berdasarkan ketepatan ayat Alkitab.',
    eta: 'Segera Hadir',
  },
  {
    id: 'adam-hawa-bertani',
    title: 'Adam & Hawa Bertani',
    desc: 'Simulasi merawat Taman Eden dengan nilai tanggung jawab ciptaan.',
    eta: 'Segera Hadir',
  },
  {
    id: 'kata-pertama-musa',
    title: 'Kata Pertama Musa',
    desc: 'Teka kata Bahasa Batak & istilah Alkitab dalam 60 detik.',
    eta: 'Segera Hadir',
  },
];

const PLAGUE_CHALLENGE_STEPS = [
  { step: 1, prompt: 'Sungai Nil berubah menjadi...', choices: ['Darah', 'Minyak', 'Madu'], correct: 0 },
  { step: 2, prompt: 'Tulah katak dan nyamuk memenuhi Mesir, Musa mengangkat...', choices: ['Pedang Besi', 'Tongkat Tuhan', 'Perisai Emas'], correct: 1 },
  { step: 3, prompt: 'Tiba di tepi Laut Teberau! Apa perintah Tuhan kepada Musa?', choices: ['Menyerah kembali', 'Ulurkan tangan ke atas laut hingga terbelah', 'Membangun perahu kayu'], correct: 1 },
];

export const GameView: React.FC<GameViewProps> = ({ xp, onAddXp }) => {
  const [mode, setMode] = useState<'hub' | 'quiz' | 'musa'>('hub');

  // Quiz state
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizEarnedXp, setQuizEarnedXp] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Musa vs Firaun mini-game state
  const [musaStep, setMusaStep] = useState(0);
  const [musaChoice, setMusaChoice] = useState<number | null>(null);
  const [musaWon, setMusaWon] = useState(false);

  // Notify me toggles for upcoming games
  const [remindedGames, setRemindedGames] = useState<string[]>([]);

  const currentQuestion = QUIZ_QUESTIONS[qIndex];

  const handleAnswerQuiz = (optIndex: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(optIndex);
    if (optIndex === currentQuestion.correctIndex) {
      setQuizScore((s) => s + 1);
      setQuizEarnedXp((x) => x + currentQuestion.xpReward);
      onAddXp(currentQuestion.xpReward);
    }
  };

  const handleNextQuestion = () => {
    if (qIndex + 1 < QUIZ_QUESTIONS.length) {
      setQIndex((i) => i + 1);
      setSelectedOpt(null);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setQIndex(0);
    setSelectedOpt(null);
    setQuizScore(0);
    setQuizEarnedXp(0);
    setQuizFinished(false);
  };

  const handleMusaChoice = (idx: number) => {
    if (musaChoice !== null) return;
    setMusaChoice(idx);
    const current = PLAGUE_CHALLENGE_STEPS[musaStep];
    if (idx === current.correct) {
      onAddXp(20);
      window.setTimeout(() => {
        if (musaStep + 1 < PLAGUE_CHALLENGE_STEPS.length) {
          setMusaStep((s) => s + 1);
          setMusaChoice(null);
        } else {
          setMusaWon(true);
        }
      }, 650);
    } else {
      window.setTimeout(() => {
        setMusaChoice(null);
      }, 700);
    }
  };

  const toggleRemindGame = (id: string) => {
    setRemindedGames((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with XP Indicator */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-100">
            Belajar Alkitab Sambil Bermain
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">Game HKBP</h1>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-mono-nums font-extrabold text-sm shadow-sm shrink-0">
          <Trophy className="w-4 h-4" />
          <span>{xp} XP</span>
        </div>
      </section>

      {/* Active Quiz Mode */}
      {mode === 'quiz' && (
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#0D47A1] dark:text-blue-400">
                Cerdas Cermat Alkitab
              </p>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {quizFinished
                  ? 'Hasil Kuis Anda'
                  : `Soal ${qIndex + 1} dari ${QUIZ_QUESTIONS.length} · ${currentQuestion.category}`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setMode('hub')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[40px]"
            >
              Kembali ke Menu Game
            </button>
          </div>

          {quizFinished ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Skor: {quizScore} / {QUIZ_QUESTIONS.length} Benar
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Anda memperoleh tambahan <strong className="font-mono-nums text-[#0D47A1] dark:text-blue-400">+{quizEarnedXp} XP</strong>!
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-sm font-semibold min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Main Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('hub')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 min-h-[44px]"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#0D47A1] transition-all duration-300"
                  style={{ width: `${((qIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>

              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {currentQuestion.question}
              </p>

              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, idx) => {
                  const isChosen = selectedOpt === idx;
                  const isCorrect = idx === currentQuestion.correctIndex;
                  let btnStyle =
                    'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-400';

                  if (selectedOpt !== null) {
                    if (isCorrect) {
                      btnStyle =
                        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100';
                    } else if (isChosen) {
                      btnStyle =
                        'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={selectedOpt !== null}
                      onClick={() => handleAnswerQuiz(idx)}
                      className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between gap-3 min-h-[52px] ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {selectedOpt !== null && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {selectedOpt !== null && isChosen && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedOpt !== null && (
                <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-4 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <strong>Penjelasan:</strong> {currentQuestion.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#1565C0] min-h-[42px]"
                  >
                    {qIndex + 1 < QUIZ_QUESTIONS.length ? 'Soal Berikutnya' : 'Lihat Hasil Akhir'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Playable Musa vs Firaun Mini-Game */}
      {mode === 'musa' && (
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Misi Keluaran · Siap Dimainkan
              </p>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Musa vs Firaun — Menyeberangi Laut Teberau
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setMode('hub')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[40px]"
            >
              Kembali
            </button>
          </div>

          {musaWon ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <Flame className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Bangsa Israel Selamat!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Anda berhasil menyelesaikan seluruh tantangan Musa vs Firaun dan meraih <strong className="font-mono-nums">+60 XP</strong>!
              </p>
              <button
                type="button"
                onClick={() => {
                  setMusaStep(0);
                  setMusaChoice(null);
                  setMusaWon(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-sm font-semibold min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Misi</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono-nums text-slate-500">
                <span>Tahap {musaStep + 1} / {PLAGUE_CHALLENGE_STEPS.length}</span>
                <span>+20 XP / tahap</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {PLAGUE_CHALLENGE_STEPS[musaStep].prompt}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLAGUE_CHALLENGE_STEPS[musaStep].choices.map((ch, idx) => {
                  const chosen = musaChoice === idx;
                  const correct = idx === PLAGUE_CHALLENGE_STEPS[musaStep].correct;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleMusaChoice(idx)}
                      className={`p-4 rounded-2xl border text-sm font-bold transition-all min-h-[56px] ${
                        chosen
                          ? correct
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                            : 'bg-rose-50 border-rose-500 text-rose-900'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-[#0D47A1]'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Game Hub */}
      {mode === 'hub' && (
        <>
          {/* Featured Game */}
          <section className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white p-5 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-100">
                <Sparkles className="w-4 h-4" />
                <span>Game Unggulan</span>
              </div>
              <h2 className="text-2xl font-extrabold">Cerdas Cermat Alkitab</h2>
              <p className="text-sm text-white/90 max-w-xl">
                Jawab pertanyaan seputar Firman Tuhan, tokoh Alkitab, dan sejarah HKBP untuk mengumpulkan poin XP jemaat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetQuiz();
                setMode('quiz');
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-orange-700 text-sm font-extrabold shadow-md hover:bg-amber-50 active:scale-[0.98] transition-all min-h-[48px] shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Mainkan</span>
            </button>
          </section>

          {/* Siap Dimainkan */}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
              SIAP DIMAINKAN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-[#0D47A1] dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      Musa vs Firaun
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Tantangan kisah 10 tulah dan penyeberangan Laut Teberau.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMusaStep(0);
                    setMusaChoice(null);
                    setMusaWon(false);
                    setMode('musa');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#1565C0] min-h-[42px] shrink-0"
                >
                  Mainkan
                </button>
              </div>
            </div>
          </section>

          {/* Segera Hadir */}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
              SEGERA HADIR
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {UPCOMING_GAMES.map((g) => {
                const reminded = remindedGames.includes(g.id);
                return (
                  <div
                    key={g.id}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between gap-4 opacity-90"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{g.eta}</span>
                        </p>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {g.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {g.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRemindGame(g.id)}
                      className={`self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold min-h-[38px] transition-colors ${
                        reminded
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{reminded ? 'Akan Diingatkan' : 'Ingatkan Saat Rilis'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
