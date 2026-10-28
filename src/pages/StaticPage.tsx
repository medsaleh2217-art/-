import { Link } from 'react-router-dom';
import ContactActions from '../components/ContactActions';
import { useI18n, type TKey } from '../i18n';
import { useData } from '../state/data';
import { sField } from '../lib/format';
import { useSeo } from '../lib/useSeo';

export type StaticKind = 'about' | 'contact' | 'privacy' | 'policy';

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{1,}/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </>
  );
}

export default function StaticPage({ kind }: { kind: StaticKind }) {
  const { t, lang } = useI18n();
  const { settings } = useData();
  const storeName = sField(settings, 'storeName', lang);
  const titleKey: TKey = ({ about: 'page.about', contact: 'page.contact', privacy: 'page.privacy', policy: 'page.policy' } as const)[kind];

  useSeo({ title: `${t(titleKey)} | ${storeName}`, description: kind === 'about' ? sField(settings, 'aboutText', lang) : t(titleKey) });

  const delivery = sField(settings, 'deliveryPolicy', lang);

  return (
    <div className="container page prose">
      <h1 className="page-title">{t(titleKey)}</h1>
      {kind === 'about' && (
        <>
          <Paragraphs text={sField(settings, 'aboutText', lang)} />
          <p>{lang === 'fr' ? settings.cityFr : settings.city}</p>
          <p>
            <Link to="/contact" className="btn btn-primary">
              {t('nav.contact')}
            </Link>
          </p>
        </>
      )}
      {kind === 'contact' && (
        <>
          <p>{lang === 'fr' ? settings.cityFr : settings.city}</p>
          <ContactActions />
        </>
      )}
      {kind === 'privacy' && <Paragraphs text={sField(settings, 'privacyText', lang)} />}
      {kind === 'policy' && (
        <>
          <h2>{t('page.orderPolicy')}</h2>
          <Paragraphs text={sField(settings, 'orderPolicy', lang)} />
          {delivery && (
            <>
              <h2>{t('page.deliveryPolicy')}</h2>
              <Paragraphs text={delivery} />
            </>
          )}
          <h2>{t('page.returnPolicy')}</h2>
          <Paragraphs text={sField(settings, 'returnPolicy', lang)} />
        </>
      )}
    </div>
  );
}

export function NotFound() {
  const { t } = useI18n();
  useSeo({ title: t('page.notFound'), noindex: true });
  return (
    <div className="container page center">
      <h1 className="page-title">{t('page.notFound')}</h1>
      <Link to="/" className="btn btn-primary">
        {t('page.goHome')}
      </Link>
    </div>
  );
}
