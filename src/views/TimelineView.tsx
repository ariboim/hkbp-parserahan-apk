import React, { useState } from 'react';
import { Heart, MessageCircle, Plus, Send, X } from 'lucide-react';
import { TimelinePost, UserProfile } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface TimelineViewProps {
  posts: TimelinePost[];
  profile: UserProfile;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onAddPost: (content: string, category: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  posts,
  profile,
  onToggleLike,
  onAddComment,
  onAddPost,
}) => {
  const [filterCat, setFilterCat] = useState('Semua');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Kesaksian & Doa');

  const categories = ['Semua', 'Warta Jemaat', 'Kegiatan Pemuda', 'Sekolah Minggu', 'Kesaksian & Doa'];

  const visiblePosts =
    filterCat === 'Semua' ? posts : posts.filter((p) => p.category === filterCat);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddPost(newContent.trim(), newCategory);
    setNewContent('');
    setShowComposer(false);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-100">
            Persekutuan Jemaat HKBP Parserahan
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">Timeline Jemaat</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowComposer(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0D47A1] text-xs font-bold hover:bg-blue-50 min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Kabar</span>
        </button>
      </section>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] transition-colors ${
              filterCat === cat
                ? 'bg-[#0D47A1] text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {visiblePosts.map((post) => {
          const isCommentsOpen = openCommentsId === post.id;
          return (
            <article
              key={post.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-[#0D47A1] dark:text-blue-300 font-display font-bold text-xs flex items-center justify-center shrink-0">
                    {post.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {post.author}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {post.role} · {post.timestamp} · {post.category}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="h-52 sm:h-64 rounded-2xl overflow-hidden">
                  <ImageWithFallback
                    src={post.imageUrl}
                    alt={post.author}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onToggleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold min-h-[38px] px-2.5 rounded-lg transition-colors ${
                    post.likedByMe
                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                  <span className="font-mono-nums">{post.likes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenCommentsId(isCommentsOpen ? null : post.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[38px] px-2.5 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-mono-nums">{post.comments.length} Komentar</span>
                </button>
              </div>

              {isCommentsOpen && (
                <div className="pt-2 space-y-3">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-200">{c.author}</strong>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{c.text}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder={`Tulis komentar sebagai ${profile.name.split(' ')[0]}...`}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = (commentInputs[post.id] || '').trim();
                        if (!text) return;
                        onAddComment(post.id, text);
                        setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
                      }}
                      className="min-h-[38px] min-w-[38px] rounded-xl bg-[#0D47A1] text-white flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreatePost}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bagikan Kabar Jemaat
              </h3>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Kategori
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="Kesaksian & Doa">Kesaksian & Doa</option>
                <option value="Warta Jemaat">Warta Jemaat</option>
                <option value="Kegiatan Pemuda">Kegiatan Pemuda</option>
                <option value="Sekolah Minggu">Sekolah Minggu</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pesan
              </label>
              <textarea
                rows={4}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Tuliskan ucapan syukur, pokok doa, atau info kegiatan..."
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#0D47A1] text-white text-sm font-bold hover:bg-[#1565C0]"
            >
              Terbitkan ke Timeline
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
