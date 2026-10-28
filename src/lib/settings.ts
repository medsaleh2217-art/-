import type { Settings } from './types';

/**
 * القيم الافتراضية: فقط المعلومات التي أكدها صاحب المتجر.
 * النصوص الأولية للسياسات قابلة للتعديل من لوحة التحكم ويجب أن يؤكدها صاحب المحل.
 * رقم واتساب فارغ عمدًا حتى يؤكد المالك أي الرقمين يدعم واتساب.
 */
export const defaultSettings: Settings = {
  storeName: 'الطيب الأصلي',
  storeNameFr: 'Al Tayyib Al Asli',
  tagline: 'بالسعر الأصلي — للعطور الفاخرة',
  taglineFr: 'Au prix authentique — Parfums de luxe',
  logoUrl: '/assets/aistudio/logo_attybe_al_asli_3b519e2d.jpeg',
  phones: ['+222 26 27 60 88', '+222 20 34 62 35'],
  // يمكن ضبطه اختياريًا عبر VITE_WHATSAPP_NUMBER، وقيمة الإدارة (Firestore) لها الأولوية عند وجودها
  whatsappNumber: (
    String(
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_WHATSAPP_NUMBER) ||
        '22226276088',
    )
  ).replace(/[^\d]/g, ''),
  facebookUrl: 'https://www.facebook.com/share/1KK8ADs7mF/',
  mapsUrl: 'https://maps.app.goo.gl/uRk6ZXTqXMgnoxbv6',
  currency: 'MRU',
  city: 'نواكشوط، موريتانيا — سوق نقطة ساخنة الجديد بالقرب من كرفور جامبور',
  cityFr: 'Nouakchott, Mauritanie — Nouveau marché Point Chaud près de Carrefour Jambar',
  heroTitle: 'عطرك... بصمتك التي لا تُنسى',
  heroTitleFr: 'Votre parfum... votre signature inoubliable',
  heroSubtitle: 'اكتشف تشكيلة من العطور الفاخرة تعبّر عن ذوقك وأناقتك، واطلب بكل سهولة.',
  heroSubtitleFr: 'Découvrez une sélection de parfums de luxe qui reflète votre élégance, et commandez en toute simplicité.',
  heroImage: '',
  offersNote: '',
  offersNoteFr: '',
  aboutText:
    'الطيب الأصلي للعطور الفاخرة متجر متخصص في بيع العطور في نواكشوط، موريتانيا. نعمل على تقديم تشكيلة متنوعة من العطور وتسهيل عملية الطلب والتواصل المباشر مع عملائنا.',
  aboutTextFr:
    'Al Tayyib Al Asli est une boutique spécialisée dans la vente de parfums à Nouakchott, en Mauritanie. Nous proposons une sélection variée et facilitons la commande et le contact direct avec nos clients.',
  orderPolicy:
    'يُرسَل الطلب إلى المتجر للتأكيد، ويتواصل معك فريق المتجر لتأكيد التفاصيل. لا يتم الدفع إلكترونيًا عبر الموقع؛ طريقة الدفع تُحدَّد وفق سياسة المتجر عند التأكيد.',
  orderPolicyFr:
    "La commande est envoyée à la boutique pour confirmation et l'équipe vous contacte pour valider les détails. Aucun paiement en ligne n'est effectué sur le site ; le mode de paiement est défini selon la politique de la boutique lors de la confirmation.",
  returnPolicy:
    'سياسة الاستبدال والإرجاع يحدّدها المتجر. يُرجى التواصل مع المتجر مباشرة للاستفسار عن شروط الاستبدال أو الإرجاع قبل إتمام الشراء.',
  returnPolicyFr:
    "La politique d'échange et de retour est définie par la boutique. Veuillez contacter directement la boutique pour connaître les conditions avant l'achat.",
  privacyText:
    'نستخدم المعلومات التي تدخلها (الاسم ورقم الهاتف والمدينة وملاحظات الطلب) فقط لمعالجة طلبك والتواصل معك بشأنه. لا نجمع بيانات دفع. يُحفظ محتوى السلة على جهازك فقط حتى إرسال الطلب.',
  privacyTextFr:
    "Nous utilisons les informations saisies (nom, téléphone, ville, notes) uniquement pour traiter votre commande et vous contacter. Aucune donnée de paiement n'est collectée. Le contenu du panier est conservé sur votre appareil jusqu'à l'envoi de la commande.",
  pickupEnabled: true,
  deliveryEnabled: false,
  deliveryPolicy: '',
  deliveryPolicyFr: '',
  deliveryZones: [],
};

export function mergeSettings(remote: Partial<Settings> | undefined): Settings {
  if (!remote) return defaultSettings;
  const out: Settings = { ...defaultSettings };
  for (const k of Object.keys(remote) as (keyof Settings)[]) {
    const v = remote[k];
    if (v !== undefined && v !== null) (out as unknown as Record<string, unknown>)[k] = v;
  }
  if (!out.whatsappNumber) out.whatsappNumber = defaultSettings.whatsappNumber;
  return out;
}
