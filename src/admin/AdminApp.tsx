import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, firebaseConfigured } from '../lib/firebase';
import { auth } from '../lib/adminFirebase';
import { useI18n } from '../i18n';
import { useSeo } from '../lib/useSeo';
import Logo from '../components/Logo';
import CategoriesAdmin from './CategoriesAdmin';
import OrdersAdmin from './OrdersAdmin';
import ProductsAdmin from './ProductsAdmin';
import SettingsAdmin from './SettingsAdmin';

type Tab = 'orders' | 'products' | 'categories' | 'settings';
type Gate = 'loading' | 'out' | 'denied' | 'ok';

const OWNER_EMAIL = 'medsaleh2217@gmail.com';

export default function AdminApp() {
  const { t, toggle, lang } = useI18n();
  const [gate, setGate] = useState<Gate>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('orders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useSeo({ title: t('admin.title'), noindex: true });

  useEffect(() => {
    if (!auth || !db) return;
    const database = db;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return setGate('out');
      setGate('loading');
      if (u.email === OWNER_EMAIL) {
        setGate('ok');
        return;
      }
      try {
        const snap = await getDoc(doc(database, 'adminUsers', u.uid));
        setGate(snap.exists() ? 'ok' : 'denied');
      } catch {
        setGate('denied');
      }
    });
  }, []);

  if (!firebaseConfigured || !auth) {
    return (
      <div className="admin">
        <div className="login">
          <h1>{t('admin.title')}</h1>
          <p className="notice notice-warn">{t('admin.notConfigured')}</p>
          <Link to="/" className="btn btn-outline">
            {t('admin.viewSite')}
          </Link>
        </div>
      </div>
    );
  }

  const loginGoogle = async () => {
    if (!auth) return;
    setBusy(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError(t('admin.loginFailed'));
    } finally {
      setBusy(false);
    }
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth!, email.trim(), password);
    } catch (err) {
      console.error(err);
      setError(t('admin.loginFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (gate === 'loading') {
    return (
      <div className="admin">
        <p className="center page">{t('admin.checking')}</p>
      </div>
    );
  }

  if (gate === 'out' || !user) {
    return (
      <div className="admin">
        <div className="login">
          <div style={{ marginBottom: 14 }}>
            <Logo />
          </div>
          <h1>{t('admin.login')}</h1>

          <button
            type="button"
            className="btn btn-outline btn-lg"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 16,
              fontWeight: 700,
            }}
            onClick={loginGoogle}
            disabled={busy}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {lang === 'fr' ? 'Se connecter avec Google' : 'دخول بحساب Google (المسؤول)'}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              color: 'var(--muted)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ padding: '0 10px' }}>{lang === 'fr' ? 'ou' : 'أو بالبريد الإلكتروني'}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <form onSubmit={login}>
            <label className="field">
              <span>{t('admin.email')}</span>
              <input
                className="input"
                dir="ltr"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t('admin.password')}</span>
              <input
                className="input"
                dir="ltr"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="notice notice-err">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={busy}
            >
              {busy ? t('common.loading') : t('admin.signIn')}
            </button>
          </form>

          <p className="center" style={{ marginTop: 14 }}>
            <button type="button" className="link-btn" style={{ color: 'var(--navy)' }} onClick={toggle}>
              {t('nav.language')}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (gate === 'denied') {
    return (
      <div className="admin">
        <div className="login">
          <h1>{t('admin.title')}</h1>
          <p className="notice notice-err">{t('admin.notAdmin')}</p>
          <p className="muted small">
            UID: <bdi dir="ltr">{user.uid}</bdi>
          </p>
          <button type="button" className="btn btn-outline" onClick={() => signOut(auth!)}>
            {t('admin.signOut')}
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'orders', label: t('admin.tab.orders') },
    { id: 'products', label: t('admin.tab.products') },
    { id: 'categories', label: t('admin.tab.categories') },
    { id: 'settings', label: t('admin.tab.settings') },
  ];

  return (
    <div className="admin">
      <div className="admin-top">
        <div className="container">
          <h1>{t('admin.title')}</h1>
          <div className="admin-top-actions">
            <button type="button" className="lang-btn" onClick={toggle}>
              {t('nav.language')}
            </button>
            <Link to="/" className="btn btn-outline-light btn-sm">
              {t('admin.viewSite')}
            </Link>
            <button type="button" className="btn btn-gold btn-sm" onClick={() => signOut(auth!)}>
              {t('admin.signOut')}
            </button>
          </div>
        </div>
        <div className="container">
          <div className="tabs" role="tablist">
            {tabs.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={`tab ${tab === x.id ? 'on' : ''}`} onClick={() => setTab(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="container admin-body">
        {tab === 'orders' && <OrdersAdmin />}
        {tab === 'products' && <ProductsAdmin />}
        {tab === 'categories' && <CategoriesAdmin />}
        {tab === 'settings' && <SettingsAdmin />}
      </div>
    </div>
  );
}
