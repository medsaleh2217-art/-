import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Bottle from '../components/Bottle';
import Icon from '../components/Icon';
import { useI18n } from '../i18n';
import { useCart } from '../state/cart';
import { useData } from '../state/data';
import { useToast } from '../state/toast';
import { buildWhatsAppText, cartHasChanged, makeRef, saveOrder } from '../lib/orders';
import { useWhatsApp } from '../lib/useWhatsApp';
import { digitsOnly, formatPrice, pName } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import type { Order } from '../lib/types';

interface Done {
  ref: string;
  waUrl: string | null;
  saved: boolean;
}

export default function CartPage() {
  const { t, lang } = useI18n();
  const { settings, configured } = useData();
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const toast = useToast();
  const wa = useWhatsApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [zoneName, setZoneName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Done | null>(null);

  useSeo({ title: `${t('cart.title')} | ${lang === 'fr' ? settings.storeNameFr : settings.storeName}`, noindex: true });

  const deliveryAvailable = Boolean(settings.deliveryEnabled);
  const pickupAvailable = Boolean(settings.pickupEnabled) || !deliveryAvailable;
  const hasZones = Boolean(settings.deliveryZones && settings.deliveryZones.length > 0);
  const zone = hasZones ? settings.deliveryZones.find((z) => z.name === zoneName) : undefined;
  const fee = method === 'delivery' && zone ? zone.fee : 0;
  const total = subtotal + fee;
  const valid = useMemo(() => lines.filter((l) => l.product && l.available), [lines]);
  const cur = settings.currency;
  const noChannel = !wa.enabled && !configured;

  // مزامنة الطريقة المحددة مع المتاح
  useEffect(() => {
    if (!pickupAvailable && deliveryAvailable && method === 'pickup') {
      setMethod('delivery');
    } else if (!deliveryAvailable && pickupAvailable && method === 'delivery') {
      setMethod('pickup');
    }
  }, [deliveryAvailable, pickupAvailable, method]);

  const buildDraft = (channel: 'whatsapp' | 'site'): Omit<Order, 'id'> => ({
    ref: makeRef(),
    customerName: name.trim(),
    phone: phone.trim(),
    city: city.trim(),
    address: method === 'delivery' ? address.trim() : undefined,
    notes: notes.trim() || undefined,
    method,
    zone: method === 'delivery' ? zone?.name : undefined,
    deliveryFee: fee,
    items: valid.map((l) => ({
      productId: l.productId,
      name: l.product!.name,
      price: l.product!.price,
      qty: l.qty,
    })),
    subtotal,
    total,
    status: 'new',
    channel,
    createdAt: Date.now(),
    lang,
  });

  const submit = async (e: FormEvent | null, channel: 'whatsapp' | 'site') => {
    e?.preventDefault();
    setError('');
    if (!name.trim() || !city.trim() || digitsOnly(phone).length < 6) {
      return setError(t('cart.requiredError'));
    }
    if (method === 'delivery') {
      if (!address.trim()) {
        return setError(lang === 'fr' ? 'Veuillez saisir une adresse de livraison.' : 'يُرجى إدخال عنوان التوصيل.');
      }
      if (hasZones && !zone) {
        return setError(t('cart.zoneError'));
      }
    }

    setBusy(true);
    try {
      if (await cartHasChanged(valid)) {
        setError(t('cart.priceChanged'));
        return;
      }
      const draft = buildDraft(channel);
      let saved = false;
      if (configured) {
        try {
          await saveOrder(draft);
          saved = true;
        } catch (err) {
          console.error(err);
          // قناة الموقع تعتمد على الحفظ؛ أما واتساب فيستمر حتى لو تعذّر الحفظ
          if (channel === 'site') {
            setError(t('cart.saveFailed'));
            return;
          }
        }
      }
      let waUrl: string | null = null;
      if (channel === 'whatsapp') {
        // نص الرسالة بلغة العميل مع ترميز URL صحيح (encodeURIComponent داخل waLink)
        waUrl = wa.link(buildWhatsAppText(draft, cur, t));
        if (!waUrl) {
          setError(t('cart.noWhatsapp'));
          return;
        }
        try {
          window.open(waUrl, '_blank', 'noopener');
        } catch {
          /* ignore popup blocker in iframe */
        }
      }
      setDone({ ref: draft.ref, waUrl, saved });
      clear();
    } catch (err) {
      console.error(err);
      setError(t('common.error'));
      toast.show(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="container page center success">
        <div className="success-icon">
          <Icon name="check" size={36} />
        </div>
        <h1 className="page-title">{t('cart.successTitle')}</h1>
        <p>{t('cart.successText')}</p>
        <p>
          {t('cart.orderRef')}: <bdi className="ref">{done.ref}</bdi>
        </p>
        {done.waUrl && (
          <p>
            <a className="btn btn-wa btn-lg" href={done.waUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" /> {t('cart.openWhatsapp')}
            </a>
          </p>
        )}
        <Link to="/products" className="btn btn-primary">
          {t('cart.newOrder')}
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container page center">
        <h1 className="page-title">{t('cart.title')}</h1>
        <p className="empty">{t('cart.empty')}</p>
        <Link to="/products" className="btn btn-primary">
          {t('cart.continue')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page-title">{t('cart.title')}</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {lines.map((l) => (
            <li key={l.productId} className={`cart-line ${!l.available ? 'cart-off' : ''}`}>
              <div className="cart-thumb">
                {l.product?.images[0] ? <img src={l.product.images[0]} alt="" loading="lazy" width={72} height={72} /> : <Bottle />}
              </div>
              <div className="cart-info">
                <Link to={`/product/${l.productId}`} className="cart-name">
                  {l.product ? pName(l.product, lang) : l.productId}
                </Link>
                {l.product && <bdi className="muted">{formatPrice(l.product.price, cur)}</bdi>}
                {!l.available && <p className="warn">{t('cart.unavailable')}</p>}
                {l.available && l.maxQty !== Infinity && l.qty >= l.maxQty && (
                  <p className="muted small">
                    {t('cart.maxQty')}: <bdi>{l.maxQty}</bdi>
                  </p>
                )}
              </div>
              {l.available && (
                <div className="qty">
                  <button type="button" onClick={() => setQty(l.productId, l.qty - 1)} aria-label="-">
                    <Icon name="minus" size={16} />
                  </button>
                  <bdi>{l.qty}</bdi>
                  <button type="button" onClick={() => setQty(l.productId, l.qty + 1)} aria-label="+" disabled={l.qty >= l.maxQty}>
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              )}
              <div className="cart-sub">
                {l.product && l.available && <bdi>{formatPrice(l.product.price * l.qty, cur)}</bdi>}
                <button type="button" className="link-btn" onClick={() => remove(l.productId)}>
                  <Icon name="trash" size={14} /> {t('cart.remove')}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form className="checkout" onSubmit={(e) => submit(e, 'whatsapp')} noValidate>
          <h2>{t('cart.checkout')}</h2>
          <label className="field">
            <span>{t('cart.name')} *</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required />
          </label>
          <label className="field">
            <span>{t('cart.phone')} *</span>
            <input className="input" dir="ltr" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={30} required />
          </label>
          <label className="field">
            <span>{t('cart.city')} *</span>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" maxLength={100} required />
          </label>

          <fieldset className="field">
            <legend>{t('cart.method')}</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {deliveryAvailable && (
                <label className="check" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'delivery'}
                    onChange={() => setMethod('delivery')}
                  />
                  <span>
                    <strong>{t('cart.deliveryOpt')}</strong>
                    <span className="muted small" style={{ display: 'block' }}>
                      {hasZones
                        ? (lang === 'fr' ? 'Livraison selon la zone' : 'توصيل للعنوان حسب المنطقة')
                        : (lang === 'fr' ? 'Livraison directe à votre adresse' : 'توصيل مباشر إلى عنوانك وموقعك')}
                    </span>
                  </span>
                </label>
              )}
              {pickupAvailable && (
                <label className="check" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'pickup'}
                    onChange={() => setMethod('pickup')}
                  />
                  <span>
                    <strong>{t('cart.pickup')}</strong>
                    <span className="muted small" style={{ display: 'block' }}>
                      {lang === 'fr' ? 'Retrait direct en boutique' : 'استلام مباشر من مقر المتجر'}
                    </span>
                  </span>
                </label>
              )}
            </div>
            {!deliveryAvailable && <p className="muted small" style={{ marginTop: 8 }}>{t('cart.noDeliveryNote')}</p>}
          </fieldset>

          {method === 'delivery' && deliveryAvailable && (
            <>
              {hasZones && (
                <label className="field">
                  <span>{t('cart.zone')} *</span>
                  <select
                    className="input"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    required
                  >
                    <option value="">{t('cart.zoneSelect')}</option>
                    {settings.deliveryZones.map((z) => (
                      <option key={z.name} value={z.name}>
                        {lang === 'fr' && z.nameFr ? z.nameFr : z.name} — {formatPrice(z.fee, cur)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                <span>{t('cart.address')} *</span>
                <input
                  className="input"
                  placeholder={lang === 'fr' ? 'Ex: Quartier, Rue, près de...' : 'مثال: المقاطعة / الحي، الشارع، قرب...'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={300}
                  required
                />
              </label>
            </>
          )}

          <label className="field">
            <span>{t('cart.notes')}</span>
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </label>

          <dl className="totals">
            <dt>{t('cart.subtotal')}</dt>
            <dd>
              <bdi>{formatPrice(subtotal, cur)}</bdi>
            </dd>
            {method === 'delivery' && (
              <>
                <dt>{t('cart.delivery')}</dt>
                <dd>
                  <bdi>{formatPrice(fee, cur)}</bdi>
                </dd>
              </>
            )}
            <dt className="grand">{t('cart.total')}</dt>
            <dd className="grand">
              <bdi>{formatPrice(total, cur)}</bdi>
            </dd>
          </dl>

          <p className="muted small">{t('cart.policyNote')}</p>
          {error && (
            <p className="notice notice-err" role="alert">
              {error}
            </p>
          )}
          {noChannel && <p className="notice notice-warn">{t('cart.noChannel')}</p>}
          {!wa.enabled && configured && <p className="muted small">{t('cart.noWhatsapp')}</p>}

          <div className="checkout-actions">
            {wa.enabled && (
              <button type="submit" className="btn btn-wa btn-lg" disabled={busy || valid.length === 0}>
                <Icon name="whatsapp" /> {busy ? t('cart.sending') : t('cart.sendWhatsapp')}
              </button>
            )}
            {configured && (
              <button type="button" className={`btn btn-lg ${wa.enabled ? 'btn-outline' : 'btn-primary'}`} disabled={busy || valid.length === 0} onClick={() => submit(null, 'site')}>
                {busy ? t('cart.sending') : t('cart.sendSite')}
              </button>
            )}
            {noChannel && wa.callHref && (
              <a className="btn btn-primary btn-lg" href={wa.callHref}>
                <Icon name="phone" /> {t('product.call')}
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
