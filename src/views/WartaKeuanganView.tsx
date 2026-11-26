import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Search,
  Wallet,
} from 'lucide-react';
import { DUMMY_WARTA_KEUANGAN } from '../data/mockData';
import { WartaKeuanganEntry, WartaKeuanganReport } from '../types';
import { ChurchLogo } from '../components/ChurchLogo';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsvCell(val: string | number): string {
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ComputedEntry extends WartaKeuanganEntry {
  runningBalance: number;
}

function computeReportSummary(report: WartaKeuanganReport) {
  let balance = report.openingBalance;
  let totalIn = 0;
  let totalOut = 0;

  const computedEntries: ComputedEntry[] = report.entries.map((entry) => {
    if (entry.type === 'masuk') {
      totalIn += entry.amount;
      balance += entry.amount;
    } else {
      totalOut += entry.amount;
      balance -= entry.amount;
    }
    return {
      ...entry,
      runningBalance: balance,
    };
  });

  return {
    totalIn,
    totalOut,
    closingBalance: balance,
    computedEntries,
  };
}

function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export const WartaKeuanganView: React.FC = () => {
  const [selectedReportId, setSelectedReportId] = useState<string>(DUMMY_WARTA_KEUANGAN[0].id);
  const [typeFilter, setTypeFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const activeReport = useMemo(
    () =>
      DUMMY_WARTA_KEUANGAN.find((item) => item.id === selectedReportId) || DUMMY_WARTA_KEUANGAN[0],
    [selectedReportId]
  );

  const summary = useMemo(() => computeReportSummary(activeReport), [activeReport]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return summary.computedEntries.filter((item) => {
      if (typeFilter !== 'semua' && item.type !== typeFilter) return false;
      if (!q) return true;
      return (
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, summary.computedEntries, typeFilter]);

  const showToast = (msg: string) => {
    setDownloadFeedback(msg);
    window.setTimeout(() => setDownloadFeedback(null), 3200);
  };

  const fileSlug = activeReport.id.replace(/[^a-z0-9-]/gi, '_');

  const handleDownloadExcel = () => {
    const rows: (string | number)[][] = [
      ['HKBP JATISAMPURNA WIJK PARSERAHAN'],
      [`[${activeReport.sampleLabel} - DATA SIMULASI] WARTA KEUANGAN WIJK`],
      [`Periode: ${activeReport.periodLabel} (${activeReport.dateRange})`],
      [`Ketua Wijk: ${activeReport.chairName} | Bendahara: ${activeReport.treasurerName}`],
      [],
      ['RINGKASAN KAS WIJK (CONTOH)'],
      ['Saldo Awal Kas', activeReport.openingBalance],
      ['Total Pemasukan', summary.totalIn],
      ['Total Pengeluaran', summary.totalOut],
      ['Saldo Akhir Kas', summary.closingBalance],
      [],
      [
        'No',
        'Tanggal',
        'Kategori',
        'Uraian Transaksi',
        'Pemasukan (Rp)',
        'Pengeluaran (Rp)',
        'Saldo Berjalan (Rp)',
        'Keterangan',
      ],
      ...summary.computedEntries.map((entry, idx) => [
        idx + 1,
        entry.date,
        entry.category,
        entry.description,
        entry.type === 'masuk' ? entry.amount : 0,
        entry.type === 'keluar' ? entry.amount : 0,
        entry.runningBalance,
        entry.notes || activeReport.sampleLabel,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 28 },
      { wch: 48 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 30 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Warta Keuangan (CONTOH)');
    const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbOut], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerFileDownload(blob, `CONTOH_Warta_Keuangan_${fileSlug}.xlsx`);
    showToast('File Excel Warta Keuangan (.xlsx) berhasil diunduh.');
  };

  const handleDownloadCsv = () => {
    const headerLines = [
      `"HKBP JATISAMPURNA WIJK PARSERAHAN — [${activeReport.sampleLabel}] WARTA KEUANGAN WIJK"`,
      `"Periode: ${activeReport.periodLabel} (${activeReport.dateRange})"`,
      `"Saldo Awal: ${formatRupiah(activeReport.openingBalance)} | Total Pemasukan: ${formatRupiah(summary.totalIn)} | Total Pengeluaran: ${formatRupiah(summary.totalOut)} | Saldo Akhir: ${formatRupiah(summary.closingBalance)}"`,
      '',
      'No,Tanggal,Kategori,Uraian Transaksi,Jenis,Jumlah (Rp),Saldo Berjalan (Rp),Keterangan',
    ];

    const bodyLines = summary.computedEntries.map((entry, idx) =>
      [
        idx + 1,
        escapeCsvCell(entry.date),
        escapeCsvCell(entry.category),
        escapeCsvCell(entry.description),
        entry.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        entry.amount,
        entry.runningBalance,
        escapeCsvCell(entry.notes || activeReport.sampleLabel),
      ].join(',')
    );

    const csvContent = '\uFEFF' + [...headerLines, ...bodyLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `CONTOH_Warta_Keuangan_${fileSlug}.csv`);
    showToast('File CSV Warta Keuangan (.csv) berhasil diunduh.');
  };

  const handleDownloadDocumentHtml = () => {
    const rowsHtml = summary.computedEntries
      .map(
        (entry, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>${escapeHtml(entry.date)}</td>
            <td>${escapeHtml(entry.category)}</td>
            <td>
              <strong>${escapeHtml(entry.description)}</strong>
              ${entry.notes ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(entry.notes)}</div>` : ''}
            </td>
            <td style="text-align:right;color:#047857;font-variant-numeric:tabular-nums;">${
              entry.type === 'masuk' ? formatRupiah(entry.amount) : '-'
            }</td>
            <td style="text-align:right;color:#be123c;font-variant-numeric:tabular-nums;">${
              entry.type === 'keluar' ? formatRupiah(entry.amount) : '-'
            }</td>
            <td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">${formatRupiah(
              entry.runningBalance
            )}</td>
          </tr>
        `
      )
      .join('');

    const htmlDoc = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>CONTOH Warta Keuangan Wijk Parserahan - ${escapeHtml(activeReport.periodLabel)}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 32px; background: #fff; }
    .header { border-bottom: 3px solid #0F276D; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .sample-stamp { border: 2px solid #b45309; color: #92400e; background: #fef3c7; padding: 6px 12px; font-weight: 800; font-size: 12px; letter-spacing: 0.08em; border-radius: 6px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
    .card-label { font-size: 11px; color: #475569; margin-bottom: 4px; }
    .card-value { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #0F276D; color: #fff; text-align: left; padding: 10px 8px; font-size: 12px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 9px 8px; vertical-align: top; }
    .sign { display: flex; justify-content: space-between; margin-top: 36px; font-size: 13px; }
    .sign-box { text-align: center; width: 240px; }
    .sign-space { height: 58px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:12px;font-weight:700;color:#0F276D;">HURIA KRISTEN BATAK PROTESTAN · RESSORT JATISAMPURNA</div>
      <h1 style="margin:4px 0;font-size:20px;">WARTA KEUANGAN WIJK PARSERAHAN</h1>
      <div style="font-size:13px;color:#475569;">${escapeHtml(activeReport.periodLabel)} (${escapeHtml(activeReport.dateRange)})</div>
    </div>
    <div class="sample-stamp">LABEL: ${escapeHtml(activeReport.sampleLabel)} (DATA DUMMY)</div>
  </div>

  <div class="summary">
    <div class="card"><div class="card-label">Saldo Awal Kas</div><div class="card-value">${formatRupiah(activeReport.openingBalance)}</div></div>
    <div class="card"><div class="card-label">Total Pemasukan</div><div class="card-value" style="color:#047857;">${formatRupiah(summary.totalIn)}</div></div>
    <div class="card"><div class="card-label">Total Pengeluaran</div><div class="card-value" style="color:#be123c;">${formatRupiah(summary.totalOut)}</div></div>
    <div class="card" style="background:#eff6ff;border-color:#93c5fd;"><div class="card-label">Saldo Akhir Kas</div><div class="card-value" style="color:#0F276D;">${formatRupiah(summary.closingBalance)}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center;">No</th>
        <th style="width:92px;">Tanggal</th>
        <th style="width:155px;">Kategori</th>
        <th>Uraian Transaksi</th>
        <th style="width:120px;text-align:right;">Pemasukan</th>
        <th style="width:120px;text-align:right;">Pengeluaran</th>
        <th style="width:130px;text-align:right;">Saldo</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="sign">
    <div class="sign-box">
      <div>Mengetahui, Ketua Wijk Parserahan</div>
      <div class="sign-space"></div>
      <strong>${escapeHtml(activeReport.chairName)}</strong>
    </div>
    <div class="sign-box">
      <div>Disusun oleh, Bendahara Wijk</div>
      <div class="sign-space"></div>
      <strong>${escapeHtml(activeReport.treasurerName)}</strong>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    triggerFileDownload(blob, `CONTOH_Dokumen_Warta_Keuangan_${fileSlug}.html`);
    showToast('Dokumen Warta Siap Cetak (.html) berhasil diunduh.');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Royal Blue Header Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#081C54] via-[#0F3184] to-[#1565C0] text-white p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <ChurchLogo size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-amber-300">
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>Transparansi Kas Wijk</span>
                </span>
                <span className="text-blue-200/70" aria-hidden="true">·</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-extrabold tracking-wide text-[11px]">
                  {activeReport.sampleLabel} · DATA DUMMY
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold mt-1 leading-snug">
                Warta Keuangan Wijk Parserahan
              </h1>
              <p className="text-xs text-blue-100/90 mt-1">
                Bendahara: {activeReport.treasurerName} · Ketua Wijk: {activeReport.chairName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-[#0F276D] hover:bg-blue-50 text-xs font-extrabold min-h-[42px] shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold min-h-[42px] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDocumentHtml}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold min-h-[42px] transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Dokumen Cetak</span>
            </button>
          </div>
        </div>
      </section>

      {/* Download Toast Feedback */}
      {downloadFeedback && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{downloadFeedback}</span>
        </div>
      )}

      {/* Explicit CONTOH Notice */}
      <section className="rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 p-4 sm:p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed space-y-1">
          <p className="font-extrabold text-amber-900 dark:text-amber-200">
            Status Dokumen: CONTOH (Simulasi Warta Keuangan Wijk)
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Seluruh angka dan rincian transaksi di bawah ini merupakan data <strong>CONTOH</strong>{' '}
            untuk memperlihatkan format pelaporan dan fitur pengunduhan Warta Keuangan HKBP
            Jatisampurna Wijk Parserahan oleh jemaat.
          </p>
        </div>
      </section>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-200/75 dark:bg-slate-800">
          {DUMMY_WARTA_KEUANGAN.map((rep) => {
            const active = rep.id === activeReport.id;
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedReportId(rep.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[38px] whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-[#0F276D] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {rep.periodLabel.split(' · ')[0]} · {rep.sampleLabel}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Periode: <strong className="text-slate-800 dark:text-slate-200">{activeReport.dateRange}</strong>
        </p>
      </div>

      {/* 4 Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Saldo Awal Kas ({activeReport.sampleLabel})
          </p>
          <p className="text-base sm:text-xl font-extrabold font-mono-nums text-slate-900 dark:text-white mt-1.5">
            {formatRupiah(activeReport.openingBalance)}
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Total Pemasukan</span>
          </p>
          <p className="text-base sm:text-xl font-extrabold font-mono-nums text-emerald-700 dark:text-emerald-400 mt-1.5">
            {formatRupiah(summary.totalIn)}
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Pengeluaran</span>
          </p>
          <p className="text-base sm:text-xl font-extrabold font-mono-nums text-rose-700 dark:text-rose-400 mt-1.5">
            {formatRupiah(summary.totalOut)}
          </p>
        </div>

        <div className="rounded-3xl bg-[#0F276D] text-white border border-blue-900 p-4 shadow-xs">
          <p className="text-xs text-blue-100 font-semibold">
            Saldo Akhir Kas ({activeReport.sampleLabel})
          </p>
          <p className="text-base sm:text-xl font-extrabold font-mono-nums text-amber-300 mt-1.5">
            {formatRupiah(summary.closingBalance)}
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
            {(
              [
                { id: 'semua', label: 'Semua' },
                { id: 'masuk', label: 'Pemasukan' },
                { id: 'keluar', label: 'Pengeluaran' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari uraian atau kategori..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
            />
          </div>
        </div>

        {/* Desktop Ledger Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5 w-28">Tanggal</th>
                <th className="py-3 px-3.5 w-44">Kategori</th>
                <th className="py-3 px-3.5">Uraian Transaksi (CONTOH)</th>
                <th className="py-3 px-3.5 text-right w-36">Pemasukan</th>
                <th className="py-3 px-3.5 text-right w-36">Pengeluaran</th>
                <th className="py-3 px-3.5 text-right w-40">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada transaksi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3.5 text-center font-mono-nums text-slate-500 dark:text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {entry.category}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                        {entry.description}
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono-nums font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {entry.type === 'masuk' ? formatRupiah(entry.amount) : '-'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono-nums font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                      {entry.type === 'keluar' ? formatRupiah(entry.amount) : '-'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono-nums font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatRupiah(entry.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Rows */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredEntries.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Tidak ada transaksi yang sesuai dengan filter pencarian.
            </p>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono-nums">{entry.date} · {entry.category}</span>
                  <span
                    className={`font-bold ${
                      entry.type === 'masuk'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {entry.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {entry.description}
                </p>
                {entry.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.notes}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className={`text-sm font-extrabold font-mono-nums ${
                      entry.type === 'masuk'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {entry.type === 'masuk' ? '+' : '-'}
                    {formatRupiah(entry.amount)}
                  </span>
                  <span className="text-xs font-mono-nums text-slate-600 dark:text-slate-300">
                    Saldo: <strong>{formatRupiah(entry.runningBalance)}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Official Sign-Off Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <span>Disusun oleh Bendahara Wijk: </span>
            <strong className="text-slate-900 dark:text-white">{activeReport.treasurerName}</strong>
          </div>
          <div>
            <span>Diketahui oleh Ketua Wijk: </span>
            <strong className="text-slate-900 dark:text-white">{activeReport.chairName}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};
