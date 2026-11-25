import React, { useMemo, useState } from 'react';
import { Clock, LocateFixed, Map as MapIcon, MapPin, Minus, Navigation, Phone, Plus, Search, User } from 'lucide-react';
import { CHURCH_LOCATIONS } from '../data/mockData';
import { ChurchLocation } from '../types';

type MapStyle = 'Peta' | 'Satelit' | 'Earth' | 'Terrain';

export const CariGerejaView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'peta' | 'daftar'>('peta');
  const [mapStyle, setMapStyle] = useState<MapStyle>('Peta');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<ChurchLocation>(CHURCH_LOCATIONS[0]);
  const [zoom, setZoom] = useState(1);
  const [userLocated, setUserLocated] = useState(false);
  const [locStatus, setLocStatus] = useState<string | null>(null);

  const filteredChurches = useMemo(() => {
    if (!searchQuery.trim()) return CHURCH_LOCATIONS;
    const q = searchQuery.toLowerCase();
    return CHURCH_LOCATIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ressort.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleLocateMe = () => {
    setLocStatus('Mencari lokasi Anda...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setUserLocated(true);
          setSelectedChurch(CHURCH_LOCATIONS[0]);
          setLocStatus('Lokasi terdeteksi di sekitar Balige / Parserahan');
          window.setTimeout(() => setLocStatus(null), 3000);
        },
        () => {
          setUserLocated(true);
          setSelectedChurch(CHURCH_LOCATIONS[0]);
          setLocStatus('Menampilkan titik referensi HKBP Parserahan');
          window.setTimeout(() => setLocStatus(null), 3000);
        },
        { timeout: 3500 }
      );
    } else {
      setUserLocated(true);
      setLocStatus('Menampilkan area Parserahan');
      window.setTimeout(() => setLocStatus(null), 2500);
    }
  };

  const mapBackgroundClass: Record<MapStyle, string> = {
    Peta: 'bg-[#e8eff7] dark:bg-slate-800',
    Satelit: 'bg-[#102533] text-white',
    Earth: 'bg-[#1b362b] text-white',
    Terrain: 'bg-[#e9ede2] dark:bg-stone-800',
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Search + Mode Toggle Bar */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari gereja, ressort, atau alamat HKBP..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('peta')}
              className={`px-4 py-2 rounded-lg text-xs font-bold min-h-[38px] transition-colors ${
                viewMode === 'peta'
                  ? 'bg-[#0D47A1] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Peta
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daftar')}
              className={`px-4 py-2 rounded-lg text-xs font-bold min-h-[38px] transition-colors ${
                viewMode === 'daftar'
                  ? 'bg-[#0D47A1] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Daftar ({filteredChurches.length})
            </button>
          </div>
        </div>

        {/* Map Layer Filter */}
        {viewMode === 'peta' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
              {(['Peta', 'Satelit', 'Earth', 'Terrain'] as MapStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setMapStyle(style)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[34px] whitespace-nowrap transition-colors ${
                    mapStyle === style
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLocateMe}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0D47A1] dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 min-h-[38px]"
            >
              <LocateFixed className="w-4 h-4" />
              <span>Lokasi Saya</span>
            </button>
          </div>
        )}

        {locStatus && (
          <p className="text-xs font-medium text-[#0D47A1] dark:text-blue-400">{locStatus}</p>
        )}
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {viewMode === 'peta' ? (
          <div className="lg:col-span-7 relative h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Interactive Stylized Map Surface */}
            <div
              className={`w-full h-full relative transition-transform duration-300 ${mapBackgroundClass[mapStyle]}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
              {/* Stylized Lake Toba & Road Grid SVG */}
              <svg
                viewBox="0 0 800 500"
                className="w-full h-full opacity-75 pointer-events-none"
                preserveAspectRatio="none"
              >
                {/* Lake contour */}
                <path
                  d="M0,120 Q160,150 280,90 T580,80 L800,40 L800,0 L0,0 Z"
                  fill={mapStyle === 'Satelit' || mapStyle === 'Earth' ? '#0c4a6e' : '#bae6fd'}
                  opacity="0.7"
                />
                {/* Terrain contours */}
                {mapStyle === 'Terrain' && (
                  <g fill="none" stroke="#a8a29e" strokeWidth="1" opacity="0.5">
                    <ellipse cx="520" cy="340" rx="190" ry="95" />
                    <ellipse cx="520" cy="340" rx="130" ry="60" />
                    <ellipse cx="180" cy="380" rx="140" ry="70" />
                  </g>
                )}
                {/* Roads */}
                <path
                  d="M40,340 Q260,260 440,250 T780,290"
                  fill="none"
                  stroke={mapStyle === 'Satelit' || mapStyle === 'Earth' ? '#fde68a' : '#ffffff'}
                  strokeWidth="6"
                />
                <path
                  d="M360,90 L385,480"
                  fill="none"
                  stroke={mapStyle === 'Satelit' || mapStyle === 'Earth' ? '#94a3b8' : '#ffffff'}
                  strokeWidth="4"
                />
                <path
                  d="M150,200 L640,410"
                  fill="none"
                  stroke={mapStyle === 'Satelit' || mapStyle === 'Earth' ? '#64748b' : '#cbd5e1'}
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
              </svg>

              {/* Map Area Labels */}
              <span
                className={`absolute top-4 left-4 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                  mapStyle === 'Satelit' || mapStyle === 'Earth'
                    ? 'bg-black/45 text-sky-200'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                Kawasan Balige · Parserahan ({mapStyle})
              </span>

              {/* User Location Pin */}
              {userLocated && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                  style={{ left: '44%', top: '50%' }}
                >
                  <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-md" />
                  <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-semibold whitespace-nowrap">
                    Posisi Anda
                  </span>
                </div>
              )}

              {/* Numbered Church Pins */}
              {filteredChurches.map((church) => {
                const isSelected = selectedChurch.id === church.id;
                return (
                  <button
                    key={church.id}
                    type="button"
                    onClick={() => setSelectedChurch(church)}
                    style={{ left: `${church.mapX}%`, top: `${church.mapY}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group transition-transform ${
                      isSelected ? 'scale-115 z-30' : 'hover:scale-105'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-full font-mono-nums text-xs font-extrabold flex items-center justify-center shadow-lg border-2 border-white transition-colors ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : church.isHomeChurch
                          ? 'bg-[#0D47A1] text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {church.number}
                    </span>
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs whitespace-nowrap ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-white/95 text-slate-900'
                      }`}
                    >
                      {church.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5">
              <button
                type="button"
                aria-label="Perbesar peta"
                onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Perkecil peta"
                onClick={() => setZoom((z) => Math.max(0.9, Number((z - 0.15).toFixed(2))))}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="lg:col-span-7 space-y-2.5">
            {filteredChurches.map((church) => {
              const isSelected = selectedChurch.id === church.id;
              return (
                <button
                  key={church.id}
                  type="button"
                  onClick={() => setSelectedChurch(church)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border-[#0D47A1]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#0D47A1] text-white font-mono-nums text-xs font-bold flex items-center justify-center shrink-0">
                      {church.number}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {church.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {church.ressort} · {church.distrik}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {church.address}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-nums text-xs font-bold text-[#0D47A1] dark:text-blue-400 shrink-0">
                    {church.distanceKm} km
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Church Detail Panel */}
        <aside className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#0D47A1] dark:text-blue-400">
                Pin #{selectedChurch.number} · {selectedChurch.ressort}
              </p>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {selectedChurch.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedChurch.distrik}</p>
            </div>
            <span className="font-mono-nums text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0">
              {selectedChurch.distanceKm} km
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#0D47A1] dark:text-blue-400 shrink-0 mt-0.5" />
              <span>{selectedChurch.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-[#0D47A1] dark:text-blue-400 shrink-0" />
              <span>{selectedChurch.pastor}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#0D47A1] dark:text-blue-400 shrink-0" />
              <span className="font-mono-nums">{selectedChurch.phone}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Clock className="w-3.5 h-3.5 text-[#0D47A1] dark:text-blue-400" />
              <span>Jadwal Kebaktian</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {selectedChurch.schedules.map((sch, idx) => (
                <li key={idx}>• {sch}</li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedChurch.lat},${selectedChurch.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#1565C0] min-h-[44px]"
            >
              <Navigation className="w-4 h-4" />
              <span>Petunjuk Arah</span>
            </a>
            {viewMode === 'daftar' && (
              <button
                type="button"
                onClick={() => setViewMode('peta')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[44px]"
              >
                <MapIcon className="w-4 h-4" />
                <span>Lihat di Peta</span>
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
