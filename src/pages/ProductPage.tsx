import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Bottle from '../components/Bottle';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../i18n';
import { useCart } from '../state/cart';
import { useData } from '../state/data';
import { useToast } from '../state/toast';
import { useWhatsApp } from '../lib/useWhatsApp';
import { cName, discountPercent, formatPrice, hasDiscount, isAvailable, pDesc, pName } from '../lib/format';
import { useSeo } from '../lib/useSeo';

export default function ProductPage() {
  const { id = '' } = useParams();
  const { t, lang } = useI18n();
  const { products, categories, settings, loading, demo } = useData();
  const { add } = useCart();
  const toast = useToast();
  const wa = useWhatsApp();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);

  const product = products.find((p) => p.id === id);
  useEffect(() => {
    setQty(1);
    setImg(0);
  }, [id]);

  const name = product ? pName(product, lang) : t('common.loading');
  const desc = product ? pDesc(product, lang) : '';
  const storeName = lang === 'fr' ? settings.storeNameFr : settings.storeName;

  useSeo({
    title: product ? `${name} | ${storeName}` : `${t('product.notFound')} | ${storeName}`,
    description: desc || (product ? `${name} — ${storeName}` : undefined),
    image: product?.images[0],
    noindex: !product && !loading,
    jsonLd: product && {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      image: product.images.filter((i) => /^https?:/.test(i)),
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: settings.currency,
        price: product.price,
        availability: isAvailable(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: window.location.href,
      },
    },
  });

  if (!product) {
    return (
      <div className="container page center">
        {loading ? <p>{t('common.loading')}</p> : <p className="empty">{t('product.notFound')}</p>}
        {!loading && (
          <Link to="/products" className="btn btn-primary">
            {t('nav.all')}
          </Link>
        )}
      </div>
    );
  }

  const cat = categories.find((c) => c.id === product.categoryId);
  const available = isAvailable(product);
  const maxQty = product.stock == null ? 99 : Math.max(0, product.stock);
  const offer = hasDiscount(product);
  const related = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  const waText = `${t('wa.single')}\n${name} × ${qty}\n${formatPrice(product.price * qty, settings.currency)}\n${window.location.href}`;
  const waHref = wa.link(waText);

  return (
    <div className="container page">
      <nav className="crumbs" aria-label="breadcrumb">
        <Link to="/">{t('nav.home')}</Link> / <Link to="/products">{t('nav.all')}</Link>
        {cat && (
          <>
            {' '}
            / <Link to={`/products?cat=${cat.id}`}>{cName(cat, lang)}</Link>
          </>
        )}
      </nav>

      <div className="pdp">
        <div className="gallery">
          <div className="gallery-main">
            {product.images[img] ? (
              <img src={product.images[img]} alt={name} width={700} height={700} fetchPriority="high" />
            ) : (
              <div className="card-placeholder big">
                <Bottle label={name} />
              </div>
            )}
            {offer && <span className="badge badge-offer pdp-badge">-{discountPercent(product)}%</span>}
          </div>
          {product.images.length > 1 && (
            <div className="thumbs">
              {product.images.map((src, i) => (
                <button key={i} type="button" className={`thumb ${i === img ? 'on' : ''}`} onClick={() => setImg(i)} aria-label={`${i + 1}`}>
                  <img src={src} alt="" loading="lazy" width={80} height={80} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <div className="badges static">
            {product.isNew && <span className="badge badge-new">{t('product.new')}</span>}
            {demo && <span className="badge badge-demo">{t('product.demo')}</span>}
          </div>
          <h1>{name}</h1>
          <div className="price-row big">
            <bdi className="price">{formatPrice(product.price, settings.currency)}</bdi>
            {offer && product.oldPrice != null && <bdi className="price-old">{formatPrice(product.oldPrice, settings.currency)}</bdi>}
          </div>
          {desc && <p className="pdp-desc">{desc}</p>}

          <dl className="specs">
            {cat && (
              <>
                <dt>{t('product.category')}</dt>
                <dd>{cName(cat, lang)}</dd>
              </>
            )}
            {product.brand && (
              <>
                <dt>{t('product.brand')}</dt>
                <dd>{product.brand}</dd>
              </>
            )}
            {product.sizeMl ? (
              <>
                <dt>{t('product.size')}</dt>
                <dd>
                  <bdi>{product.sizeMl}</bdi> {t('product.ml')}
                </dd>
              </>
            ) : null}
            {product.stock != null && (
              <>
                <dt>{t('product.available')}</dt>
                <dd>{available ? <bdi>{product.stock}</bdi> : t('product.outOfStock')}</dd>
              </>
            )}
          </dl>

          {available ? (
            <>
              <div className="qty-row">
                <span>{t('product.qty')}</span>
                <div className="qty">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-" disabled={qty <= 1}>
                    <Icon name="minus" size={16} />
                  </button>
                  <bdi aria-live="polite">{qty}</bdi>
                  <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="+" disabled={qty >= maxQty}>
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>
              <div className="pdp-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    add(product.id, qty);
                    toast.show(t('product.added'));
                  }}
                >
                  <Icon name="cart" /> {t('product.add')}
                </button>
                {waHref ? (
                  <a className="btn btn-wa btn-lg" href={waHref} target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" /> {t('product.whatsapp')}
                  </a>
                ) : wa.callHref ? (
                  <a className="btn btn-wa btn-lg" href={wa.callHref}>
                    <Icon name="phone" /> {t('product.call')}
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <p className="notice notice-warn">{t('product.outOfStock')}</p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2 className="section-title">{t('product.related')}</h2>
          <div className="grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
