import React, { useMemo, useState } from 'react';
import { Bookmark, BookOpen, Search, Type } from 'lucide-react';
import { BIBLE_BOOKS } from '../data/mockData';

export const AlkitabView: React.FC = () => {
  const [selectedBookId, setSelectedBookId] = useState(BIBLE_BOOKS[0].id);
  const [translation, setTranslation] = useState<'batak' | 'indo'>('batak');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [search, setSearch] = useState('');
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>(['nehemia-4-8']);

  const book = BIBLE_BOOKS.find((b) => b.id === selectedBookId) || BIBLE_BOOKS[0];
  const chapter = book.chapters[0];

  const verses = useMemo(() => {
    if (!search.trim()) return chapter.verses;
    const q = search.toLowerCase();
    return chapter.verses.filter(
      (v) => v.indo.toLowerCase().includes(q) || v.batak.toLowerCase().includes(q)
    );
  }, [chapter.verses, search]);

  const toggleBookmark = (verseKey: string) => {
    setBookmarkedVerses((prev) =>
      prev.includes(verseKey) ? prev.filter((k) => k !== verseKey) : [...prev, verseKey]
    );
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-100">
              Bibel Batak Toba & Terjemahan Baru
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">Alkitab Digital</h1>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/15">
            <button
              type="button"
              onClick={() => setTranslation('batak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold min-h-[34px] ${
                translation === 'batak' ? 'bg-white text-[#0D47A1]' : 'text-white'
              }`}
            >
              B. Batak
            </button>
            <button
              type="button"
              onClick={() => setTranslation('indo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold min-h-[34px] ${
                translation === 'indo' ? 'bg-white text-[#0D47A1]' : 'text-white'
              }`}
            >
              B. Indonesia
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BIBLE_BOOKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBookId(b.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold min-h-[38px] transition-colors ${
                selectedBookId === b.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {translation === 'batak' ? b.nameBatak : b.nameIndo} {b.chapters[0].chapter}
            </button>
          ))}
        </div>
      </section>

      {/* Toolbar */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kata dalam pasal ini..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <button
          type="button"
          onClick={() => setFontSize((f) => (f === 'normal' ? 'large' : 'normal'))}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[38px]"
        >
          <Type className="w-4 h-4" />
          <span>Ukuran Teks: {fontSize === 'normal' ? 'Normal' : 'Besar'}</span>
        </button>
      </section>

      {/* Scripture Reader */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-[#0D47A1] dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {translation === 'batak' ? book.nameBatak : book.nameIndo} Pasal {chapter.chapter}
            </h2>
          </div>
          <span className="text-xs font-mono-nums text-slate-500 dark:text-slate-400">
            {verses.length} Ayat
          </span>
        </div>

        <div className="space-y-4">
          {verses.map((v) => {
            const key = `${book.id}-${chapter.chapter}-${v.num}`;
            const saved = bookmarkedVerses.includes(key);
            return (
              <div
                key={v.num}
                className={`p-3.5 rounded-2xl transition-colors flex items-start justify-between gap-3 ${
                  saved ? 'bg-amber-50/70 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <p
                  className={`text-slate-800 dark:text-slate-100 leading-relaxed ${
                    fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                  }`}
                >
                  <sup className="font-mono-nums font-bold text-[#0D47A1] dark:text-blue-400 mr-2">
                    {v.num}
                  </sup>
                  {translation === 'batak' ? v.batak : v.indo}
                </p>
                <button
                  type="button"
                  onClick={() => toggleBookmark(key)}
                  aria-label="Tandai ayat"
                  className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center shrink-0 ${
                    saved ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
