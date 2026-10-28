import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../i18n';
import { useData } from '../state/data';
import { cName, hasDiscount, pName } from '../lib/format';
import { useSeo } from '../lib/useSeo';

type Sort = 'default' | 'asc' | 'desc';

function norm(s: string): string {
  // إزالة التشكيل والتطبيع لتحسين البحث بالعربية والفرنسية
  return s
    .normalize('NFD')
    .replace(/[ً-ٰٟ̀-ͯ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim();
}

export default function Catalog() {
  const { t, lang } = useI18n();
  const { products, categories, settings, loading, error } = useData();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const min = params.get('min') ?? '';
  const max = params.get('max') ?? '';
  const sort = (params.get('sort') as Sort) || 'default';
  const onlyNew = params.get('new') === '1';
  const onlyOffers = params.get('offers') === '1';

  const catName = categories.find((c) => c.id === cat);
  useSeo({
    title: `${catName ? cName(catName, lang) : t('catalog.title')} | ${lang === 'fr' ? settings.storeNameFr : settings.storeName}`,
    description: `${t('catalog.title')} — ${lang === 'fr' ? settings.storeNameFr : settings.storeName}`,
  });

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const nq = norm(q);
    const lo = min === '' ? -Infinity : Number(min);
    const hi = max === '' ? Infinity : Number(max);
    let out = products.filter((p) => {
      if (cat && p.categoryId !== cat) return false;
      if (onlyNew && !p.isNew) return false;
      if (onlyOffers && !hasDiscount(p)) return false;
      if (p.price < lo || p.price > hi) return false;
      if (nq) {
        const hay = norm(`${p.name} ${p.nameFr ?? ''} ${p.brand ?? ''}`);
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
    if (sort === 'asc') out = [...out].sort((a, b) => a.price - b.price);
    else if (sort === 'desc') out = [...out].sort((a, b) => b.price - a.price);
    else out = [...out].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || pName(a, lang).localeCompare(pName(b, lang)));
    return out;
  }, [products, q, cat, min, max, sort, onlyNew, onlyOffers, lang]);

  const hasFilters = Boolean(q || cat || min || max || onlyNew || onlyOffers || sort !== 'default');

  return (
    <div className="container page">
      <h1 className="page-title">{catName ? cName(catName, lang) : t('catalog.title')}</h1>

      <div className="catalog-bar">
        <input
          type="search"
          className="input"
          value={q}
          onChange={(e) => set('q', e.target.value)}
          placeholder={t('catalog.search')}
          aria-label={t('catalog.search')}
        />
        <button type="button" className="btn btn-outline filters-toggle" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
          <Icon name="sliders" size={16} /> {t('catalog.filters')}
        </button>
      </div>

      <div className={`filters ${filtersOpen ? 'filters-open' : ''}`}>
        <label className="field">
          <span>{t('catalog.category')}</span>
          <select className="input" value={cat} onChange={(e) => set('cat', e.target.value)}>
            <option value="">{t('common.all')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {cName(c, lang)}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>
            {t('catalog.price')} ({settings.currency})
          </span>
          <div className="range">
            <input type="number" min={0} inputMode="numeric" className="input" value={min} onChange={(e) => set('min', e.target.value)} placeholder={t('catalog.min')} aria-label={t('catalog.min')} />
            <input type="number" min={0} inputMode="numeric" className="input" value={max} onChange={(e) => set('max', e.target.value)} placeholder={t('catalog.max')} aria-label={t('catalog.max')} />
          </div>
        </div>
        <label className="field">
          <span>{t('catalog.sort')}</span>
          <select className="input" value={sort} onChange={(e) => set('sort', e.target.value === 'default' ? '' : e.target.value)}>
            <option value="default">{t('catalog.sortDefault')}</option>
            <option value="asc">{t('catalog.sortAsc')}</option>
            <option value="desc">{t('catalog.sortDesc')}</option>
          </select>
        </label>
        <div className="field checks">
          <label className="check">
            <input type="checkbox" checked={onlyNew} onChange={(e) => set('new', e.target.checked ? '1' : '')} /> {t('catalog.onlyNew')}
          </label>
          <label className="check">
            <input type="checkbox" checked={onlyOffers} onChange={(e) => set('offers', e.target.checked ? '1' : '')} /> {t('catalog.onlyOffers')}
          </label>
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}>
            {t('catalog.reset')}
          </button>
        )}
      </div>

      {error && (
        <p className="notice notice-err" role="alert">
          {t('common.error')}
        </p>
      )}

      {loading ? (
        <div className="grid">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="empty">{products.length === 0 ? t('catalog.emptyStore') : t('catalog.empty')}</p>
      ) : (
        <>
          <p className="muted" aria-live="polite">
            <bdi>{list.length}</bdi> {t('catalog.results')}
          </p>
          <div className="grid">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
