import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useData } from './data';
import { isAvailable } from '../lib/format';
import type { Product } from '../lib/types';

interface CartItem {
  productId: string;
  qty: number;
}

export interface CartLine {
  productId: string;
  qty: number;
  product?: Product;
  available: boolean;
  /** أقصى كمية متاحة (Infinity إذا لم يُتتبع المخزون) */
  maxQty: number;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'tayyib.cart.v1';

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is CartItem => !!x && typeof x.productId === 'string' && Number.isFinite(x.qty) && x.qty > 0)
      .map((x) => ({ productId: x.productId, qty: Math.floor(x.qty) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, loading } = useData();
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* تجاهل (وضع التصفح الخاص) */
    }
  }, [items]);

  const maxFor = useCallback(
    (id: string) => {
      const p = products.find((x) => x.id === id);
      if (!p) return Infinity;
      return p.stock == null ? Infinity : Math.max(0, p.stock);
    },
    [products],
  );

  const add = useCallback(
    (productId: string, qty = 1) => {
      setItems((cur) => {
        const max = maxFor(productId);
        const existing = cur.find((i) => i.productId === productId);
        const next = Math.min((existing?.qty ?? 0) + qty, max);
        if (next <= 0) return cur;
        if (existing) return cur.map((i) => (i.productId === productId ? { ...i, qty: next } : i));
        return [...cur, { productId, qty: next }];
      });
    },
    [maxFor],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setItems((cur) => {
        if (qty <= 0) return cur.filter((i) => i.productId !== productId);
        const q = Math.min(Math.floor(qty), maxFor(productId));
        return cur.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, q) } : i));
      });
    },
    [maxFor],
  );

  const remove = useCallback((productId: string) => setItems((c) => c.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo<CartLine[]>(
    () =>
      items.map((i) => {
        const product = products.find((p) => p.id === i.productId);
        // أثناء التحميل الأولي لا نعتبر المنتج غير متاح حتى لا تُحذف السلة خطأً
        const available = product ? !product.hidden && isAvailable(product) : loading;
        const maxQty = product ? (product.stock == null ? Infinity : Math.max(0, product.stock)) : Infinity;
        return { productId: i.productId, qty: i.qty, product, available, maxQty };
      }),
    [items, products, loading],
  );

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const l of lines) {
      if (!l.product || !l.available) continue;
      c += l.qty;
      s += l.qty * l.product.price;
    }
    return { count: c, subtotal: s };
  }, [lines]);

  const value = useMemo(
    () => ({ lines, count, subtotal, add, setQty, remove, clear }),
    [lines, count, subtotal, add, setQty, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be used inside CartProvider');
  return v;
}
