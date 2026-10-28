import { addDoc, collection, doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { formatPrice } from './format';
import type { CartLine } from '../state/cart';
import type { Lang, Order, Product } from './types';
import type { TKey } from '../i18n/ar';

export function makeRef(): string {
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return 'TY-' + Date.now().toString(36).toUpperCase().slice(-5) + rnd;
}

type OrderDraft = Omit<Order, 'id'>;

export function buildWhatsAppText(order: OrderDraft, currency: string, t: (k: TKey) => string): string {
  const out: string[] = [];
  out.push(`*${t('wa.title')}*`);
  out.push(`${t('wa.ref')}: ${order.ref}`);
  out.push('');
  out.push(`${t('wa.name')}: ${order.customerName}`);
  out.push(`${t('wa.phone')}: ${order.phone}`);
  out.push(`${t('wa.city')}: ${order.city}`);
  out.push(`${t('wa.method')}: ${order.method === 'delivery' ? t('cart.deliveryOpt') + (order.zone ? ` (${order.zone})` : '') : t('cart.pickup')}`);
  if (order.address) out.push(`${t('wa.address')}: ${order.address}`);
  out.push('');
  out.push(`${t('wa.items')}:`);
  order.items.forEach((it, i) => {
    out.push(`${i + 1}. ${it.name} × ${it.qty} = ${formatPrice(it.price * it.qty, currency)} (${formatPrice(it.price, currency)})`);
  });
  out.push('');
  out.push(`${t('wa.subtotal')}: ${formatPrice(order.subtotal, currency)}`);
  if (order.method === 'delivery') out.push(`${t('wa.delivery')}: ${formatPrice(order.deliveryFee, currency)}`);
  out.push(`*${t('wa.total')}: ${formatPrice(order.total, currency)}*`);
  if (order.notes) {
    out.push('');
    out.push(`${t('wa.notes')}: ${order.notes}`);
  }
  out.push('');
  out.push(t('wa.noPayment'));
  return out.join('\n');
}

/** يحفظ الطلب في Firestore. القواعد تسمح بإنشاء طلب بحالة "new" فقط. */
export async function saveOrder(order: OrderDraft): Promise<string> {
  if (!db) throw new Error('database-not-configured');
  // إزالة الحقول الفارغة لتجنب رفض القواعد وتقليل الحجم
  const clean = Object.fromEntries(
    Object.entries(order).filter(([, v]) => v !== undefined && v !== ''),
  ) as unknown as OrderDraft;
  const ref = await addDoc(collection(db, 'orders'), clean);
  return ref.id;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * يتحقق من الأسعار والكميات من الخادم قبل إتمام الطلب.
 * عند تعذّر الوصول للخادم (ضعف الاتصال) نعتمد على البيانات المحلية الحية ولا نمنع العميل.
 * يرجع true إذا وُجد اختلاف يستدعي مراجعة العميل.
 */
export async function cartHasChanged(lines: CartLine[]): Promise<boolean> {
  if (!db) return false;
  const database = db;
  for (const l of lines) {
    if (!l.product) continue;
    try {
      const snap = await withTimeout(getDocFromServer(doc(database, 'products', l.productId)), 5000);
      if (!snap.exists()) return true;
      const p = snap.data() as Product;
      if (p.hidden) return true;
      if (p.price !== l.product.price) return true;
      if (p.stock != null && l.qty > p.stock) return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function orderLang(lang: Lang): Lang {
  return lang === 'fr' ? 'fr' : 'ar';
}
