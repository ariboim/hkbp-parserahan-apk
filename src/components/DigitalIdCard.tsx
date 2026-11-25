import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, Maximize2, ShieldCheck, X } from 'lucide-react';
import { CardTheme, UserProfile } from '../types';

interface DigitalIdCardProps {
  profile: UserProfile;
  theme: CardTheme;
  onChangeTheme: (theme: CardTheme) => void;
}

function generateQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      hash ^= r * 31 + c * 17;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (hash >>> 0) % 2 === 0;
    }
  }
  return matrix;
}

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({
  profile,
  theme,
  onChangeTheme,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);

  const qrMatrix = useMemo(
    () => generateQrMatrix(`${profile.memberId}:${profile.email}`),
    [profile.email, profile.memberId]
  );

  const themeClasses: Record<CardTheme, { wrapper: string; sub: string; badge: string; divider: string; button: string }> = {
    default: {
      wrapper: 'bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#0A2E6E] text-white border border-blue-400/30',
      sub: 'text-blue-100',
      badge: 'bg-white/15 text-white border border-white/25',
      divider: 'border-white/15',
      button: 'bg-white/15 hover:bg-white/25 text-white',
    },
    dark: {
      wrapper: 'bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 text-slate-100 border border-slate-700',
      sub: 'text-slate-300',
      badge: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
      divider: 'border-slate-700/80',
      button: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
    },
    girly: {
      wrapper: 'bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700 text-white border border-pink-300/40',
      sub: 'text-rose-100',
      badge: 'bg-white/20 text-white border border-white/30',
      divider: 'border-white/20',
      button: 'bg-white/20 hover:bg-white/30 text-white',
    },
  };

  const style = themeClasses[theme];

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profile.memberId).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCard = () => {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="380" viewBox="0 0 640 380">
        <rect width="640" height="380" rx="24" fill="${theme === 'dark' ? '#0f172a' : theme === 'girly' ? '#e11d48' : '#0D47A1'}"/>
        <text x="36" y="54" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">HURIA KRISTEN BATAK PROTESTAN</text>
        <text x="36" y="78" fill="#dbeafe" font-family="sans-serif" font-size="13">Kartu Identitas Digital · HKBP Jatisampurna Wijk Parserahan</text>
        <text x="36" y="150" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">${profile.name}</text>
        <text x="36" y="182" fill="#e2e8f0" font-family="sans-serif" font-size="14">${profile.role} · ${profile.weyk}</text>
        <text x="36" y="250" fill="#cbd5e1" font-family="sans-serif" font-size="13">Email: ${profile.email}</text>
        <text x="36" y="280" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ID: ${profile.memberId}</text>
        <text x="36" y="334" fill="#93c5fd" font-family="sans-serif" font-size="12">Status: ${profile.status} · Terverifikasi</text>
      </svg>
    `.trim();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kartu-HKBP-${profile.memberId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadNote('Kartu berhasil diunduh');
    window.setTimeout(() => setDownloadNote(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Theme Selector */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Kartu Identitas Digital
        </h3>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
          {([
            { id: 'default', label: 'Default' },
            { id: 'dark', label: 'Dark' },
            { id: 'girly', label: 'Girly' },
          ] as { id: CardTheme; label: string }[]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTheme(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[34px] whitespace-nowrap ${
                theme === opt.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Membership Card */}
      <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-lg transition-colors duration-200 ${style.wrapper}`}>
        {/* Top Crest Header */}
        <div className={`flex items-start justify-between gap-3 pb-4 border-b ${style.divider}`}>
          <div>
            <p className="text-[11px] font-bold tracking-wider opacity-90">
              HURIA KRISTEN BATAK PROTESTAN
            </p>
            <p className={`text-xs mt-0.5 ${style.sub}`}>
              Kartu Identitas Digital · HKBP Jatisampurna Wijk Parserahan
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 font-display font-extrabold text-sm">
            ✝
          </div>
        </div>

        {/* Identity Body + QR */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-2xl object-cover object-top shrink-0 shadow-inner border-2 border-white/80 bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white text-[#0D47A1] font-display font-extrabold text-xl flex items-center justify-center shrink-0 shadow-inner">
                {profile.initials}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-lg font-bold tracking-tight truncate">
                {profile.name}
              </h4>
              <p className={`text-xs mt-0.5 ${style.sub}`}>
                {profile.role} · {profile.weyk}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${style.badge}`}>
                  {profile.status}
                </span>
                {profile.verified && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${style.badge}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Terverifikasi</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Verification */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            title="Perbesar QR Verifikasi"
            className="self-start sm:self-center bg-white p-2 rounded-2xl shadow-md hover:scale-[1.03] transition-transform shrink-0"
          >
            <svg viewBox="0 0 21 21" className="w-20 h-20" shapeRendering="crispEdges">
              <rect width="21" height="21" fill="#ffffff" />
              {qrMatrix.map((row, r) =>
                row.map((cell, c) =>
                  cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
                )
              )}
            </svg>
          </button>
        </div>

        {/* Metadata Info */}
        <div className={`mt-5 pt-4 border-t ${style.divider} grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs`}>
          <div>
            <span className={`block opacity-75 ${style.sub}`}>Email Jemaat</span>
            <span className="font-medium break-all">{profile.email}</span>
          </div>
          <div>
            <span className={`block opacity-75 ${style.sub}`}>ID Unik Anggota</span>
            <span className="font-mono-nums font-bold tracking-wide">{profile.memberId}</span>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyId}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${style.button}`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'ID Disalin' : 'Salin ID'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${style.button}`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>QR Verifikasi</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCard}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${style.button}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadNote || 'Simpan Kartu'}</span>
          </button>
        </div>
      </div>

      {/* Enlarged QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white text-left">
                QR Verifikasi HKBP Jatisampurna Wijk Parserahan
              </h4>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="inline-block bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <svg viewBox="0 0 21 21" className="w-48 h-48" shapeRendering="crispEdges">
                <rect width="21" height="21" fill="#ffffff" />
                {qrMatrix.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
                  )
                )}
              </svg>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{profile.name}</p>
            <p className="text-xs font-mono-nums text-slate-500 dark:text-slate-400 mt-1">{profile.memberId}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">
              Pindai QR ini pada petugas penyambut jemaat untuk absensi ibadah atau verifikasi keanggotaan HKBP Jatisampurna Wijk Parserahan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
