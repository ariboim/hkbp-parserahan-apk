import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellRing,
  BookOpen,
  Clock,
  Home,
  Music,
  User,
  X,
} from 'lucide-react';
import {
  DEMO_PROFILES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TIMELINE_POSTS,
  TODAY_DEVOTIONAL,
} from './data/mockData';
import {
  ActiveRoute,
  AppNotification,
  CardTheme,
  MainTab,
  SubView,
  TimelinePost,
} from './types';
import { useReminderNotification } from './hooks/useReminderNotification';
import { useFullSongPlayer } from './hooks/useFullSongPlayer';
import { NotificationDrawer } from './components/NotificationDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { BetaWelcomeGate } from './components/BetaWelcomeGate';
import { HomeView } from './views/HomeView';
import { AlkitabView } from './views/AlkitabView';
import { TimelineView } from './views/TimelineView';
import { MusikView } from './views/MusikView';
import { MusikPlayerView } from './views/MusikPlayerView';
import { ProfilView } from './views/ProfilView';
import { RenunganDetailView } from './views/RenunganDetailView';
import { HasudunganView } from './views/HasudunganView';
import { HkbpTvView } from './views/HkbpTvView';
import { CariGerejaView } from './views/CariGerejaView';
import { GameView } from './views/GameView';
import { ServicesViews } from './views/ServicesViews';

const SUBVIEW_TITLES: Record<SubView, string> = {
  renungan: 'Renungan Hari Ini',
  hasudungan: 'Hasudungan Ni Roha',
  'musik-player': 'Pemutar Musik HKBP',
  'hkbp-tv': 'HKBP TV',
  'cari-gereja': 'Cari Gereja HKBP',
  game: 'Game HKBP',
  almanak: 'Almanak HKBP',
  pengajaran: 'Pengajaran Gereja',
  media: 'Media & Warta',
  organisasi: 'Organisasi Jemaat',
  absensi: 'Absensi Ibadah',
  donasi: 'Donasi & Persembahan',
  event: 'Event Jemaat',
  aspirasi: 'Aspirasi Jemaat',
};

