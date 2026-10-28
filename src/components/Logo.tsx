import Bottle from './Bottle';
import { useData } from '../state/data';
import { useI18n } from '../i18n';

/** شعار المتجر: صورة الشعار من الإعدادات إن وُجدت، وإلا رسم بديل بنفس الهوية (أزرق/ذهبي) */
export default function Logo({ light = false, size = 40 }: { light?: boolean; size?: number }) {
  const { settings } = useData();
  const { lang } = useI18n();
  const name = lang === 'fr' ? settings.storeNameFr : settings.storeName;
  const tag = lang === 'fr' ? settings.taglineFr : settings.tagline;
  const logoUrl = settings.logoUrl || '/assets/aistudio/logo_attybe_al_asli_3b519e2d.jpeg';
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} width={size} height={size} className="logo-img" />
      ) : (
        <Bottle className="logo-bottle" />
      )}
      <span className="logo-text">
        <strong>{name}</strong>
        <small>{tag}</small>
      </span>
    </span>
  );
}
