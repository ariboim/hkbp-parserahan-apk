import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  MessageSquareHeart,
  Newspaper,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ASSETS } from '../data/mockData';
import { AspirationRecord, SubView, UserProfile } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { ChurchLogo } from '../components/ChurchLogo';
import { ASPIRATION_LIMITS, auth, db, handleFirestoreError, OperationType } from '../firebase';

interface ServicesViewsProps {
  view: Extract<
    SubView,
    'almanak' | 'pengajaran' | 'media' | 'organisasi' | 'absensi' | 'donasi' | 'event' | 'aspirasi'
  >;
  profile: UserProfile;
  onOpenAdminDashboard?: () => void;
}

export const ServicesViews: React.FC<ServicesViewsProps> = ({
  view,
  profile,
  onOpenAdminDashboard,
}) => {
  // Absensi state
  const [checkedInList, setCheckedInList] = useState<string[]>([
    'Minggu, 22 Nov 2026 · Kebaktian Pagi 07.30 WIB (Hadir)',
  ]);
  const [selectedService, setSelectedService] = useState('Kebaktian Minggu Pagi · 07.30 WIB');
  const [attendanceCount, setAttendanceCount] = useState('1');

  // Donasi state
  const [donationCategory, setDonationCategory] = useState('Pelean I & II (Mingguan)');
  const [donationAmount, setDonationAmount] = useState('50000');
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);

  // Event RSVP state
  const [rsvpIds, setRsvpIds] = useState<string[]>(['ev-1']);

  // Aspirasi state (persisted centrally to Firestore + immediate session feedback list)
  const [aspirasiSenderName, setAspirasiSenderName] = useState(profile.name);
  const [aspirasiWeyk, setAspirasiWeyk] = useState('HKBP Jatisampurna Wijk Parserahan');
  const [aspirasiSubject, setAspirasiSubject] = useState('Masukan Aplikasi Beta');
  const [aspirasiMsg, setAspirasiMsg] = useState('');
  const [aspirasiSubmitting, setAspirasiSubmitting] = useState(false);
  const [aspirasiSuccess, setAspirasiSuccess] = useState<string | null>(null);
  const [aspirasiError, setAspirasiError] = useState<string | null>(null);
  const [aspirasiList, setAspirasiList] = useState<AspirationRecord[]>([]);

  if (view === 'almanak') {
    const calendarEntries = [
      { date: '25 Nov 2026', day: 'Rabu', title: 'Parningotan Harian · Nehemia 4 : 8', hymn: 'BE. 790 : 1 - 2' },
      { date: '29 Nov 2026', day: 'Minggu', title: 'Minggu Advent I · Mateus 21 : 1 - 11', hymn: 'BE. 45 : 1 - 3' },
      { date: '06 Des 2026', day: 'Minggu', title: 'Minggu Advent II · Lukas 21 : 25 - 36', hymn: 'BE. 41 : 1 - 2' },
      { date: '13 Des 2026', day: 'Minggu', title: 'Minggu Advent III · Mateus 11 : 2 - 11', hymn: 'BE. 40 : 1 - 3' },
      { date: '24 Des 2026', day: 'Kamis', title: 'Malam Natal (Parningotan Hatutubu ni Tuhan Jesus)', hymn: 'BE. 54 : 1 - 3' },
    ];
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
            <Calendar className="w-4 h-4" />
            <span>Kalender Liturgi HKBP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Almanak HKBP 2026</h1>
        </section>
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
          {calendarEntries.map((item, i) => (
            <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-mono-nums font-bold text-[#0D47A1] dark:text-blue-400">
                  {item.day}, {item.date}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {item.title}
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono-nums">
                {item.hymn}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'pengajaran') {
    const lessons = [
      {
        title: 'Konfessi HKBP 1951 & 1996',
        topic: 'Pokok Pengakuan Iman Huria Kristen Batak Protestan',
        summary: 'Memahami dasar ajaran iman Kristen Protestan dalam konteks pelayanan HKBP dan kehidupan jemaat masa kini.',
      },
      {
        title: 'Ruhut Parmahanion dohot Paminsangon (RPP)',
        topic: 'Penggembalaan & Tata Tertib Gerejawi',
        summary: 'Pedoman kasih penggembalaan jemaat untuk memelihara kekudusan dan ketertiban persekutuan.',
      },
      {
        title: 'Bahan Marguru Malua (Katekisasi Sidi)',
        topic: 'Modul Pembinaan Pemuda & Remaja HKBP Jatisampurna Wijk Parserahan',
        summary: 'Ringkasan 10 Hukum Taurat (Patik ni Debata), Pengakuan Iman Rasuli, dan Sakramen Baptisan & Perjamuan Kudus.',
      },
    ];
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-amber-100 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>Katekisasi & Doktrin HKBP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Pengajaran Gereja</h1>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((l, idx) => (
            <article key={idx} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{l.topic}</p>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{l.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{l.summary}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'media') {
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-teal-100 text-xs font-semibold">
            <Newspaper className="w-4 h-4" />
            <span>Warta Jemaat & Dokumentasi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Media HKBP Jatisampurna Wijk Parserahan</h1>
        </section>

        <article className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 h-48 md:h-auto">
            <ImageWithFallback
              src={ASSETS.churchParserahanHero}
              alt="Warta Jemaat HKBP Jatisampurna Wijk Parserahan"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="md:col-span-7 p-5 sm:p-6 space-y-3">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-400">
              Warta Minggu · Edisi 22 November 2026
            </p>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Laporan Pelayanan & Jadwal Parhalado HKBP Jatisampurna Wijk Parserahan
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
              <li>• Sermon Parhalado dilaksanakan setiap hari Kamis pukul 17.00 WIB di Konsistori.</li>
              <li>• Partangiangan Weyk I - IV berjalan rutin pukul 19.30 WIB.</li>
              <li>• Pendaftaran Katekisasi Sidi Angkatan 2026/2027 dibuka di Sekretariat Gereja.</li>
            </ul>
          </div>
        </article>
      </div>
    );
  }

  if (view === 'organisasi') {
    const advisoryBoard = [
      {
        order: '01',
        role: 'Pendeta Resort HKBP Jatisampurna / Dewan Penasehat Wijk Parserahan',
        name: 'Pdt. Tony Wakson Pakpahan',
        initials: 'TW',
        description: 'Pendeta Resort & Penasehat Rohani Pelayanan Wijk Parserahan',
      },
      {
        order: '02',
        role: 'Dewan Pembina',
        name: 'St. Binsar Siagian',
        initials: 'BS',
        description: 'Pembinaan & Pendampingan Pelayanan Sintua dan Jemaat Wijk Parserahan',
      },
    ];

    const executiveBoard = [
      {
        order: '03',
        role: 'Ketua Wijk',
        name: 'Roberth Simatupang',
        initials: 'RS',
        avatarUrl: ASSETS.roberthSimatupangAvatar,
        description: 'Pimpinan & Koordinator Pelayanan Umum Wijk Parserahan',
      },
      {
        order: '04',
        role: 'Sekretaris',
        name: 'Melati Vanny Theresia Sianturi',
        initials: 'MV',
        description: 'Administrasi Data Jemaat, Warta, & Surat-Menyurat Wijk',
      },
      {
        order: '05',
        role: 'Bendahara',
        name: 'Melati Vanny Theresia Sianturi',
        initials: 'MV',
        description: 'Pengelolaan Keuangan & Laporan Persembahan Wijk Parserahan',
      },
    ];

    return (
      <div className="space-y-6 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#081C54] via-[#0F3184] to-[#1565C0] text-white p-5 sm:p-6 shadow-md flex items-center gap-4">
          <ChurchLogo size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
              <Users className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Struktur Organisasi Resmi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-1 leading-snug">
              Organisasi HKBP Jatisampurna Wijk Parserahan
            </h1>
            <p className="text-xs text-blue-100/90 mt-1">
              Ressort Jatisampurna · Distrik XIX Bekasi
            </p>
          </div>
        </section>

        {/* Tier 1: Penasehat & Dewan Pembina */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
              Dewan Penasehat & Dewan Pembina
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Pimpinan Resort & Pembina
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advisoryBoard.map((item) => (
              <article
                key={item.order}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0F276D] text-white font-display font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {item.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400 leading-snug">
                    {item.order} · {item.role}
                  </p>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Tier 2: Pengurus Inti Wijk Parserahan */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
              Pengurus Inti Wijk Parserahan
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Pelaksana Harian Wijk
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {executiveBoard.map((item) => (
              <article
                key={item.order}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-start gap-4"
              >
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-2xl object-cover object-top shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70 font-display font-extrabold text-sm flex items-center justify-center shrink-0">
                    {item.initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0D47A1] dark:text-blue-400 leading-snug">
                    {item.order} · {item.role}
                  </p>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === 'absensi') {
    const handleCheckIn = (e: React.FormEvent) => {
      e.preventDefault();
      const record = `Hari ini · ${selectedService} (${attendanceCount} orang)`;
      setCheckedInList((prev) => [record, ...prev]);
    };
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-cyan-700 to-blue-800 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-cyan-100 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Presensi Jemaat · {profile.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Absensi Ibadah</h1>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleCheckIn}
            className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Catat Kehadiran Ibadah
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pilih Kebaktian / Partangiangan
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              >
                <option>Kebaktian Minggu Pagi · 07.30 WIB</option>
                <option>Kebaktian Minggu Siang (B. Batak) · 10.00 WIB</option>
                <option>Partangiangan Weyk III · Kamis 19.30 WIB</option>
                <option>Latihan Koor Naposobulung · Sabtu 17.00 WIB</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Jumlah Anggota Keluarga Hadir
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={attendanceCount}
                onChange={(e) => setAttendanceCount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-mono-nums text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#0D47A1] text-white text-sm font-bold hover:bg-[#1565C0]"
            >
              Konfirmasi Kehadiran
            </button>
          </form>

          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Riwayat Kehadiran ({checkedInList.length})
            </h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {checkedInList.map((entry, idx) => (
                <li key={idx} className="py-3 flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'donasi') {
    const handleDonate = (e: React.FormEvent) => {
      e.preventDefault();
      const formatted = Number(donationAmount || 0).toLocaleString('id-ID');
      setDonationSuccess(`Terima kasih! Catatan persembahan ${donationCategory} sebesar Rp ${formatted} telah direkam.`);
    };
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-rose-600 to-pink-700 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-rose-100 text-xs font-semibold">
            <HeartHandshake className="w-4 h-4" />
            <span>Pelean & Perpuluhan Digital</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Donasi & Persembahan</h1>
        </section>

        <form
          onSubmit={handleDonate}
          className="max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Jenis Persembahan
            </label>
            <select
              value={donationCategory}
              onChange={(e) => setDonationCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
            >
              <option>Pelean I & II (Mingguan)</option>
              <option>Persembahan Syukur Keluarga (Hamauliateon)</option>
              <option>Dana Pembangunan HKBP Jatisampurna Wijk Parserahan</option>
              <option>Diakonia Sosial Jemaat</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nominal (Rp)
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
              {['20000', '50000', '100000', '250000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDonationAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-nums font-bold min-h-[36px] ${
                    donationAmount === amt
                      ? 'bg-[#0D47A1] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Rp {Number(amt).toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5000}
              step={5000}
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-mono-nums text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-[#0D47A1] text-white text-sm font-bold hover:bg-[#1565C0]"
          >
            Kirim Konfirmasi Persembahan
          </button>
          {donationSuccess && (
            <p className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
              {donationSuccess}
            </p>
          )}
        </form>
      </div>
    );
  }

  if (view === 'event') {
    const events = [
      { id: 'ev-1', title: 'Perayaan Advent & Penyalakan Lilin Pertama', date: 'Minggu, 29 Nov 2026 · 10.00 WIB', place: 'Gedung Gereja HKBP Jatisampurna Wijk Parserahan' },
      { id: 'ev-2', title: 'Festival Koor Natal Antar Wijk se-HKBP Jatisampurna', date: 'Sabtu, 12 Des 2026 · 16.00 WIB', place: 'Halaman Gereja HKBP Jatisampurna Wijk Parserahan' },
      { id: 'ev-3', title: 'Natal Sekolah Minggu & Naposobulung', date: 'Sabtu, 19 Des 2026 · 17.30 WIB', place: 'Gedung Serbaguna HKBP Jatisampurna Wijk Parserahan' },
    ];
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-orange-600 to-amber-700 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-orange-100 text-xs font-semibold">
            <CalendarDays className="w-4 h-4" />
            <span>Agenda Pelayanan Jemaat</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Event HKBP Jatisampurna Wijk Parserahan</h1>
        </section>
        <div className="space-y-3">
          {events.map((ev) => {
            const joined = rsvpIds.includes(ev.id);
            return (
              <div key={ev.id} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-orange-700 dark:text-orange-400">{ev.date}</p>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{ev.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ev.place}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRsvpIds((prev) =>
                      prev.includes(ev.id) ? prev.filter((i) => i !== ev.id) : [...prev, ev.id]
                    )
                  }
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold min-h-[42px] shrink-0 transition-colors ${
                    joined
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-[#0D47A1] text-white hover:bg-[#1565C0]'
                  }`}
                >
                  {joined ? 'Terdaftar Hadir' : 'Konfirmasi Hadir'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Aspirasi (Persisted to Firestore)
  const handleAspirasiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAspirasiError(null);
    setAspirasiSuccess(null);

    const senderName = aspirasiSenderName.trim().slice(0, ASPIRATION_LIMITS.senderNameMax);
    const weyk = aspirasiWeyk.trim().slice(0, ASPIRATION_LIMITS.weykMax);
    const subject = aspirasiSubject.trim().slice(0, ASPIRATION_LIMITS.subjectMax);
    const message = aspirasiMsg.trim().slice(0, ASPIRATION_LIMITS.messageMax);

    if (senderName.length < ASPIRATION_LIMITS.senderNameMin) {
      setAspirasiError('Mohon isi nama pengirim atau tulis "Jemaat / Anonim".');
      return;
    }
    if (message.length < ASPIRATION_LIMITS.messageMin) {
      setAspirasiError('Pesan minimal 5 karakter agar dapat ditindaklanjuti.');
      return;
    }

    const docId = `asp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const docPath = `aspirations/${docId}`;

    const payload: {
      senderName: string;
      weyk: string;
      subject: string;
      message: string;
      status: 'Baru';
      createdAt: ReturnType<typeof serverTimestamp>;
      authorUid?: string;
    } = {
      senderName,
      weyk: weyk || 'HKBP Jatisampurna Wijk Parserahan',
      subject,
      message,
      status: 'Baru',
      createdAt: serverTimestamp(),
      ...(auth.currentUser?.uid ? { authorUid: auth.currentUser.uid } : {}),
    };

    setAspirasiSubmitting(true);
    try {
      await setDoc(doc(db, 'aspirations', docId), payload);
      setAspirasiList((prev) => [
        {
          id: docId,
          senderName,
          weyk: payload.weyk,
          subject,
          message,
          status: 'Baru',
          createdAtMs: Date.now(),
        },
        ...prev,
      ]);
      setAspirasiMsg('');
      setAspirasiSuccess(
        'Terima kasih! Masukan Anda telah tersimpan ke database gereja dan siap dipantau oleh Admin Utama.'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    } finally {
      setAspirasiSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-indigo-800 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
            <MessageSquareHeart className="w-4 h-4" />
            <span>Suara Jemaat, Masukan Beta & Pokok Doa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Aspirasi Jemaat</h1>
        </div>
        {onOpenAdminDashboard && (
          <button
            type="button"
            onClick={onOpenAdminDashboard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold min-h-[42px] transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Dashboard Admin</span>
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleAspirasiSubmit}
          className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Kirim Aspirasi atau Masukan Beta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Nama Pengirim
              </label>
              <input
                type="text"
                required
                maxLength={ASPIRATION_LIMITS.senderNameMax}
                value={aspirasiSenderName}
                onChange={(e) => setAspirasiSenderName(e.target.value)}
                placeholder="Nama Anda atau Anonim"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Asal Wijk / Keterangan
              </label>
              <input
                type="text"
                required
                maxLength={ASPIRATION_LIMITS.weykMax}
                value={aspirasiWeyk}
                onChange={(e) => setAspirasiWeyk(e.target.value)}
                placeholder="Wijk Parserahan"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Kategori
            </label>
            <select
              value={aspirasiSubject}
              onChange={(e) => setAspirasiSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
            >
              <option>Masukan Aplikasi Beta</option>
              <option>Pokok Doa Keluarga</option>
              <option>Saran Pelayanan Ibadah</option>
              <option>Kunjungan Diakonia / Orang Sakit</option>
              <option>Usulan Kegiatan Pemuda & Anak</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pesan untuk Admin Utama / Parhalado HKBP Jatisampurna Wijk Parserahan
              </label>
              <span className="text-[11px] font-mono-nums text-slate-400">
                {aspirasiMsg.length}/{ASPIRATION_LIMITS.messageMax}
              </span>
            </div>
            <textarea
              rows={4}
              required
              minLength={ASPIRATION_LIMITS.messageMin}
              maxLength={ASPIRATION_LIMITS.messageMax}
              value={aspirasiMsg}
              onChange={(e) => setAspirasiMsg(e.target.value)}
              placeholder="Tuliskan masukan aplikasi beta, pokok doa, atau saran pelayanan Anda..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {aspirasiError && (
            <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {aspirasiError}
            </p>
          )}
          {aspirasiSuccess && (
            <p className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
              {aspirasiSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={aspirasiSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#0D47A1] text-white text-sm font-bold hover:bg-[#1565C0] disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{aspirasiSubmitting ? 'Mengirim ke Server...' : 'Kirim Aspirasi'}</span>
          </button>
        </form>

        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Tersimpan Terpusat untuk Admin Utama
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Seluruh masukan beta dan aspirasi yang Anda kirim akan langsung tersimpan ke database
              terpusat gereja untuk ditinjau oleh Admin Utama (Ketua). Demi privasi jemaat, daftar
              lengkap seluruh aspirasi hanya dapat dilihat melalui Dashboard Admin.
            </p>
          </div>

          {aspirasiList.map((item) => (
            <div key={item.id} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-[#0D47A1] dark:text-blue-400">
                  Terkirim · {item.status}
                </span>
                <span>Baru saja</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.subject}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dari: {item.senderName} ({item.weyk})
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
