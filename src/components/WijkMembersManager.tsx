import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import {
  db,
  formatWhatsappUrl,
  handleFirestoreError,
  OperationType,
  WIJK_MEMBER_LIMITS,
} from '../firebase';
import { WijkMemberInput, WijkMemberRecord } from '../types';

interface WijkMembersManagerProps {
  isAdminAuthorized: boolean;
  onRequestAdminAuth?: () => void;
}

const EMPTY_FORM: WijkMemberInput = {
  rhjNumber: '',
  memberName: '',
  spouseName: '',
  childrenNames: '',
  address: '',
  whatsappNumber: '',
};

const TEMPLATE_HEADERS = [
  'Nomor Anggota RHJ',
  'Nama Anggota',
  'Nama Istri',
  'Nama Anak',
  'Alamat',
  'Nomor WA Aktif',
];

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeImportedCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\s+/g, ' ').trim();
}

function mapSpreadsheetRow(row: Record<string, unknown>): WijkMemberInput | null {
  const entries = Object.entries(row);
  if (entries.length === 0) return null;

  let rhjNumber = '';
  let memberName = '';
  let spouseName = '';
  let childrenNames = '';
  let address = '';
  let whatsappNumber = '';

  for (const [rawKey, rawVal] of entries) {
    const key = normalizeHeader(rawKey);
    const value = sanitizeImportedCell(rawVal);
    if (!key) continue;

    if (key === 'no' || key === 'nomor' || key === 'no urut' || key === 'nomor urut') {
      continue;
    }

    if (
      key.includes('rhj') ||
      key === 'nomor anggota' ||
      key === 'no anggota'
    ) {
      if (!rhjNumber) rhjNumber = value;
    } else if (key.includes('istri') || key.includes('pasangan')) {
      if (!spouseName) spouseName = value;
    } else if (key.includes('anak')) {
      if (!childrenNames) childrenNames = value;
    } else if (key.includes('alamat') || key.includes('domisili')) {
      if (!address) address = value;
    } else if (
      key.includes('wa') ||
      key.includes('whatsapp') ||
      key.includes('hp') ||
      key.includes('telp') ||
      key.includes('telepon')
    ) {
      if (!whatsappNumber) whatsappNumber = value;
    } else if (
      key === 'nama anggota' ||
      key === 'anggota' ||
      key === 'nama kepala keluarga' ||
      key === 'nama kk' ||
      key === 'nama'
    ) {
      if (!memberName) memberName = value;
    }
  }

  // Fallback positional mapping if headers weren't matched
  if (!rhjNumber && !memberName) {
    const vals = entries.map(([, v]) => sanitizeImportedCell(v));
    if (vals.length >= 6) {
      const offset = /^\d+$/.test(vals[0]) && vals.length >= 7 ? 1 : 0;
      rhjNumber = vals[offset] || '';
      memberName = vals[offset + 1] || '';
      spouseName = vals[offset + 2] || '';
      childrenNames = vals[offset + 3] || '';
      address = vals[offset + 4] || '';
      whatsappNumber = vals[offset + 5] || '';
    }
  }

  return {
    rhjNumber: rhjNumber.slice(0, WIJK_MEMBER_LIMITS.rhjNumberMax),
    memberName: memberName.slice(0, WIJK_MEMBER_LIMITS.memberNameMax),
    spouseName: spouseName.slice(0, WIJK_MEMBER_LIMITS.spouseNameMax),
    childrenNames: childrenNames.slice(0, WIJK_MEMBER_LIMITS.childrenNamesMax),
    address: address.slice(0, WIJK_MEMBER_LIMITS.addressMax),
    whatsappNumber: whatsappNumber.slice(0, WIJK_MEMBER_LIMITS.whatsappMax),
  };
}

