import { Link } from 'react-router-dom';
import Bottle from '../components/Bottle';
import ContactActions from '../components/ContactActions';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';
import { useData } from '../state/data';
import { cName, hasDiscount, sField } from '../lib/format';
import { useSeo } from '../lib/useSeo';

export default function Home() {
  const { t, lang } = useI18n();
  const { settings, products, categories, loading, error, configured, demo } = useData();

  const name = sField(settings, 'storeName', lang);
  const tag = sField(settings, 'tagline', lang);
  const title = `${name} ${tag} | ${sField(settings, 'city', lang)}`;

  useSeo({
    title,
    description: sField(settings, 'heroSubtitle', lang),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: `${settings.storeName} ${settings.tagline}`,
      alternateName: 'AL TAYYIB AL ASLI — Luxury Perfumes',
      telephone: settings.phones,
      address: { '@type': 'PostalAddress', addressLocality: 'Nouakchott', addressCountry: 'MR' },
      sameAs: settings.facebookUrl ? [settings.facebookUrl] : undefined,
      url: window.location.origin,
    },
  });

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const offers = products.filter(hasDiscount).slice(0, 4);
  const offersNote = sField(settings, 'offersNote', lang);

  return (
    <>
      {demo && <div className="notice notice-warn">{t('home.demoBanner')}</div>}
      {!configured && !demo && <div className="notice notice-warn">{t('home.notConfigured')}</div>}
      {error && (
        <div className="notice notice-err" role="alert">
          {t('common.error')}
        </div>
      )}

      <section className="hero">
        <div className="container hero-in">
          <div className="hero-text">
            <h1>{sField(settings, 'heroTitle', lang)}</h1>
            <p>{sField(settings, 'heroSubtitle', lang)}</p>
            <div className="hero-cta">
              <Link to="/products" className="btn btn-gold btn-lg">
                {t('hero.discover')}
              </Link>
              <Link to="/products?new=1" className="btn btn-outline-light btn-lg">
                {t('hero.shop')}
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden={settings.heroImage ? undefined : true}>
            {settings.heroImage ? (
              <img src={settings.heroImage} alt={name} width={560} height={560} fetchPriority="high" />
            ) : (
              <div className="hero-bottles">
                <Bottle className="hb hb1" />
                <Bottle className="hb hb2" />
                <Bottle className="hb hb3" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <h2 className="section-title">{t('home.categories')}</h2>
          {categories.length === 0 && !loading ? (
            <p className="empty">{t('home.noCategories')}</p>
          ) : (
            <div className="cat-grid">
              {categories.map((c) => (
                <Link key={c.id} to={`/products?cat=${c.id}`} className="cat-card">
                  <div className="cat-media">
                    {c.image ? <img src={c.image} alt="" loading="lazy" decoding="async" /> : <Bottle />}
                  </div>
                  <span>{cName(c, lang)}</span>
                </Link>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      <section className="section section-soft">
        <div className="container">
          <Reveal>
            <h2 className="section-title">{t('home.featured')}</h2>
            {loading ? (
              <div className="grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="card skeleton" />
                ))}
              </div>
            ) : featured.length === 0 ? (
              <p className="empty">{t('home.featuredEmpty')}</p>
            ) : (
              <div className="grid">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            <div className="center">
              <Link to="/products" className="btn btn-primary">
                {t('home.viewAll')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <h2 className="section-title">{t('home.why')}</h2>
          <div className="why-grid">
            {(['1', '2', '3', '4'] as const).map((n) => (
              <div key={n} className="why-item">
                <span className="why-dot" aria-hidden="true">
                  {n}
                </span>
                <h3>{t(`home.why${n}.t` as 'home.why1.t')}</h3>
                <p>{t(`home.why${n}.d` as 'home.why1.d')}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section section-soft" id="offers">
        <div className="container">
          <Reveal>
            <h2 className="section-title">{t('home.offers')}</h2>
            {offersNote && <p className="lead">{offersNote}</p>}
            {offers.length > 0 ? (
              <>
                <div className="grid">
                  {offers.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <div className="center">
                  <Link to="/products?offers=1" className="btn btn-primary">
                    {t('home.offersSee')}
                  </Link>
                </div>
              </>
            ) : (
              !loading && <p className="empty">{t('home.offersEmpty')}</p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <h2 className="section-title">{t('home.contact')}</h2>
          <p className="lead">{t('home.contactText')}</p>
          <ContactActions />
        </Reveal>
      </section>
    </>
  );
}
