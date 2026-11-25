/**
 * Phase 0 Payload-First Security TDD specification for firestore.rules.
 * Verifies that all 12 Dirty Dozen payloads violate the Firestore rule invariants.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'create' | 'get' | 'list' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Shadow field injection on aspiration create',
    operation: 'create',
    path: '/aspirations/asp_test_1',
    auth: null,
    payload: {
      senderName: 'Budi',
      weyk: 'Wijk Parserahan',
      subject: 'Masukan Beta',
      message: 'Aplikasi berjalan baik.',
      status: 'Baru',
      isAdmin: true,
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Status shortcutting on aspiration create',
    operation: 'create',
    path: '/aspirations/asp_test_2',
    auth: null,
    payload: {
      senderName: 'Budi',
      weyk: 'Wijk Parserahan',
      subject: 'Masukan Beta',
      message: 'Aplikasi berjalan baik.',
      status: 'Selesai',
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Client-forged createdAt timestamp',
    operation: 'create',
    path: '/aspirations/asp_test_3',
    auth: null,
    payload: {
      senderName: 'Budi',
      weyk: 'Wijk Parserahan',
      subject: 'Masukan Beta',
      message: 'Aplikasi berjalan baik.',
      status: 'Baru',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Spoofed authorUid on create',
    operation: 'create',
    path: '/aspirations/asp_test_4',
    auth: { uid: 'attacker_uid', email: 'user@example.com', email_verified: true },
    payload: {
      senderName: 'Budi',
      weyk: 'Wijk Parserahan',
      subject: 'Masukan Beta',
      message: 'Aplikasi berjalan baik.',
      status: 'Baru',
      authorUid: 'victim_uid',
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized message payload (>1500 chars)',
    operation: 'create',
    path: '/aspirations/asp_test_5',
    auth: null,
    payload: {
      senderName: 'Budi',
      weyk: 'Wijk Parserahan',
      subject: 'Masukan Beta',
      message: 'x'.repeat(1501),
      status: 'Baru',
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'ID poisoning with invalid characters',
    operation: 'create',
    path: '/aspirations/bad$id!',
    auth: null,
    payload: {
      senderName: 'Budi',
      weyk: 'Wijk Parserahan',
      subject: 'Masukan Beta',
      message: 'Aplikasi berjalan baik.',
      status: 'Baru',
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unauthenticated list of all aspirations',
    operation: 'list',
    path: '/aspirations',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Non-admin list of other users aspirations',
    operation: 'list',
    path: '/aspirations',
    auth: { uid: 'regular_user', email: 'jemaat@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Email spoofing without email_verified == true',
    operation: 'list',
    path: '/aspirations',
    auth: { uid: 'spoof_uid', email: 'bca.ccpl@gmail.com', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Non-admin attempt to update aspiration status',
    operation: 'update',
    path: '/aspirations/asp_test_1',
    auth: { uid: 'regular_user', email: 'jemaat@example.com', email_verified: true },
    payload: {
      status: 'Selesai',
      updatedAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Attempt to mutate immutable message field on update',
    operation: 'update',
    path: '/aspirations/asp_test_1',
    auth: { uid: 'admin_uid', email: 'bca.ccpl@gmail.com', email_verified: true },
    payload: {
      message: 'Tampered content',
      status: 'Dibaca',
      updatedAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-assigned admin privilege escalation',
    operation: 'create',
    path: '/admins/attacker_uid',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      email: 'attacker@example.com',
      name: 'Attacker',
      role: 'Admin Utama (Ketua)',
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
];
