import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNumber,
  formatPrice,
  hasDiscount,
  discountPercent,
  isAvailable,
  digitsOnly,
  waNumber,
  waLink,
  telHref,
  pName,
  cName,
} from './format';
import type { Product, Category } from './types';

test('formatNumber formats numbers with English numerals without messing text direction', () => {
  assert.equal(formatNumber(1500), '1,500');
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(24.5), '24.5');
});

test('formatPrice appends currency correctly', () => {
  assert.equal(formatPrice(1200, 'أوقية'), '1,200 أوقية');
  assert.equal(formatPrice(350, 'MRU'), '350 MRU');
});

test('hasDiscount and discountPercent calculate price deductions accurately', () => {
  const pWithDiscount: Product = {
    id: 'p1',
    name: 'عطر فاخر',
    price: 800,
    oldPrice: 1000,
    categoryId: 'men',
    images: [],
    featured: true,
    isNew: false,
    hidden: false,
    createdAt: Date.now(),
  };
  assert.equal(hasDiscount(pWithDiscount), true);
  assert.equal(discountPercent(pWithDiscount), 20);

  const pWithoutDiscount: Product = {
    id: 'p2',
    name: 'عطر عادي',
    price: 1000,
    categoryId: 'men',
    images: [],
    featured: false,
    isNew: false,
    hidden: false,
    createdAt: Date.now(),
  };
  assert.equal(hasDiscount(pWithoutDiscount), false);
  assert.equal(discountPercent(pWithoutDiscount), 0);
});

test('isAvailable checks stock properly', () => {
  const untracked: Product = {
    id: 'p1',
    name: 'عطر غير مقيد',
    price: 500,
    stock: null,
    categoryId: 'men',
    images: [],
    featured: false,
    isNew: false,
    hidden: false,
    createdAt: Date.now(),
  };
  assert.equal(isAvailable(untracked), true);

  const inStock: Product = {
    id: 'p2',
    name: 'عطر متوفر',
    price: 500,
    stock: 4,
    categoryId: 'men',
    images: [],
    featured: false,
    isNew: false,
    hidden: false,
    createdAt: Date.now(),
  };
  assert.equal(isAvailable(inStock), true);

  const outOfStock: Product = {
    id: 'p3',
    name: 'عطر نافد',
    price: 500,
    stock: 0,
    categoryId: 'men',
    images: [],
    featured: false,
    isNew: false,
    hidden: false,
    createdAt: Date.now(),
  };
  assert.equal(isAvailable(outOfStock), false);
});

test('phone and whatsapp utilities clean input and create valid links', () => {
  assert.equal(digitsOnly('+222 45 12 34 56'), '22245123456');
  assert.equal(waNumber('+222 45-12-34-56'), '22245123456');
  assert.equal(telHref('+222 45 12 34 56'), 'tel:+22245123456');

  const link = waLink('22245123456', 'مرحبا، أود الاستفسار');
  assert.equal(link, 'https://wa.me/22245123456?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1');
  assert.equal(waLink('', 'test'), null);
});

test('pName and cName choose correct localized strings with Arabic fallback', () => {
  const product = { name: 'عطر الورد', nameFr: 'Parfum de Rose' };
  assert.equal(pName(product, 'ar'), 'عطر الورد');
  assert.equal(pName(product, 'fr'), 'Parfum de Rose');

  const productNoFr = { name: 'عطر العود', nameFr: '' };
  assert.equal(pName(productNoFr, 'fr'), 'عطر العود');

  const category: Category = { id: 'c1', name: 'رجالية', nameFr: 'Hommes', order: 1 };
  assert.equal(cName(category, 'ar'), 'رجالية');
  assert.equal(cName(category, 'fr'), 'Hommes');
});