function validateMemberInput(input: WijkMemberInput): string | null {
  if (input.rhjNumber.trim().length < WIJK_MEMBER_LIMITS.rhjNumberMin) {
    return 'Nomor Anggota RHJ wajib diisi.';
  }
  if (input.memberName.trim().length < WIJK_MEMBER_LIMITS.memberNameMin) {
    return 'Nama Anggota wajib diisi.';
  }
  if (input.address.trim().length < WIJK_MEMBER_LIMITS.addressMin) {
    return 'Alamat wajib diisi.';
  }
  if (input.whatsappNumber.trim().length < WIJK_MEMBER_LIMITS.whatsappMin) {
    return 'Nomor WA Aktif minimal 5 karakter.';
  }
  return null;
}

export const WijkMembersManager: React.FC<WijkMembersManagerProps> = ({
  isAdminAuthorized,
  onRequestAdminAuth,
}) => {
  const [members, setMembers] = useState<WijkMemberRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Add / Edit modal
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<WijkMemberRecord | null>(null);
  const [formData, setFormData] = useState<WijkMemberInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState<boolean>(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Upload CSV / XLS modal
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<
    { rowNumber: number; data: WijkMemberInput; error: string | null }[]
  >([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isAdminAuthorized) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'wijk_members'),
      (snapshot) => {
        const list: WijkMemberRecord[] = snapshot.docs
          .map((docSnap) => {
            const d = docSnap.data() as {
              rhjNumber?: string;
              memberName?: string;
              spouseName?: string;
              childrenNames?: string;
              address?: string;
              whatsappNumber?: string;
              createdAt?: Timestamp | null;
              updatedAt?: Timestamp | null;
            };
            return {
              id: docSnap.id,
              rhjNumber: d.rhjNumber || '-',
              memberName: d.memberName || '-',
              spouseName: d.spouseName || '',
              childrenNames: d.childrenNames || '',
              address: d.address || '-',
              whatsappNumber: d.whatsappNumber || '-',
              createdAtMs: d.createdAt ? d.createdAt.toMillis() : Date.now(),
              updatedAtMs: d.updatedAt ? d.updatedAt.toMillis() : Date.now(),
            };
          })
          .sort((a, b) => {
            if (a.createdAtMs !== b.createdAtMs) return a.createdAtMs - b.createdAtMs;
            return a.rhjNumber.localeCompare(b.rhjNumber, 'id');
          });
        setMembers(list);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'wijk_members');
      }
    );

    return () => unsub();
  }, [isAdminAuthorized]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.rhjNumber.toLowerCase().includes(q) ||
        m.memberName.toLowerCase().includes(q) ||
        m.spouseName.toLowerCase().includes(q) ||
        m.childrenNames.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        m.whatsappNumber.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const validParsedRows = useMemo(
    () => parsedRows.filter((r) => !r.error),
    [parsedRows]
  );

  const showTempBanner = (text: string) => {
    setStatusBanner(text);
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev === text ? null : prev));
    }, 3500);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (member: WijkMemberRecord) => {
    setEditingMember(member);
    setFormData({
      rhjNumber: member.rhjNumber,
      memberName: member.memberName,
      spouseName: member.spouseName,
      childrenNames: member.childrenNames,
      address: member.address,
      whatsappNumber: member.whatsappNumber,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleaned: WijkMemberInput = {
      rhjNumber: formData.rhjNumber.trim().slice(0, WIJK_MEMBER_LIMITS.rhjNumberMax),
      memberName: formData.memberName.trim().slice(0, WIJK_MEMBER_LIMITS.memberNameMax),
      spouseName: formData.spouseName.trim().slice(0, WIJK_MEMBER_LIMITS.spouseNameMax),
      childrenNames: formData.childrenNames.trim().slice(0, WIJK_MEMBER_LIMITS.childrenNamesMax),
      address: formData.address.trim().slice(0, WIJK_MEMBER_LIMITS.addressMax),
      whatsappNumber: formData.whatsappNumber.trim().slice(0, WIJK_MEMBER_LIMITS.whatsappMax),
    };

    const validationErr = validateMemberInput(cleaned);
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    setSavingForm(true);
    try {
      if (editingMember) {
        const docPath = `wijk_members/${editingMember.id}`;
        try {
          await updateDoc(doc(db, 'wijk_members', editingMember.id), {
            ...cleaned,
            updatedAt: serverTimestamp(),
          });
          setFormOpen(false);
          showTempBanner(`Data anggota "${cleaned.memberName}" berhasil diperbarui.`);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        }
      } else {
        const memberId = `mbr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const docPath = `wijk_members/${memberId}`;
        try {
          await setDoc(doc(db, 'wijk_members', memberId), {
            ...cleaned,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setFormOpen(false);
          showTempBanner(`Anggota "${cleaned.memberName}" berhasil ditambahkan.`);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        }
      }
    } catch {
      setFormError('Gagal menyimpan data anggota. Pastikan akses Admin aktif.');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeleteMember = async (member: WijkMemberRecord) => {
    const docPath = `wijk_members/${member.id}`;
    try {
      await deleteDoc(doc(db, 'wijk_members', member.id));
      setConfirmDeleteId(null);
      showTempBanner(`Data "${member.memberName}" telah dihapus.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 24 },
      { wch: 24 },
      { wch: 28 },
      { wch: 32 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Anggota');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'template_anggota_wijk_parserahan.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, 'template_anggota_wijk_parserahan.xlsx', { bookType: 'xlsx' });
    }
  };

  const handleExportExcel = () => {
    const rows = members.map((m, idx) => ({
      No: idx + 1,
      'Nomor Anggota RHJ': m.rhjNumber,
      'Nama Anggota': m.memberName,
      'Nama Istri': m.spouseName,
      'Nama Anak': m.childrenNames,
      Alamat: m.address,
      'Nomor WA Aktif': m.whatsappNumber,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anggota Wijk Parserahan');
    XLSX.writeFile(wb, 'daftar_anggota_wijk_parserahan.xlsx');
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setParsedRows([]);
    setUploadFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      setUploadError('Format file harus .csv, .xls, atau .xlsx.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setUploadError('File tidak memiliki lembar kerja (sheet) yang dapat dibaca.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      });

      if (rawJson.length === 0) {
        setUploadError('File kosong atau hanya berisi judul kolom tanpa baris data.');
        return;
      }

      const mapped = rawJson
        .map((row, idx) => {
          const parsed = mapSpreadsheetRow(row);
          if (!parsed) return null;
          // Skip completely blank lines
          if (
            !parsed.rhjNumber &&
            !parsed.memberName &&
            !parsed.spouseName &&
            !parsed.childrenNames &&
            !parsed.address &&
            !parsed.whatsappNumber
          ) {
            return null;
          }
          return {
            rowNumber: idx + 2,
            data: parsed,
            error: validateMemberInput(parsed),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (mapped.length === 0) {
        setUploadError('Tidak ada baris data anggota yang ditemukan di dalam file.');
        return;
      }

      setParsedRows(mapped);
    } catch {
      setUploadError('Gagal membaca file CSV/Excel. Pastikan format kolom sesuai template.');
    }
  };

  const handleConfirmUpload = async () => {
    if (validParsedRows.length === 0) return;
    setImporting(true);
    setUploadError(null);

    try {
      const chunkSize = 400;
      const baseTime = Date.now();
      let importedCount = 0;

      for (let start = 0; start < validParsedRows.length; start += chunkSize) {
        const chunk = validParsedRows.slice(start, start + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach((row, offset) => {
          const memberId = `mbr_${baseTime}_${start + offset}_${Math.random()
            .toString(36)
            .slice(2, 7)}`;
          const ref = doc(db, 'wijk_members', memberId);
          batch.set(ref, {
            ...row.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
        importedCount += chunk.length;
      }

      setUploadOpen(false);
      setParsedRows([]);
      setUploadFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showTempBanner(`${importedCount} anggota berhasil diunggah ke daftar Wijk Parserahan.`);
    } catch (error) {
      setUploadError('Gagal mengunggah daftar anggota ke Firestore.');
      handleFirestoreError(error, OperationType.WRITE, 'wijk_members');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Toolbar */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0D47A1] dark:text-blue-400" />
              <span>Daftar Anggota HKBP Jatisampurna Wijk Parserahan</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total terdaftar:{' '}
              <span className="font-mono-nums font-bold text-slate-800 dark:text-slate-200">
                {members.length}
              </span>{' '}
              kepala keluarga / anggota
            </p>
          </div>

          {isAdminAuthorized && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-bold min-h-[42px] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Anggota</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  setParsedRows([]);
                  setUploadFileName('');
                  setUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[42px] transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload CSV / XLS</span>
              </button>
              {members.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold min-h-[42px] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              )}
            </div>
          )}
        </div>

        {statusBanner && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}

        {!isAdminAuthorized && (
          <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Lock className="w-5 h-5 text-[#0D47A1] dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Pengelolaan Data Anggota Khusus Admin Utama (Roberth Simatupang)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Demi menjaga kerahasiaan alamat dan nomor WhatsApp jemaat, penambahan, pengeditan,
                  upload CSV/XLS, dan pembacaan daftar anggota dibuka setelah masuk sebagai Admin Utama.
                </p>
              </div>
            </div>
            {onRequestAdminAuth && (
              <button
                type="button"
                onClick={onRequestAdminAuth}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-bold min-h-[42px] shrink-0 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Admin Utama</span>
              </button>
            )}
          </div>
        )}

        {isAdminAuthorized && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor RHJ, nama anggota, nama istri, nama anak, alamat, atau nomor WA..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
            />
          </div>
        )}
      </section>

      {/* Members Data Table */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nomor Anggota RHJ</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nama Anggota</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nama Istri</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nama Anak</th>
                <th className="py-3.5 px-4">Alamat</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nomor WA Aktif</th>
                {isAdminAuthorized && (
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdminAuthorized ? 8 : 7}
                    className="py-12 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Memuat daftar anggota Wijk Parserahan dari Firestore...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={isAdminAuthorized ? 8 : 7} className="py-14 px-6 text-center">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {members.length === 0
                        ? 'Tabel Daftar Anggota Masih Kosong'
                        : 'Tidak ada anggota yang sesuai pencarian'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                      {members.length === 0
                        ? isAdminAuthorized
                          ? 'Silakan tambahkan data anggota secara manual atau unggah daftar anggota berformat CSV / XLS.'
                          : 'Data anggota akan tampil di tabel ini setelah Admin Utama menambahkan atau mengunggah daftar anggota.'
                        : 'Coba ubah kata kunci pencarian nomor RHJ, nama, atau alamat.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => {
                  const waLink = formatWhatsappUrl(member.whatsappNumber);
                  const isConfirmDelete = confirmDeleteId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4 text-center font-mono-nums font-bold text-slate-500 dark:text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono-nums font-bold text-[#0D47A1] dark:text-blue-400 whitespace-nowrap">
                        {member.rhjNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {member.memberName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {member.spouseName || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-[220px]">
                        {member.childrenNames || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[260px]">
                        {member.address}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono-nums font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{member.whatsappNumber}</span>
                          </a>
                        ) : (
                          <span className="font-mono-nums text-slate-700 dark:text-slate-300">
                            {member.whatsappNumber}
                          </span>
                        )}
                      </td>
                      {isAdminAuthorized && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(member)}
                              aria-label={`Edit ${member.memberName}`}
                              className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 text-xs font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            {!isConfirmDelete ? (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(member.id)}
                                aria-label={`Hapus ${member.memberName}`}
                                className="min-h-[36px] min-w-[36px] rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(member)}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                              >
                                Hapus?
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manual Add / Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0D47A1] to-[#1565C0] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  {editingMember ? 'Edit Data Anggota Wijk' : 'Tambah Anggota Wijk Manual'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  HKBP Jatisampurna Wijk Parserahan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Tutup form"
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor Anggota RHJ *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={WIJK_MEMBER_LIMITS.rhjNumberMax}
                    value={formData.rhjNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rhjNumber: e.target.value }))
                    }
                    placeholder="Contoh: RHJ-001"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor WA Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={WIJK_MEMBER_LIMITS.whatsappMax}
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                    }
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Anggota *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={WIJK_MEMBER_LIMITS.memberNameMax}
                    value={formData.memberName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, memberName: e.target.value }))
                    }
                    placeholder="Nama kepala keluarga / anggota"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Istri
                  </label>
                  <input
                    type="text"
                    maxLength={WIJK_MEMBER_LIMITS.spouseNameMax}
                    value={formData.spouseName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, spouseName: e.target.value }))
                    }
                    placeholder="Opsional"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Anak
                </label>
                <input
                  type="text"
                  maxLength={WIJK_MEMBER_LIMITS.childrenNamesMax}
                  value={formData.childrenNames}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, childrenNames: e.target.value }))
                  }
                  placeholder="Contoh: Daniel, Grace (pisahkan dengan koma, opsional)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Lengkap *
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={WIJK_MEMBER_LIMITS.addressMax}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Masukkan alamat tempat tinggal..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>

              {formError && (
                <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {formError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 min-h-[42px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-5 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#1565C0] disabled:opacity-60 text-white text-xs font-bold min-h-[42px]"
                >
                  {savingForm
                    ? 'Menyimpan...'
                    : editingMember
                    ? 'Simpan Perubahan'
                    : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload CSV / XLS Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Upload Daftar Anggota (CSV / XLS / XLSX)</span>
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Kolom: Nomor Anggota RHJ, Nama Anggota, Nama Istri, Nama Anak, Alamat, Nomor WA Aktif
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                aria-label="Tutup upload"
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Template Download Helpers */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Butuh format kolom yang sesuai?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unduh template kosong lalu isi daftar anggota di Excel / Google Sheets.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* File Picker */}
              <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {uploadFileName ? `File dipilih: ${uploadFileName}` : 'Pilih file .csv, .xls, atau .xlsx'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelected}
                  className="block mx-auto text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Pratinjau Data ({validParsedRows.length} siap diimpor dari {parsedRows.length} baris)
                    </span>
                    {parsedRows.length > validParsedRows.length && (
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">
                        {parsedRows.length - validParsedRows.length} baris dilewati karena kolom wajib kosong
                      </span>
                    )}
                  </div>

                  <div className="max-h-60 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs min-w-[680px]">
                      <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                        <tr className="text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 px-3">Baris</th>
                          <th className="py-2 px-3">No. RHJ</th>
                          <th className="py-2 px-3">Nama Anggota</th>
                          <th className="py-2 px-3">Nama Istri</th>
                          <th className="py-2 px-3">Nama Anak</th>
                          <th className="py-2 px-3">Alamat</th>
                          <th className="py-2 px-3">No. WA</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.slice(0, 50).map((item) => (
                          <tr
                            key={item.rowNumber}
                            className={item.error ? 'bg-rose-50/70 dark:bg-rose-950/30' : ''}
                          >
                            <td className="py-2 px-3 font-mono-nums">{item.rowNumber}</td>
                            <td className="py-2 px-3 font-mono-nums font-bold">{item.data.rhjNumber || '-'}</td>
                            <td className="py-2 px-3 font-semibold">{item.data.memberName || '-'}</td>
                            <td className="py-2 px-3">{item.data.spouseName || '-'}</td>
                            <td className="py-2 px-3">{item.data.childrenNames || '-'}</td>
                            <td className="py-2 px-3 max-w-[160px] truncate">{item.data.address || '-'}</td>
                            <td className="py-2 px-3 font-mono-nums">{item.data.whatsappNumber || '-'}</td>
                            <td className="py-2 px-3">
                              {item.error ? (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                  {item.error}
                                </span>
                              ) : (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                  Siap
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 min-h-[42px]"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={importing || validParsedRows.length === 0}
                  onClick={handleConfirmUpload}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold min-h-[42px]"
                >
                  {importing
                    ? 'Mengunggah...'
                    : `Simpan ${validParsedRows.length} Anggota ke Database`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
