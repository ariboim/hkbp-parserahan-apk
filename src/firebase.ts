import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const ASPIRATION_LIMITS = {
  senderNameMin: 1,
  senderNameMax: 80,
  weykMin: 1,
  weykMax: 100,
  subjectMin: 2,
  subjectMax: 100,
  messageMin: 5,
  messageMax: 1500,
  adminNoteMax: 500,
} as const;

export const LIVESTREAM_LIMITS = {
  titleMin: 3,
  titleMax: 140,
  speakerMin: 2,
  speakerMax: 120,
  scheduleMin: 10,
  scheduleMax: 40,
  urlMin: 8,
  urlMax: 500,
  descMax: 600,
  senderNameMin: 1,
  senderNameMax: 60,
  locationMin: 1,
  locationMax: 80,
  messageMin: 1,
  messageMax: 400,
} as const;

export const DEFAULT_LIVESTREAM_CONFIG = {
  title: 'Ibadah Minggu Live · HKBP Jatisampurna Wijk Parserahan',
  speaker: 'Pelayan Ibadah HKBP Jatisampurna',
  scheduleIso: '2026-11-29T10:00:00+07:00',
  streamUrl: 'https://www.youtube.com/@HKBPOfficial/live',
  description:
    'Siaran langsung ibadah dan acara khusus HKBP Jatisampurna Wijk Parserahan bagi jemaat di luar kota maupun di luar negeri.',
  isLive: false,
} as const;

export function isSafeHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    const idRegex = /^[a-zA-Z0-9_-]{6,20}$/;

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
      return idRegex.test(id)
        ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
        : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'www.youtube-nocookie.com'
    ) {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v') || '';
        return idRegex.test(v)
          ? `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1`
          : null;
      }

      if (parsed.pathname === '/embed/live_stream') {
        const ch = parsed.searchParams.get('channel') || '';
        return /^[a-zA-Z0-9_-]{10,40}$/.test(ch)
          ? `https://www.youtube.com/embed/live_stream?channel=${ch}`
          : null;
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (
        parts.length >= 2 &&
        (parts[0] === 'live' || parts[0] === 'embed' || parts[0] === 'shorts') &&
        idRegex.test(parts[1])
      ) {
        return `https://www.youtube.com/embed/${parts[1]}?rel=0&modestbranding=1`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}
