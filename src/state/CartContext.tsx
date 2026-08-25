import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getDish, groupNumber, parsePrice } from '../data/menu';
import { useAuth } from './AuthContext';
import type { CartItem } from '../components/CartRow';

// A built meal is its own line: two lots of the same dish with different extras
// are two different things to cook and two different prices, so the line's key
// carries the build and `dishId` stays the thing the kitchen reads.
export interface Build {
  key: string;
  label: string;
  /** Price of one, extras included. */
  unit: number;
}

const buildItem = (dishId: string, qty: number, build?: Build): CartItem | null => {
  const dish = getDish(dishId);
  if (!dish) return null;
  return {
    id: build ? `${dish.id}|${build.key}` : dish.id,
    dishId: dish.id,
    name: dish.name,
    price: build ? groupNumber(build.unit) : dish.price,
    image: dish.image,
    qty,
    note: build?.label,
  };
};

export interface CartContextValue {
  items: CartItem[];
  addItem: (dishId: string, qty?: number, build?: Build) => void;
  changeQty: (id: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  // Empty for everyone. Nothing is seeded — the basket only ever holds what the
  // customer put in it, and that carries across a guest signing in to order it.
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Signing out hands the app to a different person — the previous account's
    // basket must not still be sitting there.
    if (status === 'guest') {
      setItems([]);
    }
  }, [status]);

  const addItem = useCallback((dishId: string, qty: number = 1, build?: Build) => {
    setItems((prev) => {
      const next = buildItem(dishId, qty, build);
      if (!next) return prev;
      // Same dish, same build — one line, deeper.
      if (prev.some((it) => it.id === next.id)) {
        return prev.map((it) => (it.id === next.id ? { ...it, qty: it.qty + qty } : it));
      }
      return [...prev, next];
    });
  }, []);

  // Stepping the last one down takes the line off the list. Clamping at one
  // instead left no way to drop an item short of ordering it.
  const changeQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0),
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
