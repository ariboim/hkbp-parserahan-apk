import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

interface ClaimedAdmin {
  username: string;
  saltHex: string;
  hashHex: string;
}

let claimedAdmin: ClaimedAdmin | null = null;

function isEnvConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME.trim() && process.env.ADMIN_PASSWORD);
}

function safeEqualText(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function hashPassword(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function signToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      role: 'admin',
      exp: Date.now() + TOKEN_TTL_MS,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { sub: string; role: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (!safeEqualText(sig, expectedSig)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown;
      role?: unknown;
      exp?: unknown;
    };
    if (
      typeof decoded.sub !== 'string' ||
      decoded.role !== 'admin' ||
      typeof decoded.exp !== 'number' ||
      decoded.exp < Date.now()
    ) {
      return null;
    }
    return { sub: decoded.sub, role: decoded.role, exp: decoded.exp };
  } catch {
    return null;
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/admin/status', (_req: Request, res: Response) => {
    const envReady = isEnvConfigured();
    const mode = envReady ? 'env' : claimedAdmin ? 'claimed' : 'setup';
    res.json({
      configured: envReady || claimedAdmin !== null,
      mode,
    });
  });

  app.post('/api/admin/setup', (req: Request, res: Response) => {
    if (isEnvConfigured() || claimedAdmin !== null) {
      res.status(403).json({ error: 'Kredensial admin sudah dikonfigurasi.' });
      return;
    }
    const body = req.body as { username?: unknown; password?: unknown } | undefined;
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
      res.status(400).json({ error: 'Username harus 3–50 karakter huruf/angka.' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Kata sandi harus 6–128 karakter.' });
      return;
    }

    const saltHex = crypto.randomBytes(16).toString('hex');
    const hashHex = hashPassword(password, saltHex);
    claimedAdmin = { username, saltHex, hashHex };

    const token = signToken(username);
    res.status(201).json({ token, username });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const body = req.body as { username?: unknown; password?: unknown } | undefined;
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password || username.length > 128 || password.length > 128) {
      res.status(400).json({ error: 'Masukkan username dan kata sandi dengan benar.' });
      return;
    }

    if (isEnvConfigured()) {
      const envUser = (process.env.ADMIN_USERNAME || '').trim();
      const envPass = process.env.ADMIN_PASSWORD || '';
      if (safeEqualText(username, envUser) && safeEqualText(password, envPass)) {
        res.json({ token: signToken(envUser), username: envUser });
        return;
      }
      res.status(401).json({ error: 'Username atau kata sandi admin tidak sesuai.' });
      return;
    }

    if (claimedAdmin) {
      const candidateHash = hashPassword(password, claimedAdmin.saltHex);
      if (safeEqualText(username, claimedAdmin.username) && safeEqualText(candidateHash, claimedAdmin.hashHex)) {
        res.json({ token: signToken(claimedAdmin.username), username: claimedAdmin.username });
        return;
      }
      res.status(401).json({ error: 'Username atau kata sandi admin tidak sesuai.' });
      return;
    }

    res.status(409).json({ error: 'Kredensial admin belum diaktivasi.' });
  });

  app.get('/api/admin/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    const verified = token ? verifyToken(token) : null;
    if (!verified) {
      res.status(401).json({ valid: false });
      return;
    }
    res.json({ valid: true, username: verified.sub });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
