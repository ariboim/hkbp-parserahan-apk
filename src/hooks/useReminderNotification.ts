import { useCallback, useEffect, useState } from 'react';
import { AppNotification, Devotional, ReminderSettings } from '../types';

const REMINDER_STORAGE_KEY = 'hkbp_parserahan_reminder_v1';

export function useReminderNotification(
  todayDevotional: Devotional,
  onAddNotification: (notif: AppNotification) => void
) {
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    const supported = typeof window !== 'undefined' && 'Notification' in window;
    const defaultPermission: ReminderSettings['browserPermission'] = supported
      ? Notification.permission
      : 'unsupported';
    try {
      const saved = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReminderSettings>;
        return {
          enabled: parsed.enabled ?? true,
          time: parsed.time ?? '06:00',
          browserPermission: defaultPermission,
          lastSentDate: parsed.lastSentDate ?? null,
        };
      }
    } catch {
      // ignore storage failure
    }
    return {
      enabled: true,
      time: '06:00',
      browserPermission: defaultPermission,
      lastSentDate: null,
    };
  });

  const [inAppBanner, setInAppBanner] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage failure
    }
  }, [settings]);

  const triggerReminderAlert = useCallback(
    (isManualTest = false) => {
      const title = isManualTest
        ? 'Pengingat Renungan Harian · HKBP Parserahan'
        : `Saatnya Renungan Harian (${settings.time})`;
      const body = `${todayDevotional.readingRef} — "${todayDevotional.title}" (${todayDevotional.hymnRef})`;

      setInAppBanner({ title, body });
      window.setTimeout(() => {
        setInAppBanner((prev) => (prev?.body === body ? null : prev));
      }, 6500);

      onAddNotification({
        id: `notif-${Date.now()}`,
        title,
        message: body,
        time: 'Baru saja',
        type: 'renungan',
        read: false,
        targetRoute: { type: 'sub', view: 'renungan' },
      });

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png',
            tag: 'hkbp-daily-devotional',
          });
        } catch {
          // fallback already shown via inAppBanner
        }
      }
    },
    [onAddNotification, settings.time, todayDevotional]
  );

  const requestPermissionAndEnable = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSettings((prev) => ({ ...prev, enabled: true, browserPermission: 'unsupported' }));
      return 'unsupported' as const;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = 'denied';
      }
    }
    setSettings((prev) => ({
      ...prev,
      enabled: true,
      browserPermission: perm,
    }));
    return perm;
  }, []);

  const toggleEnabled = useCallback(
    async (next: boolean) => {
      if (next) {
        await requestPermissionAndEnable();
      } else {
        setSettings((prev) => ({ ...prev, enabled: false }));
      }
    },
    [requestPermissionAndEnable]
  );

  const updateTime = useCallback((time: string) => {
    setSettings((prev) => ({ ...prev, time }));
  }, []);

  // Poll every 30s to check if scheduled daily reminder time matches current local HH:mm
  useEffect(() => {
    if (!settings.enabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHm = `${hh}:${mm}`;

      if (currentHm === settings.time && settings.lastSentDate !== todayKey) {
        setSettings((prev) => ({ ...prev, lastSentDate: todayKey }));
        triggerReminderAlert(false);
      }
    };

    const interval = window.setInterval(checkSchedule, 30000);
    return () => window.clearInterval(interval);
  }, [settings.enabled, settings.time, settings.lastSentDate, triggerReminderAlert]);

  return {
    settings,
    inAppBanner,
    dismissBanner: () => setInAppBanner(null),
    toggleEnabled,
    updateTime,
    requestPermissionAndEnable,
    sendTestReminder: () => triggerReminderAlert(true),
  };
}
