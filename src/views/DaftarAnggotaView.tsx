import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { WijkMembersManager } from '../components/WijkMembersManager';
import { ChurchLogo } from '../components/ChurchLogo';

interface DaftarAnggotaViewProps {
  adminToken: string | null;
  onOpenAdminLogin: () => void;
}

export const DaftarAnggotaView: React.FC<DaftarAnggotaViewProps> = ({
  adminToken,
  onOpenAdminLogin,
}) => {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isAdminAuthorized = Boolean(
    adminToken &&
      authReady &&
      firebaseUser &&
      firebaseUser.emailVerified &&
      firebaseUser.email === 'bca.ccpl@gmail.com'
  );

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl bg-gradient-to-br from-[#081C54] via-[#0F3184] to-[#1565C0] text-white p-5 sm:p-6 shadow-md flex items-center gap-4">
        <ChurchLogo size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
            <Users className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">Data Jemaat Resmi · HKBP Jatisampurna Wijk Parserahan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
            List Daftar Anggota Wijk Parserahan
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              Dikelola oleh Admin Utama (Roberth Simatupang) · Tambah manual & Upload CSV / XLS
            </span>
          </p>
        </div>
      </section>

      <WijkMembersManager
        isAdminAuthorized={isAdminAuthorized}
        onRequestAdminAuth={onOpenAdminLogin}
      />
    </div>
  );
};
