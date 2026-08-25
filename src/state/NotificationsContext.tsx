import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { type Notification, notifications as seeded } from '../data/notifications';
import { useAuth } from './AuthContext';
import { useStoredState } from './useStoredState';

const READ_KEY = '@jareesh/notifications-read';
const CLEARED_KEY = '@jareesh/notifications-cleared';

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

// The feed itself is seeded and fixed; what changes is which of it the customer
// has opened and whether they have swept the lot. Both survive a restart, or
// clearing the inbox would only last until the next launch.
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [read, setRead] = useStoredState<string[]>(READ_KEY, []);
  const [cleared, setCleared] = useStoredState<string[]>(CLEARED_KEY, []);

  // Every notification is about an order or a delivery, and a guest has
  // neither. The feed is empty for them, which also takes the bell's badge to
  // zero without the header needing to know why.
  const items = useMemo(
    () =>
      status === 'authed'
        ? seeded
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

  const clearAll = useCallback(() => {
    setCleared(seeded.map((n) => n.id));
  }, [setCleared]);

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
