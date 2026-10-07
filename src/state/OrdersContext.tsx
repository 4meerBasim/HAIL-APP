import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type DropChoice,
  type Order,
  type OrderCharges,
  type OrderLine,
  type PaymentMethod,
  deliveredBy,
  nextOrderId,
} from '../data/menu';
import { useAuth } from './AuthContext';
import { useStoredState } from './useStoredState';

// Bumped past the original orders key: the old key holds whatever was saved while the
// screen was being built, and that data outranks anything here.
const STORAGE_KEY = 'hail.orders.v2';

export interface PlaceOrderExtra {
  note?: string;
  drop?: DropChoice;
  payment?: PaymentMethod;
  charges?: OrderCharges;
}

export interface OrdersContextValue {
  orders: Order[];
  placeOrder: (lines: OrderLine[], extra?: PlaceOrderExtra) => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

/**
 * The current time, re-read every `everyMs`. For a screen that shows an
 * order's progress, which moves with the clock rather than with any state.
 */
export function useNow(everyMs: number): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  const [placed, setPlaced] = useStoredState<Order[]>(STORAGE_KEY, []);
  // Only moved forward when the live order's window closes — see below.
  const [now, setNow] = useState(Date.now);

  // Signing out hands the phone to someone else: the orders belong to the
  // account that placed them, and the next one to sign in must not inherit
  // them. Cleared from storage, not just hidden, for the same reason.
  useEffect(() => {
    if (status === 'guest') setPlaced([]);
  }, [status, setPlaced]);

  // A guest has no history at all — the stored orders belong to whoever was
  // signed in when they were placed. Emptied here rather than per screen so the
  // tab bar's live dot, the tracker and the receipt list all agree.
  //
  // The same goes for an order whose delivery window has closed: it is read
  // as delivered here, once, so no screen can still be calling it live.
  const orders = useMemo(
    () =>
      status === 'authed'
        ? placed
            .map((order) =>
              order.status === 'active' && now >= deliveredBy(order)
                ? { ...order, status: 'delivered' as const }
                : order,
            )
            .sort((a, b) => b.placedAt - a.placedAt)
        : [],
    [placed, status, now],
  );

  // Wakes once, when the live order's window closes, so the live dot goes out
  // on time without a provider-wide clock re-rendering the app every second.
  useEffect(() => {
    const live = orders.find((order) => order.status === 'active');
    if (!live) return;
    const id = setTimeout(() => setNow(Date.now()), Math.max(0, deliveredBy(live) - Date.now()));
    return () => clearTimeout(id);
  }, [orders]);

  // Only one order is ever in flight. Confirming a new cart retires the
  // previous one to the receipt list — without a backend to report a handover,
  // placing the next order is the only signal the last one landed.
  const placeOrder = useCallback(
    (lines: OrderLine[], extra?: PlaceOrderExtra) => {
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
        payment: extra?.payment,
        charges: extra?.charges,
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