export default function App() {
  const [betaAccepted, setBetaAccepted] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('hkbp_beta_accepted') === 'true';
    } catch {
      return false;
    }
  });
  const [routeHistory, setRouteHistory] = useState<ActiveRoute[]>([
    { type: 'tab', tab: 'beranda' },
  ]);
  const currentRoute = routeHistory[routeHistory.length - 1];

  const [accountType, setAccountType] = useState<'jemaat' | 'admin'>('jemaat');
  const [cardTheme, setCardTheme] = useState<CardTheme>('default');
  const [appDarkMode, setAppDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hkbp_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hkbp_game_xp');
      return saved ? Number(saved) : 125;
    } catch {
      return 125;
    }
  });

  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>(['be-167', 'be-790']);
  const [recentSongIds, setRecentSongIds] = useState<string[]>(['be-167', 'be-28', 'bn-1']);
  const [posts, setPosts] = useState<TimelinePost[]>(INITIAL_TIMELINE_POSTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const profile = DEMO_PROFILES[accountType];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', appDarkMode);
    try {
      localStorage.setItem('hkbp_dark_mode', String(appDarkMode));
    } catch {
      // ignore
    }
  }, [appDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem('hkbp_game_xp', String(xp));
    } catch {
      // ignore
    }
  }, [xp]);

  const handleAddNotification = useCallback((notif: AppNotification) => {
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const handleRecordPlay = useCallback((id: string) => {
    setRecentSongIds((prev) => [id, ...prev.filter((item) => item !== id)].slice(0, 6));
  }, []);

  const reminder = useReminderNotification(TODAY_DEVOTIONAL, handleAddNotification);
  const player = useFullSongPlayer('be-167', handleRecordPlay);

  const navigate = useCallback(
    (next: ActiveRoute) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (next.type === 'sub' && next.view === 'musik-player' && next.param) {
        if (next.param !== player.currentSong.id) {
          player.playSong(next.param, false);
        }
      }
      if (next.type === 'tab') {
        setRouteHistory([{ type: 'tab', tab: next.tab }]);
      } else {
        setRouteHistory((prev) => [...prev, next]);
      }
    },
    [player]
  );

  const goBack = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setRouteHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteSongIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handlePlaySongDirect = useCallback(
    (songId: string) => {
      if (player.currentSong.id === songId && player.hasLoadedTrack) {
        player.togglePlay();
      } else {
        player.playSong(songId, true);
      }
    },
    [player]
  );

  const handleToggleLikePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

  const handleAddComment = useCallback(
    (postId: string, text: string) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [
                  ...p.comments,
                  { id: `c-${Date.now()}`, author: profile.name, text, time: 'Baru saja' },
                ],
              }
            : p
        )
      );
    },
    [profile.name]
  );

  const handleAddPost = useCallback(
    (content: string, category: string) => {
      const newPost: TimelinePost = {
        id: `post-${Date.now()}`,
        author: profile.name,
        role: profile.role,
        avatarInitials: profile.initials,
        timestamp: 'Baru saja',
        category,
        content,
        likes: 0,
        likedByMe: false,
        comments: [],
      };
      setPosts((prev) => [newPost, ...prev]);
    },
    [profile]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navTabs: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'alkitab', label: 'Alkitab', icon: BookOpen },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'musik', label: 'Musik', icon: Music },
    { id: 'profil', label: 'Profil', icon: User },
  ];

  const activeMainTab: MainTab | null =
    currentRoute.type === 'tab' ? currentRoute.tab : null;

  const isOnFullPlayer = currentRoute.type === 'sub' && currentRoute.view === 'musik-player';

  const handleAcceptBeta = useCallback((goToFeedback = false) => {
    try {
      sessionStorage.setItem('hkbp_beta_accepted', 'true');
    } catch {
      // ignore
    }
    setBetaAccepted(true);
    if (goToFeedback) {
      setRouteHistory([{ type: 'tab', tab: 'beranda' }, { type: 'sub', view: 'aspirasi' }]);
    }
  }, []);

  if (!betaAccepted) {
    return (
      <BetaWelcomeGate
        onContinue={() => handleAcceptBeta(false)}
        onGiveFeedback={() => handleAcceptBeta(true)}
      />
    );
  }

  const renderContent = () => {
    if (currentRoute.type === 'tab') {
      switch (currentRoute.tab) {
        case 'beranda':
          return (
            <HomeView
              profile={profile}
              devotional={TODAY_DEVOTIONAL}
              unreadNotifications={unreadCount}
              reminderSettings={reminder.settings}
              onOpenNotifications={() => setNotifDrawerOpen(true)}
              onNavigate={navigate}
            />
          );
        case 'alkitab':
          return <AlkitabView />;
        case 'timeline':
          return (
            <TimelineView
              posts={posts}
              profile={profile}
              onToggleLike={handleToggleLikePost}
              onAddComment={handleAddComment}
              onAddPost={handleAddPost}
            />
          );
        case 'musik':
          return (
            <MusikView
              favoriteIds={favoriteSongIds}
              recentIds={recentSongIds}
              activeSongId={player.currentSong.id}
              isPlaying={player.isPlaying}
              onToggleFavorite={handleToggleFavorite}
              onPlaySongDirect={handlePlaySongDirect}
              onNavigate={navigate}
            />
          );
        case 'profil':
          return (
            <ProfilView
              profile={profile}
              accountType={accountType}
              cardTheme={cardTheme}
              appDarkMode={appDarkMode}
              xp={xp}
              reminderSettings={reminder.settings}
              onChangeCardTheme={setCardTheme}
              onSwitchAccount={() =>
                setAccountType((prev) => (prev === 'jemaat' ? 'admin' : 'jemaat'))
              }
              onToggleDarkMode={() => setAppDarkMode((d) => !d)}
              onOpenNotifications={() => setNotifDrawerOpen(true)}
            />
          );
      }
    }

    switch (currentRoute.view) {
      case 'renungan':
        return (
          <RenunganDetailView
            initialDevotional={TODAY_DEVOTIONAL}
            reminderSettings={reminder.settings}
            onToggleReminder={reminder.toggleEnabled}
            onChangeTime={reminder.updateTime}
            onSendTestReminder={reminder.sendTestReminder}
            onNavigate={navigate}
          />
        );
      case 'hasudungan':
        return <HasudunganView onNavigate={navigate} />;
      case 'musik-player':
        return (
          <MusikPlayerView
            song={player.currentSong}
            isPlaying={player.isPlaying}
            currentTimeSec={player.currentTimeSec}
            totalDurationSec={player.totalDurationSec}
            timeline={player.timeline}
            currentSection={player.currentSection}
            activeVerseNumber={player.activeVerseNumber}
            activeLineIndex={player.activeLineIndex}
            volume={player.volume}
            isMuted={player.isMuted}
            repeatMode={player.repeatMode}
            shuffle={player.shuffle}
            playbackRate={player.playbackRate}
            favoriteIds={favoriteSongIds}
            onToggleFavorite={handleToggleFavorite}
            onTogglePlay={player.togglePlay}
            onNext={player.nextTrack}
            onPrev={player.prevTrack}
            onSeek={player.seekToSeconds}
            onJumpSection={player.jumpToSection}
            onChangeVolume={player.setVolume}
            onToggleMute={player.toggleMute}
            onToggleShuffle={player.toggleShuffle}
            onCycleRepeat={player.cycleRepeat}
            onChangeSpeed={player.setPlaybackRate}
            onSelectSong={(id) => player.playSong(id, true)}
          />
        );
      case 'hkbp-tv':
        return <HkbpTvView />;
      case 'cari-gereja':
        return <CariGerejaView />;
      case 'game':
        return <GameView xp={xp} onAddXp={(amt) => setXp((prev) => prev + amt)} />;
      default:
        return <ServicesViews view={currentRoute.view} profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 justify-between z-30">
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => navigate({ type: 'tab', tab: 'beranda' })}
            className="flex items-center gap-3 text-left w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0D47A1] text-white font-display font-extrabold flex items-center justify-center shrink-0">
              ✝
            </div>
            <div className="min-w-0">
              <span className="block text-base font-extrabold text-slate-900 dark:text-white truncate">
                HKBP Parserahan
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Portal Jemaat Digital
              </span>
            </div>
          </button>

          <nav className="space-y-1.5" aria-label="Navigasi utama desktop">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeMainTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate({ type: 'tab', tab: item.id })}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-[#0D47A1] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setNotifDrawerOpen(true)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0D47A1] dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors min-h-[44px]"
        >
          <span className="flex items-center gap-2">
            <BellRing className="w-4 h-4" />
            <span>Pengingat {reminder.settings.time}</span>
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono-nums text-[11px]">
              {unreadCount}
            </span>
          )}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Sub-view Top App Bar (Back Button) */}
        {currentRoute.type === 'sub' && (
          <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={goBack}
                aria-label="Kembali"
                className="min-h-[44px] min-w-[44px] -ml-2 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {SUBVIEW_TITLES[currentRoute.view]}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setNotifDrawerOpen(true)}
              aria-label="Buka notifikasi"
              className="relative min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          </header>
        )}

        {/* In-App Devotional Reminder Toast Banner */}
        {reminder.inAppBanner && (
          <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 rounded-2xl bg-[#0D47A1] text-white p-4 shadow-2xl border border-blue-400/40 flex items-start gap-3">
            <BellRing className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-300">{reminder.inAppBanner.title}</p>
              <p className="text-xs text-white/95 mt-1 leading-relaxed">
                {reminder.inAppBanner.body}
              </p>
              <button
                type="button"
                onClick={() => {
                  reminder.dismissBanner();
                  navigate({ type: 'sub', view: 'renungan' });
                }}
                className="mt-2 text-xs font-bold underline text-amber-200"
              >
                Buka Renungan Sekarang
              </button>
            </div>
            <button
              type="button"
              onClick={reminder.dismissBanner}
              aria-label="Tutup pengingat"
              className="p-1 rounded-lg hover:bg-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Container */}
        <main
          className={`flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 ${
            player.hasLoadedTrack && !isOnFullPlayer ? 'pb-36 lg:pb-24' : 'pb-24 lg:pb-10'
          }`}
        >
          {renderContent()}
        </main>
      </div>

      {/* Persistent Spotify-Style Mini Player Bar */}
      {player.hasLoadedTrack && !isOnFullPlayer && (
        <MiniPlayerBar
          song={player.currentSong}
          isPlaying={player.isPlaying}
          currentTimeSec={player.currentTimeSec}
          totalDurationSec={player.totalDurationSec}
          currentSection={player.currentSection}
          onTogglePlay={player.togglePlay}
          onNext={player.nextTrack}
          onOpenPlayer={() =>
            navigate({ type: 'sub', view: 'musik-player', param: player.currentSong.id })
          }
        />
      )}

      {/* Fixed Bottom Navigation Bar (Mobile / Tablet) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-xl mx-auto">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeMainTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate({ type: 'tab', tab: item.id })}
                className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
                  isActive
                    ? 'text-[#0D47A1] dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-semibold tracking-tight mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notification & Reminder Drawer */}
      <NotificationDrawer
        open={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onNavigate={navigate}
        reminderSettings={reminder.settings}
        onToggleReminder={reminder.toggleEnabled}
        onChangeTime={reminder.updateTime}
        onSendTestReminder={reminder.sendTestReminder}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
