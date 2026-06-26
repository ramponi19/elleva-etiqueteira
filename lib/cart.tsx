"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  evt: string;   // título do evento
  tier: string;  // nome do tier
  price: number; // preço unitário (BRL)
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  fee: number;        // taxa de serviço 10% (mock)
  total: number;
  addItems: (items: CartItem[]) => void;
  removeItem: (index: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "elleva_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // hidrata do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // persiste
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItems = (next: CartItem[]) => setItems((prev) => [...prev, ...next]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));
  const clear = () => setItems([]);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.qty * i.price, 0);
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, fee, total, addItems, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
