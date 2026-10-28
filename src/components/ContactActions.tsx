import Icon from './Icon';
import { useI18n } from '../i18n';
import { useData } from '../state/data';
import { useWhatsApp } from '../lib/useWhatsApp';
import { telHref } from '../lib/format';

export default function ContactActions() {
  const { t } = useI18n();
  const { settings } = useData();
  const wa = useWhatsApp();
  const link = wa.link('');
  return (
    <div className="contact-actions">
      {link && (
        <a className="btn btn-wa" href={link} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" /> {t('contact.whatsapp')}
        </a>
      )}
      {settings.facebookUrl && (
        <a className="btn btn-outline" href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="facebook" /> {t('contact.facebook')}
        </a>
      )}
      {settings.mapsUrl && (
        <a className="btn btn-outline" href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="pin" /> {t('contact.map')}
        </a>
      )}
      {settings.phones.map((p) => (
        <a key={p} className="btn btn-outline" href={telHref(p)}>
          <Icon name="phone" /> <bdi dir="ltr">{p}</bdi>
        </a>
      ))}
    </div>
  );
}
