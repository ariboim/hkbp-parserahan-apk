import { useEffect, useRef } from 'react';

const RELOAD_GUARD_KEY = 'hkbp_auto_reload_at';
const RELOAD_COOLDOWN_MS = 12_000;
const CHECK_INTERVAL_MS = 45_000;

function triggerSafeReload(): void {
  if (typeof window === 'undefined') return;
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
    const now = Date.now();
    if (now - lastReload < RELOAD_COOLDOWN_MS) {
      return;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  } catch {
    // ignore storage errors
  }
  window.location.reload();
}

export function useAutoRefresh(): void {
  const initialVersionRef = useRef<string | null>(null);
  const checkingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let active = true;

    const checkVersionAndSw = async () => {
      if (!active || checkingRef.current || !navigator.onLine) return;
      checkingRef.current = true;
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map((reg) => reg.update().catch(() => undefined))
          );
        }

        const res = await fetch(`/api/app-version?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (!data.version) return;

        if (initialVersionRef.current === null) {
          initialVersionRef.current = data.version;
        } else if (initialVersionRef.current !== data.version) {
          triggerSafeReload();
        }
      } catch {
        // ignore transient network errors while offline or switching networks
      } finally {
        checkingRef.current = false;
      }
    };

    const handleControllerChange = () => {
      triggerSafeReload();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkVersionAndSw();
      }
    };

    const handleFocus = () => {
      void checkVersionAndSw();
    };

    const handleOnline = () => {
      void checkVersionAndSw();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        triggerSafeReload();
      } else {
        void checkVersionAndSw();
      }
    };

    void checkVersionAndSw();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pageshow', handlePageShow);

    const timerId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkVersionAndSw();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timerId);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
}
