import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Play, X } from 'lucide-react';
import { ASSETS, BIBLE_STORIES } from '../data/mockData';
import { ActiveRoute, BibleStory } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface HasudunganViewProps {
  onNavigate: (route: ActiveRoute) => void;
}

export const HasudunganView: React.FC<HasudunganViewProps> = ({ onNavigate }) => {
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [activeStory, setActiveStory] = useState<BibleStory | null>(null);
  const [storyLang, setStoryLang] = useState<'batak' | 'indo'>('batak');

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-medium text-blue-100">
          Cerita Alkitab · Bahasa Batak
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
          Hasudungan Ni Roha
        </h2>
        <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 max-w-2xl">
          Kumpulan kisah Alkitab berbahasa Batak Toba yang disusun untuk keluarga, anak Sekolah Minggu, dan generasi muda HKBP Parserahan.
        </p>
      </section>

      {/* PENGANTAR Section */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
          PENGANTAR
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Video Card */}
          <div className="lg:col-span-6 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
            <div className="relative h-48 sm:h-56 overflow-hidden">
              <ImageWithFallback
                src={ASSETS.hkbpTvStudio}
                alt="Hasudungan ni Roha - The Series"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                <p className="text-xs text-blue-200 font-medium">
                  Production House Multimedia HKBP
                </p>
                <h4 className="text-base font-bold mt-0.5">
                  Hasudungan ni Roha - The Series
                </h4>
              </div>
            </div>
            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onNavigate({ type: 'sub', view: 'hkbp-tv' })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] transition-colors min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Putar di HKBP TV</span>
              </button>
              <a
                href="https://www.youtube.com/results?search_query=Hasudungan+ni+Roha+HKBP"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <span>Buka YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Expandable Book Description */}
          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D47A1] dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
                <span>Tentang Buku Hasudungan Ni Roha</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Warisan Firman Tuhan dalam Bahasa Ibu
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Buku “Hasudungan Ni Roha” menghadirkan cerita-cerita pokok Alkitab dari Kitab Kejadian hingga Injil dalam Bahasa Batak Toba yang mudah dicerna oleh anak-anak maupun orang tua.
              </p>
              {expandedDesc && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  Melalui ilustrasi penuh warna dan kosakata Batak yang santun, jemaat HKBP Parserahan dapat menggunakannya sebagai bahan saat teduh keluarga (partangiangan keluarga) setiap malam agar generasi muda mencintai Alkitab sekaligus melestarikan bahasa Batak.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setExpandedDesc((prev) => !prev)}
              className="mt-4 self-start inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] dark:text-blue-400 hover:underline min-h-[40px]"
            >
              <span>{expandedDesc ? 'Sembunyikan' : 'Selengkapnya'}</span>
              {expandedDesc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* DAFTAR CERITA Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
            DAFTAR CERITA
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {BIBLE_STORIES.length} Kisah Pilihan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BIBLE_STORIES.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => setActiveStory(story)}
              className="group text-left rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col"
            >
              <div className="h-44 w-full overflow-hidden">
                <ImageWithFallback
                  src={story.imageUrl}
                  alt={`${story.passage} - ${story.title}`}
                  fallbackGradient={story.fallbackGradient}
                  fallbackLabel={`${story.passage} — ${story.title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0D47A1] dark:text-blue-400">
                    {story.passage}
                  </p>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {story.passage} — {story.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-3">
                    {story.batakExcerpt}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] dark:text-blue-400">
                  <span>Baca Cerita Lengkap</span>
                  <BookOpen className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Story Reader Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0 pr-3">
                <p className="text-xs font-bold text-[#0D47A1] dark:text-blue-400">
                  {activeStory.passage} · Hasudungan Ni Roha
                </p>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {activeStory.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                aria-label="Tutup cerita"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="h-52 rounded-2xl overflow-hidden">
                <ImageWithFallback
                  src={activeStory.imageUrl}
                  alt={activeStory.title}
                  fallbackGradient={activeStory.fallbackGradient}
                  fallbackLabel={activeStory.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setStoryLang('batak')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] ${
                      storyLang === 'batak'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bahasa Batak
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryLang('indo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] ${
                      storyLang === 'indo'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Terjemahan Indonesia
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                {(storyLang === 'batak' ? activeStory.paragraphsBatak : activeStory.paragraphsIndo).map(
                  (para, i) => (
                    <p key={i}>{para}</p>
                  )
                )}
              </div>

              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                  Poda / Pesan Moral
                </p>
                <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100">
                  {activeStory.moralLesson}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
