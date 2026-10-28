import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db, demoMode, firebaseConfigured } from '../lib/firebase';
import { DEFAULT_CATEGORIES, DEMO_PRODUCTS } from '../lib/seed';
import { defaultSettings, mergeSettings } from '../lib/settings';
import type { Category, Product, Settings } from '../lib/types';

interface DataCtx {
  products: Product[];
  categories: Category[];
  settings: Settings;
  loading: boolean;
  error: string | null;
  configured: boolean;
  demo: boolean;
  getProduct: (id: string) => Product | undefined;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setProducts(DEMO_PRODUCTS);
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
      return;
    }
    if (!db) {
      setLoading(false);
      return;
    }
    let pending = 3;
    const done = () => {
      pending -= 1;
      if (pending <= 0) setLoading(false);
    };
    const onErr = (e: Error) => {
      console.error(e);
      setError(e.message);
      setLoading(false);
    };
    // الزائر يقرأ المنتجات الظاهرة فقط (وفق قواعد الأمان)
    const u1 = onSnapshot(
      query(collection(db, 'products'), where('hidden', '==', false)),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ ...(d.data() as Omit<Product, 'id'>), id: d.id })));
        setError(null);
        done();
      },
      onErr,
    );
    const u2 = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Category, 'id'>), id: d.id }));
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCategories(list);
        done();
      },
      onErr,
    );
    const u3 = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        setSettings(mergeSettings(snap.exists() ? (snap.data() as Partial<Settings>) : undefined));
        done();
      },
      onErr,
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const value = useMemo<DataCtx>(
    () => ({
      products,
      categories,
      settings,
      loading,
      error,
      configured: firebaseConfigured,
      demo: demoMode,
      getProduct: (id) => products.find((p) => p.id === id),
    }),
    [products, categories, settings, loading, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}
