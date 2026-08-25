import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { type DropChoice, type Order, type OrderLine, nextOrderId } from '../data/menu';
import { useAuth } from './AuthContext';
import { useStoredState } from './useStoredState';

// Bumped past `jareesh.orders`: the old key holds whatever was saved while the
// screen was being built, and that data outranks anything here.
const STORAGE_KEY = 'jareesh.orders.v2';

export interface OrdersContextValue {
  orders: Order[];
  placeOrder: (lines: OrderLine[], extra?: { note?: string; drop?: DropChoice }) => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  const [placed, setPlaced] = useStoredState<Order[]>(STORAGE_KEY, []);

  // A guest has no history at all — the stored orders belong to whoever was
  // signed in when they were placed. Emptied here rather than per screen so the
  // tab bar's live dot, the tracker and the receipt list all agree.
  const orders = useMemo(
    () => (status === 'authed' ? [...placed].sort((a, b) => b.placedAt - a.placedAt) : []),
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
        // Numbered against the existing orders so ids never collide.
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
