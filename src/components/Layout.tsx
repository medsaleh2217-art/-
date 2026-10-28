import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Bottle from './Bottle';
import Icon from './Icon';
import Logo from './Logo';
import { useI18n, type TKey } from '../i18n';
import { useCart } from '../state/cart';
import { useData } from '../state/data';
import { telHref } from '../lib/format';

const NAV: { to: string; key: TKey; end?: boolean }[] = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/products', key: 'nav.all', end: true },
  { to: '/products?cat=men', key: 'nav.men' },
  { to: '/products?cat=women', key: 'nav.women' },
  { to: '/products?offers=1', key: 'nav.offers' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
];

function Splash() {
  const { settings } = useData();
  const { lang } = useI18n();
  const [visible, setVisible] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return !sessionStorage.getItem('tayyib.splash');
    } catch {
      return false;
    }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem('tayyib.splash', '1');
    } catch {
      /* تجاهل */
    }
    const a = window.setTimeout(() => setLeaving(true), 1100);
    const b = window.setTimeout(() => setVisible(false), 1600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [visible]);

  if (!visible) return null;
  const name = lang === 'fr' ? settings.storeNameFr : settings.storeName;
  const tag = lang === 'fr' ? settings.taglineFr : settings.tagline;
  return (
    <div className={`splash ${leaving ? 'splash-out' : ''}`} onClick={() => setVisible(false)} role="presentation">
      <div className="splash-inner">
        {settings.logoUrl ? <img src={settings.logoUrl} alt="" className="splash-logo-img" /> : <Bottle className="splash-bottle" />}
        <div className="splash-mist" aria-hidden="true">
          <i /> <i /> <i />
        </div>
        <h1 className="splash-title">
          {name} {tag}
        </h1>
      </div>
    </div>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    setQ('');
    onClose();
  };
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('common.search')}>
      <form className="search-box" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <Icon name="search" />
        <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.searchPlaceholder')} aria-label={t('common.search')} />
        <button type="submit" className="btn btn-primary btn-sm">
          {t('common.search')}
        </button>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
          <Icon name="close" />
        </button>
      </form>
    </div>
  );
}

function Header() {
  const { t, toggle } = useI18n();
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenu(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu]);

  // NavLink لا يميّز الاستعلام؛ نحدد الفعّال يدويًا للروابط ذات ?cat
  const isActive = (to: string, end?: boolean) => {
    const [path, qs] = to.split('?');
    if (qs) return location.pathname === path && location.search === `?${qs}`;
    if (path === '/products') return location.pathname === path && !location.search.includes('cat=') && !location.search.includes('offers=');
    return end ? location.pathname === path : location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="container header-in">
        <Link to="/" className="brand" aria-label={t('nav.home')}>
          <Logo light />
        </Link>
        <nav className="nav-desktop" aria-label="main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={() => (isActive(n.to, n.end) ? 'nav-link active' : 'nav-link')}>
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button type="button" className="lang-btn" onClick={toggle} aria-label="Language / اللغة">
            <Icon name="globe" size={16} /> {t('nav.language')}
          </button>
          <button type="button" className="icon-btn" onClick={() => setSearch(true)} aria-label={t('common.search')}>
            <Icon name="search" />
          </button>
          <Link to="/cart" className="icon-btn cart-btn" aria-label={`${t('nav.cart')} (${count})`}>
            <Icon name="cart" />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button type="button" className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label={t('nav.menu')} aria-expanded={menu}>
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {menu && <div className="drawer-backdrop" onClick={() => setMenu(false)} />}
      <aside className={`drawer ${menu ? 'drawer-open' : ''}`} aria-hidden={!menu} aria-label={t('nav.menu')}>
        <div className="drawer-head">
          <Logo size={36} />
          <button type="button" className="icon-btn" onClick={() => setMenu(false)} aria-label={t('common.close')} tabIndex={menu ? 0 : -1}>
            <Icon name="close" />
          </button>
        </div>
        <nav className="drawer-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={() => (isActive(n.to, n.end) ? 'drawer-link active' : 'drawer-link')} tabIndex={menu ? 0 : -1}>
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn btn-outline" onClick={toggle} tabIndex={menu ? 0 : -1}>
          <Icon name="globe" size={16} /> {t('nav.language')}
        </button>
      </aside>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </header>
  );
}

function Footer() {
  const { t, lang } = useI18n();
  const { settings } = useData();
  const name = lang === 'fr' ? settings.storeNameFr : settings.storeName;
  const tag = lang === 'fr' ? settings.taglineFr : settings.tagline;
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p className="footer-name">
            {name} {tag}
          </p>
          <p className="footer-muted">{lang === 'fr' ? settings.cityFr : settings.city}</p>
        </div>
        <div>
          <h2 className="footer-h">{t('footer.links')}</h2>
          <ul className="footer-list">
            {NAV.slice(0, 2).concat(NAV.slice(5)).map((n) => (
              <li key={n.to}>
                <Link to={n.to}>{t(n.key)}</Link>
              </li>
            ))}
            <li>
              <Link to="/privacy">{t('page.privacy')}</Link>
            </li>
            <li>
              <Link to="/policy">{t('page.policy')}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-h">{t('footer.contact')}</h2>
          <ul className="footer-list">
            {settings.phones.map((p) => (
              <li key={p}>
                <a href={telHref(p)}>
                  <Icon name="phone" size={14} /> <bdi dir="ltr">{p}</bdi>
                </a>
              </li>
            ))}
            {settings.facebookUrl && (
              <li>
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
                  <Icon name="facebook" size={14} /> Facebook
                </a>
              </li>
            )}
            {settings.mapsUrl && (
              <li>
                <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Icon name="pin" size={14} /> {t('contact.map')}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {name} — {t('footer.rights')}
        </span>
        <Link to="/admin" className="footer-admin">
          {t('footer.admin')}
        </Link>
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  const { t } = useI18n();
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <Splash />
      <ScrollToTop />
      <Header />
      {!online && (
        <div className="offline-bar" role="alert">
          {t('common.offline')}
        </div>
      )}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
