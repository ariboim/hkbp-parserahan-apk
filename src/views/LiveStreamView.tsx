import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircleHeart,
  Radio,
  Send,
  Share2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { ASSETS } from '../data/mockData';
import {
  auth,
  db,
  getYouTubeEmbedUrl,
  handleFirestoreError,
  isSafeHttpsUrl,
  LIVESTREAM_LIMITS,
  OperationType,
} from '../firebase';
import { LiveMessageRecord, LiveStreamConfig, UserProfile } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface LiveStreamViewProps {
  profile: UserProfile;
  liveConfig: LiveStreamConfig;
  loadingConfig: boolean;
}

function formatInTimeZone(isoString: string, timeZone?: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

function formatMessageTime(ms: number): string {
  if (!ms) return 'Baru saja';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return 'Baru saja';
  }
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  profile,
  liveConfig,
  loadingConfig,
}) => {
  const [messages, setMessages] = useState<LiveMessageRecord[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [senderName, setSenderName] = useState(
    profile.role === 'Admin Utama (Ketua)' ? '' : profile.name
  );
  const [location, setLocation] = useState('');
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const viewerTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
    } catch {
      return 'Asia/Jakarta';
    }
  }, []);

  const wibTimeLabel = useMemo(
    () => formatInTimeZone(liveConfig.scheduleIso, 'Asia/Jakarta'),
    [liveConfig.scheduleIso]
  );

  const localTimeLabel = useMemo(
    () => formatInTimeZone(liveConfig.scheduleIso, viewerTimeZone),
    [liveConfig.scheduleIso, viewerTimeZone]
  );

  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(liveConfig.streamUrl),
    [liveConfig.streamUrl]
  );

  const safeExternalUrl = useMemo(
    () => (isSafeHttpsUrl(liveConfig.streamUrl) ? liveConfig.streamUrl.trim() : null),
    [liveConfig.streamUrl]
  );

  useEffect(() => {
    setLoadingMessages(true);
    const q = query(
      collection(db, 'livestream_messages'),
      where('streamId', '==', 'current')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: LiveMessageRecord[] = snapshot.docs
          .map((docSnap) => {
            const d = docSnap.data() as {
              streamId?: string;
              senderName?: string;
              location?: string;
              message?: string;
              isAdmin?: boolean;
              createdAt?: Timestamp | null;
            };
            return {
              id: docSnap.id,
              streamId: d.streamId || 'current',
              senderName: d.senderName || 'Jemaat',
              location: d.location || 'Perantauan',
              message: d.message || '',
              isAdmin: Boolean(d.isAdmin),
              createdAtMs: d.createdAt ? d.createdAt.toMillis() : Date.now(),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs)
          .slice(0, 80);

        setMessages(items);
        setLoadingMessages(false);
      },
      (error) => {
        setLoadingMessages(false);
        handleFirestoreError(error, OperationType.LIST, 'livestream_messages');
      }
    );

    return () => unsub();
  }, []);

  const handleShareStream = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${liveConfig.title} · HKBP Jatisampurna Wijk Parserahan`;
    const shareText = `Mari ikuti siaran langsung ${liveConfig.title} (${wibTimeLabel}).`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSendGreeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const cleanName = senderName.trim().slice(0, LIVESTREAM_LIMITS.senderNameMax);
    const cleanLocation = location.trim().slice(0, LIVESTREAM_LIMITS.locationMax);
    const cleanMessage = messageText.trim().slice(0, LIVESTREAM_LIMITS.messageMax);

    if (cleanName.length < LIVESTREAM_LIMITS.senderNameMin) {
      setSubmitError('Mohon isi nama Anda terlebih dahulu.');
      return;
    }
    if (cleanLocation.length < LIVESTREAM_LIMITS.locationMin) {
      setSubmitError('Mohon isi kota atau negara tempat Anda berada.');
      return;
    }
    if (cleanMessage.length < LIVESTREAM_LIMITS.messageMin) {
      setSubmitError('Mohon tulis sapaan atau pokok doa Anda.');
      return;
    }

    setSubmitting(true);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const docPath = `livestream_messages/${messageId}`;
    const isVerifiedRootAdmin = Boolean(
      auth.currentUser &&
        auth.currentUser.emailVerified &&
        auth.currentUser.email === 'bca.ccpl@gmail.com'
    );

    try {
      await setDoc(doc(db, 'livestream_messages', messageId), {
        streamId: 'current',
        senderName: cleanName,
        location: cleanLocation,
        message: cleanMessage,
        isAdmin: isVerifiedRootAdmin,
        createdAt: serverTimestamp(),
      });
      setMessageText('');
      setSubmitSuccess(true);
      window.setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (error) {
      setSubmitError('Gagal mengirim sapaan. Silakan coba beberapa saat lagi.');
      handleFirestoreError(error, OperationType.CREATE, docPath);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Live Stream Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#0B3B8C] text-white p-5 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {liveConfig.isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-extrabold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>SEDANG LIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold">
                <Radio className="w-3.5 h-3.5" />
                <span>SIARAN TERJADWAL</span>
              </span>
            )}
            <span className="text-xs text-blue-100/90 font-medium">
              Untuk Jemaat Luar Kota & Luar Negeri
            </span>
          </div>

          <button
            type="button"
            onClick={handleShareStream}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold min-h-[38px] transition-colors"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Tautan Disalin</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Link Live</span>
              </>
            )}
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold mt-3 leading-snug">
          {loadingConfig ? 'Memuat informasi siaran...' : liveConfig.title}
        </h1>
        <p className="text-xs sm:text-sm text-blue-100 mt-1 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 shrink-0 text-amber-300" />
          <span>{liveConfig.speaker}</span>
        </p>

        {/* Automatic Timezone Conversion Card */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-black/20 px-3.5 py-2.5 border border-white/10">
            <p className="text-[11px] font-semibold text-blue-200 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-amber-300" />
              <span>Waktu Gereja (WIB · Jakarta)</span>
            </p>
            <p className="text-xs font-bold text-white mt-0.5">{wibTimeLabel}</p>
          </div>
          <div className="rounded-2xl bg-black/20 px-3.5 py-2.5 border border-white/10">
            <p className="text-[11px] font-semibold text-blue-200 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Waktu Lokal Perangkat Anda ({viewerTimeZone})</span>
            </p>
            <p className="text-xs font-bold text-white mt-0.5">{localTimeLabel}</p>
          </div>
        </div>
      </section>

      {/* Main Split: Video Player & Live Greetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Video Stage */}
        <section className="lg:col-span-7 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative aspect-video bg-slate-950">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={liveConfig.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="relative w-full h-full">
                <ImageWithFallback
                  src={ASSETS.churchParserahanHero}
                  alt={liveConfig.title}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                      liveConfig.isLive ? 'bg-rose-600' : 'bg-[#0D47A1]'
                    }`}
                  >
                    <Radio className="w-7 h-7" />
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold max-w-md">
                    {liveConfig.isLive
                      ? 'Siaran Langsung Sedang Berlangsung'
                      : 'Siaran Belum Dimulai atau Menggunakan Tautan Eksternal'}
                  </h2>
                  <p className="text-xs text-slate-200 mt-1.5 max-w-md leading-relaxed">
                    Klik tombol di bawah untuk membuka tayangan langsung secara penuh di kanal resmi.
                  </p>
                  {safeExternalUrl && (
                    <a
                      href={safeExternalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[42px] transition-colors shadow-lg"
                    >
                      <span>Buka Siaran Langsung</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Tentang Acara Ini
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {liveConfig.description}
            </p>
            {safeExternalUrl && (
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <a
                  href={safeExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-bold min-h-[42px] transition-colors"
                >
                  <span>Buka di YouTube / Tautan Resmi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Live Greetings & Prayer Chat for Overseas / Out-of-Town Congregation */}
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircleHeart className="w-4 h-4 text-[#0D47A1] dark:text-blue-400" />
                <span>Sapaan Jemaat Perantauan</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kirim salam, kota/negara asal, atau pokok doa secara langsung.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 font-mono-nums text-xs font-bold">
              {messages.length}
            </span>
          </div>

          {/* Greeting Form */}
          <form onSubmit={handleSendGreeting} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Jemaat
                </label>
                <input
                  type="text"
                  required
                  maxLength={LIVESTREAM_LIMITS.senderNameMax}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Kota / Negara
                </label>
                <input
                  type="text"
                  required
                  maxLength={LIVESTREAM_LIMITS.locationMax}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Medan / Singapura / Berlin"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Sapaan / Ucapan Syukur / Doa
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={LIVESTREAM_LIMITS.messageMax}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Syalom dari perantauan, Tuhan memberkati..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Kirim sapaan"
                  className="px-4 py-2 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px] shrink-0 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Kirim...' : 'Kirim'}</span>
                </button>
              </div>
            </div>

            {submitError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {submitError}
              </p>
            )}
            {submitSuccess && (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Sapaan Anda sudah tampil di ruang live!
              </p>
            )}
          </form>

          {/* Messages Feed */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {loadingMessages ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Memuat sapaan jemaat...
              </p>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-5 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Belum ada sapaan masuk
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Jadilah yang pertama menyapa keluarga jemaat dari kota atau negara Anda.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-3 border ${
                    msg.isAdmin
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {msg.senderName}
                      </span>
                      {msg.isAdmin && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0D47A1] text-white text-[10px] font-bold shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono-nums text-slate-400 shrink-0">
                      {formatMessageTime(msg.createdAtMs)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#0D47A1] dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{msg.location}</span>
                  </p>

                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
