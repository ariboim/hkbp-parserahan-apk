import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const SERVER_BOOT_ID = crypto.randomBytes(8).toString('hex');

function getAppVersion(): string {
  const distIndexPath = path.resolve(__dirname, 'dist', 'index.html');
  try {
    if (process.env.NODE_ENV === 'production' && fs.existsSync(distIndexPath)) {
      const content = fs.readFileSync(distIndexPath);
      return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    }
  } catch {
    // fallback to boot id
  }
  return SERVER_BOOT_ID;
}

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

  app.get('/api/app-version', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ version: getAppVersion() });
  });

  app.use('/assets/aistudio', (req: Request, res: Response, next) => {
    if (!path.extname(req.path)) {
      res.type('image/jpeg');
    }
    next();
  });

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
    app.use((req, res, next) => {
      if (req.path === '/' || req.path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });
    app.get('/@vite/client', (_req: Request, res: Response) => {
      res.type('application/javascript');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay extends (globalThis.HTMLElement || class {}) {}
`);
    });
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      })
    );
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
