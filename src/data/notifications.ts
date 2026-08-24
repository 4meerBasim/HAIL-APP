import type { IconName } from '../components/icons';
import { colors } from '../theme';

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

// Seeded rather than pushed: there is no backend, and an inbox that is empty
// until something happens says nothing about what the app will send. Kept out
// of the screen because the header bell counts the unread ones from here too.
export const notifications: Notification[] = [
  { id: 'onTheWay', icon: 'truck', tint: colors.healthyBg, ink: colors.tealDark, unread: true, to: 'Tracking' },
  { id: 'tomorrow', icon: 'calendar', tint: colors.goldTint, ink: colors.goldText, unread: true, to: 'Tabs' },
  { id: 'offer', icon: 'star', tint: colors.goldTint, ink: colors.goldText, unread: false, to: 'Tabs' },
  { id: 'ending', icon: 'hourglass', tint: colors.coralBg, ink: colors.coral, unread: false, to: 'Tabs' },
  { id: 'delivered', icon: 'check', tint: colors.healthyBg, ink: colors.tealDark, unread: false, to: 'PastOrders' },
];

export const unreadCount = notifications.filter((n) => n.unread).length;
