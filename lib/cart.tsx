"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { feeOf, round2 } from "@/lib/fees";

export interface CartItem {
  eventId: string;    // uuid do evento (para persistência)
  eventSlug: string;  // slug (rota)
  eventTitle: string; // título do evento
  tierId: string;     // uuid do tier
  tierName: string;   // nome do tier
  price: number;      // preço unitário (BRL)
  qty: number;
  feePct: number;     // taxa de serviço (%) do evento — exibição; o servidor recalcula
  maxInstallments?: number; // máx. de parcelas no cartão (limite do evento)
  seatId?: string;    // assento marcado (quando o evento usa mapa de assentos)
  seatLabel?: string; // rótulo do assento, ex. "A12"
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  fee: number;        // taxa de serviço somada por item (feePct de cada evento)
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
      // hidratação do carrinho salvo: setState no mount é intencional e SSR-safe
      // (carrinhos antigos não têm feePct — assume o padrão 10)
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(
          (JSON.parse(raw) as CartItem[]).map((i) => ({ ...i, feePct: i.feePct ?? 10 }))
        );
      }
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
  const fee = feeOf(items);
  const total = round2(subtotal + fee);

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
