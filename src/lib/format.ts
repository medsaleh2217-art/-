import type { Lang, Product, Category, Settings } from './types';

/** أرقام لاتينية في كل اللغات حتى لا تختلط الأسعار مع اتجاه النص */
const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatPrice(n: number, currency: string): string {
  return `${nf.format(n)} ${currency}`;
}

export function pName(p: Pick<Product, 'name' | 'nameFr'>, lang: Lang): string {
  return lang === 'fr' && p.nameFr ? p.nameFr : p.name;
}

export function pDesc(p: Pick<Product, 'description' | 'descriptionFr'>, lang: Lang): string {
  return (lang === 'fr' && p.descriptionFr ? p.descriptionFr : p.description) || '';
}

export function cName(c: Pick<Category, 'name' | 'nameFr'>, lang: Lang): string {
  return lang === 'fr' && c.nameFr ? c.nameFr : c.name;
}

/** يختار الحقل المناسب للغة من الإعدادات، مثال: sField(s,'aboutText',lang) */
export function sField(s: Settings, key: string, lang: Lang): string {
  const rec = s as unknown as Record<string, unknown>;
  const fr = rec[key + 'Fr'];
  const ar = rec[key];
  return (lang === 'fr' && typeof fr === 'string' && fr ? fr : (ar as string)) || '';
}

export function hasDiscount(p: Product): boolean {
  return typeof p.oldPrice === 'number' && p.oldPrice > p.price;
}

export function discountPercent(p: Product): number {
  return hasDiscount(p) ? Math.round((1 - p.price / (p.oldPrice as number)) * 100) : 0;
}

/** حالة التوفر: stock == null يعني عدم تتبع المخزون */
export function isAvailable(p: Product): boolean {
  return p.stock == null || p.stock > 0;
}

export function digitsOnly(s: string): string {
  return s.replace(/[^\d]/g, '');
}

export function telHref(phone: string): string {
  return 'tel:+' + digitsOnly(phone);
}

export function waNumber(raw: string): string {
  return digitsOnly(raw);
}

export function waLink(number: string, text: string): string | null {
  const n = waNumber(number);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
