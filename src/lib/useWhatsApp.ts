import { useData } from '../state/data';
import { telHref, waLink, waNumber } from './format';

/** يوفّر رابط واتساب فقط إذا أكّد المالك رقم واتساب من الإعدادات */
export function useWhatsApp() {
  const { settings } = useData();
  const rawWa = settings?.whatsappNumber || '';
  const enabled = waNumber(rawWa).length >= 8;
  const firstPhone = settings?.phones?.[0];
  return {
    enabled,
    link: (text: string) => (enabled ? waLink(rawWa, text) : null),
    callHref: firstPhone ? telHref(firstPhone) : null,
  };
}
