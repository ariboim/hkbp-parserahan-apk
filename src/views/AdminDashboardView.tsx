import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Inbox,
  KeyRound,
  Lock,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import {
  ASPIRATION_LIMITS,
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInAdminWithGoogle,
  signOutFirebase,
} from '../firebase';
import { AspirationRecord, AspirationStatus } from '../types';

interface AdminDashboardViewProps {
  adminToken: string | null;
  adminUsername: string | null;
  onLoginSuccess: (token: string, username: string) => void;
  onLogout: () => void;
}

const STATUS_OPTIONS: AspirationStatus[] = ['Baru', 'Dibaca', 'Ditindaklanjuti', 'Selesai'];

function formatDateTime(ms: number): string {
  if (!ms) return 'Baru saja';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return 'Baru saja';
  }
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  adminToken,
  adminUsername,
  onLoginSuccess,
  onLogout,
}) => {
  const [serverMode, setServerMode] = useState<'loading' | 'setup' | 'env' | 'claimed'>('loading');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [googleAuthBusy, setGoogleAuthBusy] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  const [aspirations, setAspirations] = useState<AspirationRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Semua' | AspirationStatus>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftStatus, setDraftStatus] = useState<Record<string, AspirationStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data: { mode?: 'setup' | 'env' | 'claimed' }) => {
        if (!active) return;
        setServerMode(data.mode || 'env');
      })
      .catch(() => {
        if (active) setServerMode('env');
      });
    return () => {
      active = false;
    };
  }, [adminToken]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isGoogleAdminAuthorized = Boolean(
    firebaseUser && firebaseUser.emailVerified && firebaseUser.email === 'bca.ccpl@gmail.com'
  );

  useEffect(() => {
    if (!adminToken || !authReady || !isGoogleAdminAuthorized) {
      setAspirations([]);
      return;
    }

    setLoadingList(true);
    const q = query(collection(db, 'aspirations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: AspirationRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as {
            senderName?: string;
            weyk?: string;
            subject?: string;
            message?: string;
            status?: AspirationStatus;
            adminNote?: string;
            authorUid?: string;
            createdAt?: Timestamp | null;
            updatedAt?: Timestamp | null;
          };
          return {
            id: docSnap.id,
            senderName: d.senderName || 'Jemaat',
            weyk: d.weyk || 'HKBP Jatisampurna Wijk Parserahan',
            subject: d.subject || 'Aspirasi',
            message: d.message || '',
            status: d.status || 'Baru',
            adminNote: d.adminNote || '',
            authorUid: d.authorUid,
            createdAtMs: d.createdAt ? d.createdAt.toMillis() : Date.now(),
            updatedAtMs: d.updatedAt ? d.updatedAt.toMillis() : undefined,
          };
        });
        setAspirations(items);
        setLoadingList(false);
      },
      (error) => {
        setLoadingList(false);
        handleFirestoreError(error, OperationType.LIST, 'aspirations');
      }
    );

    return () => unsub();
  }, [adminToken, authReady, isGoogleAdminAuthorized]);

  const handleServerAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const username = usernameInput.trim();
    if (!username || !passwordInput) {
      setAuthError('Silakan isi username dan kata sandi admin.');
      return;
    }

    if (serverMode === 'setup') {
      if (passwordInput.length < 6) {
        setAuthError('Kata sandi minimal 6 karakter.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setAuthError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setAuthSubmitting(true);
    try {
      const endpoint = serverMode === 'setup' ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordInput }),
      });
      const data = (await res.json()) as { token?: string; username?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Autentikasi gagal. Periksa kredensial Anda.');
        return;
      }
      setPasswordInput('');
      setConfirmPasswordInput('');
      onLoginSuccess(data.token, data.username || username);
    } catch {
      setAuthError('Gagal menghubungi server autentikasi.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleConnectGoogleAdmin = async () => {
    setGoogleAuthError(null);
    setGoogleAuthBusy(true);
    try {
      if (firebaseUser && !isGoogleAdminAuthorized) {
        await signOutFirebase();
      }
      await signInAdminWithGoogle();
    } catch (err) {
      setGoogleAuthError(
        err instanceof Error ? err.message : 'Gagal menghubungkan akun Google Admin.'
      );
    } finally {
      setGoogleAuthBusy(false);
    }
  };

  const handleSaveAspiration = async (item: AspirationRecord) => {
    const nextStatus = draftStatus[item.id] ?? item.status;
    const rawNote = draftNotes[item.id] ?? item.adminNote ?? '';
    const trimmedNote = rawNote.trim().slice(0, ASPIRATION_LIMITS.adminNoteMax);

    setSavingId(item.id);
    const docPath = `aspirations/${item.id}`;
    try {
      await updateDoc(doc(db, 'aspirations', item.id), {
        status: nextStatus,
        adminNote: trimmedNote,
        updatedAt: serverTimestamp(),
      });
      setSavedFeedbackId(item.id);
      window.setTimeout(() => {
        setSavedFeedbackId((prev) => (prev === item.id ? null : prev));
      }, 2200);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteAspiration = async (id: string) => {
    const docPath = `aspirations/${id}`;
    try {
      await deleteDoc(doc(db, 'aspirations', id));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  const stats = useMemo(() => {
    return {
      total: aspirations.length,
      baru: aspirations.filter((a) => a.status === 'Baru').length,
      ditindaklanjuti: aspirations.filter(
        (a) => a.status === 'Dibaca' || a.status === 'Ditindaklanjuti'
      ).length,
      selesai: aspirations.filter((a) => a.status === 'Selesai').length,
    };
  }, [aspirations]);

  const filteredAspirations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return aspirations.filter((item) => {
      const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        item.senderName.toLowerCase().includes(q) ||
        item.weyk.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [aspirations, searchQuery, statusFilter]);

  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto py-6 pb-12">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-6">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-blue-100">
              Akses Terbatas · Admin Utama (Ketua)
            </p>
            <h1 className="text-xl font-extrabold mt-1">
              {serverMode === 'setup'
                ? 'Aktivasi Dashboard Admin'
                : 'Masuk Dashboard Admin'}
            </h1>
            <p className="text-xs text-blue-100/90 mt-1">
              HKBP Jatisampurna Wijk Parserahan
            </p>
          </div>

          <form onSubmit={handleServerAuthSubmit} className="p-6 space-y-4">
            {serverMode === 'setup' && (
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Tetapkan kredensial Admin Utama untuk pertama kali sebelum mengakses kotak
                aspirasi terpusat.
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username Admin
              </label>
              <input
                type="text"
                autoComplete="username"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={serverMode === 'setup' ? 'new-password' : 'current-password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-11 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {serverMode === 'setup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>
            )}

            {authError && (
              <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting || serverMode === 'loading'}
              className="w-full min-h-[46px] rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {authSubmitting
                  ? 'Memverifikasi...'
                  : serverMode === 'setup'
                  ? 'Aktifkan & Masuk Dashboard'
                  : 'Masuk Dashboard Admin'}
              </span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Admin Top Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Dashboard Admin Utama · {adminUsername || 'Ketua'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
            Pemantauan Kotak Aspirasi Jemaat
          </h1>
          <p className="text-xs text-blue-100/90 mt-1">
            HKBP Jatisampurna Wijk Parserahan · Tersinkronisasi Real-Time ke Firestore
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold min-h-[42px] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Admin</span>
        </button>
      </section>

      {/* Firebase Google Admin Connection Gate */}
      {!isGoogleAdminAuthorized ? (
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Hubungkan Akun Google Admin untuk Membuka Data Firestore
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {firebaseUser
                  ? 'Akun Google yang saat ini aktif belum memiliki otorisasi Admin Utama. Silakan hubungkan dengan akun Google pemilik/admin terdaftar.'
                  : 'Demi keamanan data jemaat, akses pembacaan penuh seluruh aspirasi di Firestore memerlukan verifikasi akun Google Admin.'}
              </p>
            </div>
          </div>

          {googleAuthError && (
            <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {googleAuthError}
            </p>
          )}

          <button
            type="button"
            onClick={handleConnectGoogleAdmin}
            disabled={googleAuthBusy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] disabled:opacity-60 text-white text-xs font-bold min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${googleAuthBusy ? 'animate-spin' : ''}`} />
            <span>
              {firebaseUser ? 'Ganti Akun Google Admin' : 'Hubungkan Akun Google Admin'}
            </span>
          </button>
        </section>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Masukan
              </p>
              <p className="text-2xl font-extrabold font-mono-nums text-slate-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Status Baru
              </p>
              <p className="text-2xl font-extrabold font-mono-nums text-amber-700 dark:text-amber-300 mt-1">
                {stats.baru}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <p className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400">
                Diproses / Dibaca
              </p>
              <p className="text-2xl font-extrabold font-mono-nums text-[#0D47A1] dark:text-blue-300 mt-1">
                {stats.ditindaklanjuti}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Selesai
              </p>
              <p className="text-2xl font-extrabold font-mono-nums text-emerald-700 dark:text-emerald-300 mt-1">
                {stats.selesai}
              </p>
            </div>
          </section>

          {/* Search & Status Filters */}
          <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengirim, kategori, atau isi aspirasi..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {(['Semua', ...STATUS_OPTIONS] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] transition-colors ${
                    statusFilter === st
                      ? 'bg-[#0D47A1] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </section>

          {/* Aspirations List */}
          <section className="space-y-4">
            {loadingList ? (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                Memuat seluruh aspirasi dari Firestore...
              </div>
            ) : filteredAspirations.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Belum ada aspirasi yang sesuai filter
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Setiap masukan yang dikirim jemaat melalui Kotak Aspirasi akan langsung muncul di sini.
                </p>
              </div>
            ) : (
              filteredAspirations.map((item) => {
                const currentStatus = draftStatus[item.id] ?? item.status;
                const currentNote = draftNotes[item.id] ?? item.adminNote ?? '';
                const isSaving = savingId === item.id;
                const isSaved = savedFeedbackId === item.id;
                const isConfirmDelete = confirmDeleteId === item.id;

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-[#0D47A1] dark:text-blue-400">
                            {item.subject}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono-nums">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDateTime(item.createdAtMs)}</span>
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {item.senderName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.weyk}</p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'Selesai'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : item.status === 'Ditindaklanjuti' || item.status === 'Dibaca'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </div>

                    {/* Admin Action Controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Ubah Status
                        </label>
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            setDraftStatus((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as AspirationStatus,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white min-h-[40px]"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Catatan Tindak Lanjut Admin
                        </label>
                        <div className="relative">
                          <MessageSquareText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            maxLength={ASPIRATION_LIMITS.adminNoteMax}
                            value={currentNote}
                            onChange={(e) =>
                              setDraftNotes((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Tambahkan catatan tindak lanjut..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white min-h-[40px]"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-3 flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveAspiration(item)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] disabled:opacity-60 text-white text-xs font-bold min-h-[40px]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Tersimpan' : isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>

                        {!isConfirmDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            aria-label="Hapus aspirasi"
                            className="min-h-[40px] min-w-[40px] rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteAspiration(item.id)}
                            className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold min-h-[40px]"
                          >
                            Hapus?
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </>
      )}
    </div>
  );
};
