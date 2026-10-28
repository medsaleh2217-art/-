import { Link } from 'react-router-dom';
import Bottle from './Bottle';
import Icon from './Icon';
import { useI18n } from '../i18n';
import { useCart } from '../state/cart';
import { useData } from '../state/data';
import { useToast } from '../state/toast';
import { useWhatsApp } from '../lib/useWhatsApp';
import { formatPrice, hasDiscount, isAvailable, pName } from '../lib/format';
import type { Product } from '../lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  const { settings, demo } = useData();
  const { add } = useCart();
  const toast = useToast();
  const wa = useWhatsApp();
  const available = isAvailable(product);
  const name = pName(product, lang);
  const offer = hasDiscount(product);

  const waText = `${t('wa.single')}\n${name}\n${formatPrice(product.price, settings.currency)}\n${window.location.origin}/product/${product.id}`;
  const waHref = wa.link(waText);

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-media" aria-label={name}>
        {product.images[0] ? (
          <img src={product.images[0]} alt={name} loading="lazy" decoding="async" width={400} height={400} />
        ) : (
          <div className="card-placeholder" aria-label={t('product.noImage')}>
            <Bottle />
          </div>
        )}
        <div className="badges">
          {product.isNew && <span className="badge badge-new">{t('product.new')}</span>}
          {offer && <span className="badge badge-offer">{t('product.offer')}</span>}
          {demo && <span className="badge badge-demo">{t('product.demo')}</span>}
        </div>
        {!available && <div className="soldout">{t('product.outOfStock')}</div>}
      </Link>
      <div className="card-body">
        <h3 className="card-title">
          <Link to={`/product/${product.id}`}>{name}</Link>
        </h3>
        <div className="price-row">
          <bdi className="price">{formatPrice(product.price, settings.currency)}</bdi>
          {offer && product.oldPrice != null && <bdi className="price-old">{formatPrice(product.oldPrice, settings.currency)}</bdi>}
        </div>
        <div className="card-actions">
          <Link to={`/product/${product.id}`} className="btn btn-ghost btn-sm">
            {t('product.details')}
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!available}
            onClick={() => {
              add(product.id, 1);
              toast.show(t('product.added'));
            }}
          >
            <Icon name="cart" size={16} /> {t('product.add')}
          </button>
          {waHref ? (
            <a className="btn btn-wa btn-icon" href={waHref} target="_blank" rel="noopener noreferrer" aria-label={t('product.whatsapp')} title={t('product.whatsapp')}>
              <Icon name="whatsapp" size={18} />
            </a>
          ) : wa.callHref ? (
            <a className="btn btn-wa btn-icon" href={wa.callHref} aria-label={t('product.call')} title={t('product.call')}>
              <Icon name="phone" size={18} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
