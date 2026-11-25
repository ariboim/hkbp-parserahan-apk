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
  Users,
} from 'lucide-react';
import { ASSETS } from '../data/mockData';
import { SubView, UserProfile } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface ServicesViewsProps {
  view: Extract<
    SubView,
    'almanak' | 'pengajaran' | 'media' | 'organisasi' | 'absensi' | 'donasi' | 'event' | 'aspirasi'
  >;
  profile: UserProfile;
}

export const ServicesViews: React.FC<ServicesViewsProps> = ({ view, profile }) => {
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

  // Aspirasi state
  const [aspirasiSubject, setAspirasiSubject] = useState('Pokok Doa Keluarga');
  const [aspirasiMsg, setAspirasiMsg] = useState('');
  const [aspirasiList, setAspirasiList] = useState([
    {
      id: 'asp-1',
      subject: 'Usulan Jadwal Koor Gabungan',
      message: 'Mohon dipertimbangkan latihan koor gabungan menjelang Minggu Advent di HKBP Jatisampurna Wijk Parserahan.',
      status: 'Diterima Parhalado',
      date: '20 Nov 2026',
    },
  ]);

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
    const groups = [
      { name: 'Ketua Wijk / Pengurus Utama', lead: 'Roberth Simatupang (Admin Utama)', schedule: 'Koordinasi Rutin Wijk Parserahan', members: 'Admin Utama (Ketua)' },
      { name: 'Punguan Ina & Parompuan', lead: 'Ny. St. Siregar br. Hutabarat', schedule: 'Jumat · 16.00 WIB', members: '84 Anggota' },
      { name: 'Punguan Ama HKBP Jatisampurna Wijk Parserahan', lead: 'St. M. Panggabean', schedule: 'Sabtu · 19.30 WIB', members: '62 Anggota' },
      { name: 'Naposobulung (NHKBP) & Remaja', lead: 'Kevin Sitorus', schedule: 'Sabtu · 17.00 WIB', members: '75 Pemuda' },
      { name: 'Seksi Sekolah Minggu', lead: 'Ribka br. Simatupang', schedule: 'Minggu · 08.00 WIB', members: '110 Anak' },
    ];
    return (
      <div className="space-y-5 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-800 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-violet-100 text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span>Struktur Dewan & Kategorial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Organisasi HKBP Jatisampurna Wijk Parserahan</h1>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g, idx) => (
            <div key={idx} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{g.name}</h2>
                <span className="text-xs font-mono-nums font-semibold text-violet-700 dark:text-violet-300">
                  {g.members}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">Koordinator: {g.lead}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Jadwal: {g.schedule}</p>
            </div>
          ))}
        </div>
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

  // Aspirasi
  const handleAspirasiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspirasiMsg.trim()) return;
    setAspirasiList((prev) => [
      {
        id: `asp-${Date.now()}`,
        subject: aspirasiSubject,
        message: aspirasiMsg.trim(),
        status: 'Terkirim ke Parhalado',
        date: 'Hari ini',
      },
      ...prev,
    ]);
    setAspirasiMsg('');
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl bg-gradient-to-br from-[#0D47A1] to-indigo-800 text-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
          <MessageSquareHeart className="w-4 h-4" />
          <span>Suara Jemaat & Pokok Doa</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Aspirasi Jemaat</h1>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleAspirasiSubmit}
          className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Kirim Aspirasi atau Pokok Doa
          </h2>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Kategori
            </label>
            <select
              value={aspirasiSubject}
              onChange={(e) => setAspirasiSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
            >
              <option>Pokok Doa Keluarga</option>
              <option>Saran Pelayanan Ibadah</option>
              <option>Kunjungan Diakonia / Orang Sakit</option>
              <option>Usulan Kegiatan Pemuda & Anak</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Pesan untuk Parhalado HKBP Jatisampurna Wijk Parserahan
            </label>
            <textarea
              rows={4}
              required
              value={aspirasiMsg}
              onChange={(e) => setAspirasiMsg(e.target.value)}
              placeholder="Tuliskan pokok doa atau masukan Anda..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#0D47A1] text-white text-sm font-bold hover:bg-[#1565C0]"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Aspirasi</span>
          </button>
        </form>

        <div className="lg:col-span-6 space-y-3">
          {aspirasiList.map((item) => (
            <div key={item.id} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-[#0D47A1] dark:text-blue-400">{item.status}</span>
                <span>{item.date}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.subject}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
