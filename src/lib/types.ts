export type Lang = 'ar' | 'fr';

export interface Category {
  id: string;
  name: string;
  nameFr?: string;
  image?: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  nameFr?: string;
  description?: string;
  descriptionFr?: string;
  price: number;
  /** السعر السابق — يُملأ فقط عند وجود تخفيض حقيقي */
  oldPrice?: number | null;
  categoryId: string;
  brand?: string;
  sizeMl?: number | null;
  /** null / غير موجود = لا يتم تتبع المخزون */
  stock?: number | null;
  images: string[];
  featured: boolean;
  isNew: boolean;
  hidden: boolean;
  createdAt: number;
}

export type OrderStatus = 'new' | 'pending' | 'confirmed' | 'preparing' | 'done' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['new', 'pending', 'confirmed', 'preparing', 'done', 'cancelled'];

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  ref: string;
  customerName: string;
  phone: string;
  city: string;
  address?: string;
  notes?: string;
  method: 'pickup' | 'delivery';
  zone?: string;
  deliveryFee: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  channel: 'whatsapp' | 'site';
  createdAt: number;
  lang: Lang;
}

export interface DeliveryZone {
  name: string;
  nameFr?: string;
  fee: number;
}

export interface Settings {
  storeName: string;
  storeNameFr: string;
  tagline: string;
  taglineFr: string;
  logoUrl: string;
  phones: string[];
  /** رقم واتساب بالصيغة الدولية بدون + (مثال: 22212345678). يجب أن يؤكده صاحب المتجر. */
  whatsappNumber: string;
  facebookUrl: string;
  mapsUrl: string;
  currency: string;
  city: string;
  cityFr: string;
  heroTitle: string;
  heroTitleFr: string;
  heroSubtitle: string;
  heroSubtitleFr: string;
  heroImage: string;
  offersNote: string;
  offersNoteFr: string;
  aboutText: string;
  aboutTextFr: string;
  orderPolicy: string;
  orderPolicyFr: string;
  returnPolicy: string;
  returnPolicyFr: string;
  privacyText: string;
  privacyTextFr: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryPolicy: string;
  deliveryPolicyFr: string;
  deliveryZones: DeliveryZone[];
}
