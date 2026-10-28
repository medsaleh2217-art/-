import type { Category, Product } from './types';

/**
 * بيانات تجريبية للتطوير فقط (تظهر فقط في وضع demo عند غياب إعداد Firebase).
 * ليست منتجات حقيقية، والأسعار وهمية لأغراض العرض فقط ولا تُنشر.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'men', name: 'العطور الرجالية', nameFr: 'Parfums pour hommes', order: 1 },
  { id: 'women', name: 'العطور النسائية', nameFr: 'Parfums pour femmes', order: 2 },
];

const now = Date.now();

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'عطر تجريبي رجالي ١',
    nameFr: 'Parfum démo homme 1',
    description: 'منتج تجريبي لعرض شكل المتجر فقط. سيُستبدل بمنتجات حقيقية.',
    price: 1000,
    categoryId: 'men',
    sizeMl: 100,
    stock: 5,
    images: [],
    featured: true,
    isNew: true,
    hidden: false,
    createdAt: now - 1000,
  },
  {
    id: 'demo-2',
    name: 'عطر تجريبي نسائي ١',
    nameFr: 'Parfum démo femme 1',
    description: 'منتج تجريبي لعرض شكل المتجر فقط.',
    price: 800,
    oldPrice: 1000,
    categoryId: 'women',
    sizeMl: 50,
    stock: null,
    images: [],
    featured: true,
    isNew: false,
    hidden: false,
    createdAt: now - 2000,
  },
  {
    id: 'demo-4',
    name: 'عطر تجريبي رجالي ٢',
    nameFr: 'Parfum démo homme 2',
    description: 'منتج تجريبي لعرض شكل المتجر فقط.',
    price: 600,
    categoryId: 'men',
    stock: null,
    images: [],
    featured: false,
    isNew: true,
    hidden: false,
    createdAt: now - 4000,
  },
];
