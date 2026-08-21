import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getDish, parsePrice } from '../data/menu';
import type { CartItem } from '../components/CartRow';

const SEED: { id: string; qty: number }[] = [
  { id: 'dolma', qty: 1 },
  { id: 'noodles', qty: 2 },
  { id: 'lasagna', qty: 1 },
];

const buildItem = (id: string, qty: number): CartItem | null => {
  const dish = getDish(id);
  return dish ? { id: dish.id, name: dish.name, price: dish.price, image: dish.image, qty } : null;
};

const INITIAL_ITEMS: CartItem[] = SEED.flatMap(({ id, qty }) => {
  const item = buildItem(id, qty);
  return item ? [item] : [];
});

export interface CartContextValue {
  items: CartItem[];
  addItem: (id: string, qty?: number) => void;
  changeQty: (id: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);

  const addItem = useCallback((id: string, qty: number = 1) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === id)) {
        return prev.map((it) => (it.id === id ? { ...it, qty: it.qty + qty } : it));
      }
      const item = buildItem(id, qty);
      return item ? [...prev, item] : prev;
    });
  }, []);

  const changeQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it)),
    );
  }, []);

  // Emptied once the order is placed — the cart is the draft, the order is the
  // record, and leaving the draft behind would re-order it on the next confirm.
  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + parsePrice(it.price) * it.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, addItem, changeQty, clearCart, subtotal }),
    [items, addItem, changeQty, clearCart, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
