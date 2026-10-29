import { useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { defaultSettings, mergeSettings } from '../lib/settings';
import { useI18n } from '../i18n';
import { useToast } from '../state/toast';
import type { DeliveryZone, Settings } from '../lib/types';
import ImageField from './ImageField';
import { AreaField, CheckField, TextField } from './ui';

export default function SettingsAdmin() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [phonesText, setPhonesText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'store'))
      .then((snap) => {
        const merged = mergeSettings(snap.exists() ? (snap.data() as Partial<Settings>) : undefined);
        setS(merged);
        setPhonesText(merged.phones.join('\n'));
      })
      .catch((e) => {
        console.error(e);
        setS(defaultSettings);
        setPhonesText(defaultSettings.phones.join('\n'));
      });
  }, []);

  if (!s) return <p>{t('common.loading')}</p>;
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((cur) => (cur ? { ...cur, [k]: v } : cur));
  const str = (k: keyof Settings) => (s[k] as string) ?? '';

  const zones = s.deliveryZones;
  const setZone = (i: number, patch: Partial<DeliveryZone>) => up('deliveryZones', zones.map((z, j) => (j === i ? { ...z, ...patch } : z)));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const out: Settings = {
      ...s,
      phones: phonesText.split('\n').map((x) => x.trim()).filter(Boolean),
      whatsappNumber: s.whatsappNumber.replace(/[^\d]/g, ''),
      deliveryZones: zones.filter((z) => z.name.trim()).map((z) => ({ name: z.name.trim(), nameFr: (z.nameFr ?? '').trim(), fee: Number(z.fee) || 0 })),
    };
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'store'), out);
      toast.show(t('admin.saved'));
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const T = (k: keyof Settings, label: Parameters<typeof t>[0], dir?: 'ltr') => (
    <TextField label={t(label)} value={str(k)} dir={dir} onChange={(v) => up(k, v as never)} />
  );
  const A = (k: keyof Settings, label: Parameters<typeof t>[0], rows = 4) => (
    <AreaField label={t(label)} value={str(k)} rows={rows} onChange={(v) => up(k, v as never)} />
  );

  return (
    <form onSubmit={save}>
      <div className="panel">
        <h2>{t('admin.settings.general')}</h2>
        <div className="form-grid">
          {T('storeName', 'admin.settings.storeName')}
          {T('storeNameFr', 'admin.settings.storeNameFr', 'ltr')}
          {T('tagline', 'admin.settings.tagline')}
          {T('taglineFr', 'admin.settings.taglineFr', 'ltr')}
          {T('city', 'admin.settings.city')}
          {T('cityFr', 'admin.settings.cityFr', 'ltr')}
          <ImageField label={t('admin.settings.logo')} value={s.logoUrl ? [s.logoUrl] : []} onChange={(v) => up('logoUrl', v[0] ?? '')} max={1} folder="logo" />
          <AreaField label={t('admin.settings.phones')} value={phonesText} rows={3} onChange={setPhonesText} />
          <TextField label={t('admin.settings.whatsapp')} dir="ltr" full value={s.whatsappNumber} placeholder="222XXXXXXXX" onChange={(v) => up('whatsappNumber', v)} />
          {!s.whatsappNumber.replace(/[^\d]/g, '') && <p className="notice notice-warn full">{t('admin.settings.whatsappWarn')}</p>}
          {T('facebookUrl', 'admin.settings.facebook', 'ltr')}
          {T('mapsUrl', 'admin.settings.maps', 'ltr')}
          {T('currency', 'admin.settings.currency', 'ltr')}
        </div>
      </div>

      <div className="panel">
        <h2>{t('admin.settings.home')}</h2>
        <div className="form-grid">
          {T('heroTitle', 'admin.settings.heroTitle')}
          {T('heroTitleFr', 'admin.settings.heroTitleFr', 'ltr')}
          {A('heroSubtitle', 'admin.settings.heroSubtitle', 2)}
          {A('heroSubtitleFr', 'admin.settings.heroSubtitleFr', 2)}
          <ImageField label={t('admin.settings.heroImage')} value={s.heroImage ? [s.heroImage] : []} onChange={(v) => up('heroImage', v[0] ?? '')} max={1} folder="hero" />
          {A('offersNote', 'admin.settings.offersNote', 2)}
          {A('offersNoteFr', 'admin.settings.offersNoteFr', 2)}
        </div>
      </div>

      <div className="panel">
        <h2>{t('admin.settings.delivery')}</h2>
        <CheckField label={t('admin.settings.pickup')} checked={s.pickupEnabled} onChange={(v) => up('pickupEnabled', v)} />
        <CheckField label={t('admin.settings.deliveryOn')} checked={s.deliveryEnabled} onChange={(v) => up('deliveryEnabled', v)} />
        {s.deliveryEnabled && (
          <p className="notice notice-ok" style={{ margin: '10px 0' }}>
            {lang === 'fr'
              ? 'La livraison est active pour les clients. Vous pouvez définir des zones et frais ci-dessous, ou laisser vide pour livrer directement à l’adresse indiquée.'
              : 'خدمة التوصيل مفعّلة الآن للزبائن. يمكنك تخصيص مناطق وأسعار محددة أدناه، أو تركها فارغة ليكون التوصيل لعنوان العميل مباشرة.'}
          </p>
        )}
        <div className="form-grid">
          {A('deliveryPolicy', 'admin.settings.deliveryPolicy', 3)}
          {A('deliveryPolicyFr', 'admin.settings.deliveryPolicyFr', 3)}
        </div>
        <h3>{t('admin.settings.zones')}</h3>
        {zones.map((z, i) => (
          <div className="zone-row" key={i}>
            <input className="input" placeholder={t('admin.settings.zoneName')} value={z.name} onChange={(e) => setZone(i, { name: e.target.value })} />
            <input className="input" dir="ltr" placeholder={t('admin.settings.zoneNameFr')} value={z.nameFr ?? ''} onChange={(e) => setZone(i, { nameFr: e.target.value })} />
            <input className="input" dir="ltr" type="number" min={0} placeholder={`${t('admin.settings.zoneFee')} (${s.currency})`} value={z.fee} onChange={(e) => setZone(i, { fee: Number(e.target.value) })} />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => up('deliveryZones', zones.filter((_, j) => j !== i))}>
              {t('common.delete')}
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => up('deliveryZones', [...zones, { name: '', nameFr: '', fee: 0 }])}>
            + {t('admin.settings.addZone')}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              up('deliveryZones', [
                ...zones,
                { name: 'نواكشوط (تفرغ زينة / لكصر)', nameFr: 'Nouakchott (Tevragh Zeina / Ksar)', fee: 100 },
                { name: 'نواكشوط (عرفات / الميناء / الرياض / السبخة)', nameFr: 'Nouakchott (Arafat / El Mina / Riyad / Sebkha)', fee: 100 },
                { name: 'نواكشوط (تيارت / دار النعيم / توجنين)', nameFr: 'Nouakchott (Teyarett / Dar Naim / Toujounine)', fee: 100 },
              ])
            }
          >
            + {lang === 'fr' ? 'Ajouter les zones de Nouakchott' : 'إضافة مناطق نواكشوط الشائعة'}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>{t('admin.settings.pages')}</h2>
        <div className="form-grid">
          {A('aboutText', 'admin.settings.about')}
          {A('aboutTextFr', 'admin.settings.aboutFr')}
          {A('orderPolicy', 'admin.settings.orderPolicy')}
          {A('orderPolicyFr', 'admin.settings.orderPolicyFr')}
          {A('returnPolicy', 'admin.settings.returnPolicy')}
          {A('returnPolicyFr', 'admin.settings.returnPolicyFr')}
          {A('privacyText', 'admin.settings.privacy')}
          {A('privacyTextFr', 'admin.settings.privacyFr')}
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
        {saving ? t('common.loading') : t('common.save')}
      </button>
    </form>
  );
}
