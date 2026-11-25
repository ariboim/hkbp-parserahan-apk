import React, { useMemo, useState } from 'react';
import { Calendar, ExternalLink, Pause, Play, Tv } from 'lucide-react';
import { HKBP_TV_VIDEOS } from '../data/mockData';
import { ImageWithFallback } from '../components/ImageWithFallback';

const CATEGORIES = ['HKBP TV', 'Karaoke', 'Instrumentalia'] as const;
const SUB_TABS = ['Semua', 'Studio HKBP', 'Khotbah Minggu'] as const;

export const HkbpTvView: React.FC = () => {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('HKBP TV');
  const [subTab, setSubTab] = useState<(typeof SUB_TABS)[number]>('Semua');
  const [activeVideoId, setActiveVideoId] = useState<string>(HKBP_TV_VIDEOS[0].id);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const filteredPlaylist = useMemo(() => {
    return HKBP_TV_VIDEOS.filter((v) => {
      if (v.category !== category) return false;
      if (subTab !== 'Semua' && v.subCategory !== subTab) return false;
      return true;
    });
  }, [category, subTab]);

  const activeVideo =
    HKBP_TV_VIDEOS.find((v) => v.id === activeVideoId) || filteredPlaylist[0] || HKBP_TV_VIDEOS[0];

  const handleSelectCategory = (cat: (typeof CATEGORIES)[number]) => {
    setCategory(cat);
    setSubTab('Semua');
    const first = HKBP_TV_VIDEOS.find((v) => v.category === cat);
    if (first) {
      setActiveVideoId(first.id);
      setIsPlayingPreview(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
          <Tv className="w-4 h-4" />
          <span>Kanal Video Resmi HKBP</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold mt-1">HKBP TV</h1>

        {/* Category Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors min-h-[40px] ${
                category === cat
                  ? 'bg-white text-[#0D47A1]'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-Tabs */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SUB_TABS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubTab(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[34px] transition-colors ${
                subTab === sub
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-black/20 text-blue-100 hover:bg-black/30'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </section>

      {/* Main Split: Video Stage + Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Video Player */}
        <section className="lg:col-span-7 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative aspect-video bg-slate-950 overflow-hidden">
            <ImageWithFallback
              src={activeVideo.thumbnailUrl}
              alt={activeVideo.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlayingPreview ? 'scale-105 brightness-90' : ''
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs text-white/90">
                <span className="px-2.5 py-1 rounded-lg bg-black/55 font-semibold">
                  {activeVideo.subCategory}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/55 font-mono-nums">
                  {activeVideo.duration}
                </span>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsPlayingPreview((prev) => !prev)}
                  aria-label={isPlayingPreview ? 'Jeda tayangan' : 'Putar tayangan'}
                  className="w-16 h-16 rounded-full bg-white/95 text-[#0D47A1] flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                >
                  {isPlayingPreview ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>
              </div>

              <div className="text-white">
                {isPlayingPreview && (
                  <div className="mb-2 h-1.5 w-full rounded-full bg-white/25 overflow-hidden">
                    <div className="h-full w-2/5 bg-amber-400 rounded-full" />
                  </div>
                )}
                <p className="text-xs text-blue-200 font-medium">
                  {isPlayingPreview ? 'Sedang diputar di HKBP TV Player' : activeVideo.speakerOrArtist}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{activeVideo.date}</span>
              <span aria-hidden="true">·</span>
              <span>Video {activeVideo.number}</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              {activeVideo.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeVideo.description}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsPlayingPreview((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] min-h-[42px]"
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlayingPreview ? 'Jeda Pemutaran' : 'Putar Sekarang'}</span>
              </button>
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[42px]"
              >
                <span>Tonton di YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* PLAYLIST */}
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
              PLAYLIST
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
              {filteredPlaylist.length} Video
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredPlaylist.map((video) => {
              const isCurrent = video.id === activeVideo.id;
              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    setActiveVideoId(video.id);
                    setIsPlayingPreview(true);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`font-mono-nums text-xs font-extrabold w-6 shrink-0 ${
                      isCurrent ? 'text-[#0D47A1] dark:text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    {video.number}
                  </span>
                  <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0">
                    <ImageWithFallback
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isCurrent && (
                      <p className="text-[11px] font-bold text-[#0D47A1] dark:text-blue-400 mb-0.5">
                        Sedang diputar
                      </p>
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono-nums">
                      {video.duration} · {video.date}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
