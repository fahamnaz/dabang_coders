import type { ParentNotification } from '../data/parentDashboard';
import { api } from '../api/client';

type NotificationTone = ParentNotification['tone'];

// ─── API-BACKED NOTIFICATION FUNCTIONS ──────────────────────

export function getStoredChildName(): string {
  // Legacy fallback; the server now provides this via AuthContext
  if (typeof window === 'undefined') return 'Alex';
  try {
    const token = window.localStorage.getItem('playspark-token');
    if (!token) return window.localStorage.getItem('playspark-child-name') || 'Alex';
    return 'Alex'; // Will be overridden by user.childName in components
  } catch {
    return 'Alex';
  }
}

export function persistChildName(_name: string) {
  // No-op — child name is now stored in MongoDB
}

export async function getStoredParentNotifications(): Promise<ParentNotification[]> {
  try {
    const { notifications } = await api.get<{
      notifications: Array<{
        title: string;
        detail: string;
        tone: string;
        emoji: string;
        time: string;
      }>;
    }>('/notifications');

    return notifications.map(n => ({
      title: n.title,
      detail: n.detail,
      tone: (n.tone || 'info') as NotificationTone,
      emoji: n.emoji || '🌟',
      time: n.time || 'Just now',
    }));
  } catch {
    // Fallback to localStorage if API fails
    return readLocalNotifications();
  }
}

export function createRewardNotification(
  action: string,
  detail: string,
  tone: NotificationTone = 'success',
  emoji = '🌟',
) {
  const childName = getStoredChildName();
  const title = `${childName} ${action}`;

  // Fire and forget to the server
  api.post('/notifications', { title, detail, tone, emoji }).catch(() => {
    // Fallback: save to localStorage if API fails
    pushLocalNotification({ title, detail, tone, emoji });
  });

  // Also push to localStorage for backward compat with parent dashboard
  pushLocalNotification({ title, detail, tone, emoji });
}

export function subscribeToParentNotifications(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const PARENT_NOTIFICATIONS_KEY = 'playspark-parent-notifications';
  const PARENT_NOTIFICATIONS_EVENT = 'playspark-parent-notifications-updated';

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === PARENT_NOTIFICATIONS_KEY) onChange();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(PARENT_NOTIFICATIONS_EVENT, onChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PARENT_NOTIFICATIONS_EVENT, onChange);
  };
}

// ─── LOCAL STORAGE FALLBACK ─────────────────────────────────

const PARENT_NOTIFICATIONS_KEY = 'playspark-parent-notifications';
const PARENT_NOTIFICATIONS_EVENT = 'playspark-parent-notifications-updated';
const MAX_PARENT_NOTIFICATIONS = 10;

interface StoredNotification {
  id: string;
  title: string;
  detail: string;
  tone: string;
  emoji: string;
  createdAt: string;
}

function readLocalNotifications(): ParentNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PARENT_NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: StoredNotification) => ({
      title: item.title,
      detail: item.detail,
      tone: (item.tone || 'info') as NotificationTone,
      emoji: item.emoji || '🌟',
      time: getRelativeTime(item.createdAt),
    }));
  } catch {
    return [];
  }
}

function pushLocalNotification(input: { title: string; detail: string; tone: string; emoji: string }) {
  if (typeof window === 'undefined') return;

  const existing = (() => {
    try {
      const raw = window.localStorage.getItem(PARENT_NOTIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const latest = existing[0];
  if (latest && latest.title === input.title && latest.detail === input.detail) {
    const latestTime = new Date(latest.createdAt).getTime();
    if (Date.now() - latestTime < 2500) return;
  }

  const next = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };

  const updated = [next, ...existing].slice(0, MAX_PARENT_NOTIFICATIONS);
  window.localStorage.setItem(PARENT_NOTIFICATIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(PARENT_NOTIFICATIONS_EVENT));
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
