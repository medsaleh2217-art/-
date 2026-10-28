import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRef, buildWhatsAppText } from './orders';
import ar from '../i18n/ar';
import type { TKey } from '../i18n/ar';

const t = (k: TKey) => ar[k] || k;

test('makeRef generates a non-empty unique reference starting with TY-', () => {
  const ref1 = makeRef();
  const ref2 = makeRef();
  assert.match(ref1, /^TY-[A-Z0-9]+$/);
  assert.notEqual(ref1, ref2);
});

test('buildWhatsAppText includes all necessary customer and product details', () => {
  const order = {
    ref: 'TY-TEST01',
    customerName: 'محمد أحمد',
    phone: '45123456',
    city: 'نواكشوط',
    method: 'delivery' as const,
    zone: 'تفرغ زينة',
    address: 'شارع المختار ولد داداه',
    items: [
      { productId: 'p1', name: 'عطر مسك الطيب', qty: 2, price: 1200 },
    ],
    subtotal: 2400,
    deliveryFee: 100,
    total: 2500,
    notes: 'التوصيل بعد العصر',
    channel: 'whatsapp' as const,
    lang: 'ar' as const,
    status: 'new' as const,
    createdAt: Date.now(),
  };

  const text = buildWhatsAppText(order, 'MRU', t);
  assert.ok(text.includes('TY-TEST01'));
  assert.ok(text.includes('محمد أحمد'));
  assert.ok(text.includes('45123456'));
  assert.ok(text.includes('نواكشوط'));
  assert.ok(text.includes('عطر مسك الطيب'));
  assert.ok(text.includes('2,500 MRU'));
  assert.ok(text.includes('التوصيل بعد العصر'));
});
