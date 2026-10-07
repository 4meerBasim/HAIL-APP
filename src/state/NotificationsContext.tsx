import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { IconName } from '../components/icons';
import { useAuth } from './AuthContext';
import { useStoredState } from './useStoredState';

const READ_KEY = '@hail/notifications-read';
const CLEARED_KEY = '@hail/notifications-cleared';

export interface Notification {
  id: string;
  icon: IconName;
  tint: string;
  ink: string;
  unread: boolean;
  // Where the notification leads — none of them is a dead row. Narrowed to the
  // routes that take no params, so a destination cannot be added here without
  // the params it needs.
  to: 'Tracking' | 'Tabs' | 'PastOrders';
}

export interface InboxItem extends Notification {
  read: boolean;
}

interface NotificationsValue {
  items: InboxItem[];
  unreadCount: number;
  /** Greys the row out — what "seen" means to the customer. */
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

// No notification source exists yet, so the feed itself is empty until one is
// wired up. The read/cleared bookkeeping survives a restart and is what a real
// feed will be marked and swept through — it stays rather than being torn out
// now and rebuilt later.
const FEED: Notification[] = [];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [read, setRead] = useStoredState<string[]>(READ_KEY, []);
  const [cleared, setCleared] = useStoredState<string[]>(CLEARED_KEY, []);
  const prevStatus = useRef(status);

  // Sign-out removes both keys from storage, but these copies are already in
  // memory and the next account to sign in would start with the last one's
  // read and cleared ids.
  useEffect(() => {
    if (prevStatus.current === 'authed' && status === 'guest') {
      setRead([]);
      setCleared([]);
    }
    prevStatus.current = status;
  }, [status, setRead, setCleared]);

  // Every notification is about an order or a delivery, and a guest has
  // neither. The feed is empty for them, which also takes the bell's badge to
  // zero without the header needing to know why.
  const items = useMemo(
    () =>
      status === 'authed'
        ? FEED
            .filter((n) => !cleared.includes(n.id))
            .map((n) => ({ ...n, read: read.includes(n.id) || !n.unread }))
        : [],
    [read, cleared, status],
  );

  const unreadCount = useMemo(() => items.filter((it) => !it.read).length, [items]);

  const markRead = useCallback(
    (id: string) => {
      if (!read.includes(id)) setRead([...read, id]);
    },
    [read, setRead],
  );

  // Adds whatever is currently in the inbox to the cleared set — a union, not a
  // replace: `items` is already filtered by `cleared`, so overwriting would drop
  // every earlier-cleared id and let those notifications reappear.
  const clearAll = useCallback(() => {
    setCleared([...cleared, ...items.map((n) => n.id)]);
  }, [cleared, items, setCleared]);

  const value = useMemo(
    () => ({ items, unreadCount, markRead, clearAll }),
    [items, unreadCount, markRead, clearAll],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
