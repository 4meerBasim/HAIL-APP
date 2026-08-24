import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { type DropChoice, type Order, type OrderLine, nextOrderId } from '../data/menu';
import { demoOrders } from '../data/demoOrders';
import { useAuth } from './AuthContext';
import { useStoredState } from './useStoredState';

// Bumped past `jareesh.orders`: the old key holds whatever was saved while the
// screen was being built, and that data outranks anything here.
const STORAGE_KEY = 'jareesh.orders.v2';

// Stamped once at startup rather than per render, so the relative dates on the
// receipts stay put while the app is open.
const DEMO_ORDERS = demoOrders();

export interface OrdersContextValue {
  orders: Order[];
  placeOrder: (lines: OrderLine[], extra?: { note?: string; drop?: DropChoice }) => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  // Only real orders are stored. The demo history is merged in below rather
  // than seeded as the initial value: `useStoredState` replaces the initial
  // with whatever storage holds, so the first real order would wipe the
  // placeholder receipts out for good on the next launch.
  const [placed, setPlaced] = useStoredState<Order[]>(STORAGE_KEY, []);

  // A guest has no history at all — not the demo receipts, and not the stored
  // ones either, which belong to whoever was signed in when they were placed.
  // Emptied here rather than per screen so the tab bar's live dot, the tracker
  // and the receipt list all agree.
  const orders = useMemo(
    () =>
      status === 'authed'
        ? [...placed, ...DEMO_ORDERS].sort((a, b) => b.placedAt - a.placedAt)
        : [],
    [placed, status],
  );

  // Only one order is ever in flight. Confirming a new cart retires the
  // previous one to the receipt list — without a backend to report a handover,
  // placing the next order is the only signal the last one landed.
  const placeOrder = useCallback(
    (lines: OrderLine[], extra?: { note?: string; drop?: DropChoice }) => {
      if (lines.length === 0) return;
      // A guest cannot order. The cart gates this before it is reached, but the
      // id is numbered against a list that is empty for a guest — so an order
      // slipping through here would collide with a real one on the next sign-in.
      if (status !== 'authed') return;

      const order: Order = {
        // Numbered against the merged list so ids carry on past the demo ones.
        id: nextOrderId(orders),
        status: 'active',
        placedAt: Date.now(),
        lines,
        note: extra?.note?.trim() || undefined,
        drop: extra?.drop,
      };

      setPlaced([
        order,
        ...placed.map((prev) =>
          prev.status === 'active' ? { ...prev, status: 'delivered' as const } : prev,
        ),
      ]);
    },
    [orders, placed, setPlaced, status],
  );

  const value = useMemo<OrdersContextValue>(() => ({ orders, placeOrder }), [orders, placeOrder]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return ctx;
}
