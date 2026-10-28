import { useMemo, useState, type FormEvent } from 'react';
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n';
import { useToast } from '../state/toast';
import { formatPrice } from '../lib/format';
import { useData } from '../state/data';
import type { Category, Product } from '../lib/types';
import ImageField from './ImageField';
import { AreaField, CheckField, Modal, TextField, useAdminCollection } from './ui';

interface Form {
  id?: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  price: string;
  oldPrice: string;
  categoryId: string;
  brand: string;
  sizeMl: string;
  stock: string;
  featured: boolean;
  isNew: boolean;
  hidden: boolean;
  images: string[];
  createdAt?: number;
}

const empty: Form = {
  name: '', nameFr: '', description: '', descriptionFr: '', price: '', oldPrice: '', categoryId: '',
  brand: '', sizeMl: '', stock: '', featured: false, isNew: true, hidden: false, images: [],
};

const num = (s: string): number | null => (s.trim() === '' || !Number.isFinite(Number(s)) ? null : Number(s));

export default function ProductsAdmin() {
  const { t } = useI18n();
  const toast = useToast();
  const { settings } = useData();
  const { items, loading, error } = useAdminCollection<Omit<Product, 'id'>>('products');
  const cats = useAdminCollection<Omit<Category, 'id'>>('categories');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const catName = (id: string) => cats.items.find((c) => c.id === id)?.name ?? '—';
  const list = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return [...items]
      .filter((p) => !nq || `${p.name} ${p.nameFr ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(nq))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [items, q]);

  const edit = (p: Product & { id: string }) =>
    setForm({
      id: p.id,
      name: p.name ?? '',
      nameFr: p.nameFr ?? '',
      description: p.description ?? '',
      descriptionFr: p.descriptionFr ?? '',
      price: String(p.price ?? ''),
      oldPrice: p.oldPrice != null ? String(p.oldPrice) : '',
      categoryId: p.categoryId ?? '',
      brand: p.brand ?? '',
      sizeMl: p.sizeMl != null ? String(p.sizeMl) : '',
      stock: p.stock != null ? String(p.stock) : '',
      featured: !!p.featured,
      isNew: !!p.isNew,
      hidden: !!p.hidden,
      images: p.images ?? [],
      createdAt: p.createdAt,
    });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !db) return;
    const price = num(form.price);
    if (!form.name.trim() || price == null || price < 0 || !form.categoryId) return toast.show(t('admin.products.priceError'), 'error');
    const oldPrice = num(form.oldPrice);
    if (oldPrice != null && oldPrice <= price) return toast.show(t('admin.products.oldPriceError'), 'error');
    const stock = num(form.stock);
    const data = {
      name: form.name.trim(),
      nameFr: form.nameFr.trim(),
      description: form.description.trim(),
      descriptionFr: form.descriptionFr.trim(),
      price,
      oldPrice,
      categoryId: form.categoryId,
      brand: form.brand.trim(),
      sizeMl: num(form.sizeMl),
      stock: stock == null ? null : Math.max(0, Math.floor(stock)),
      featured: form.featured,
      isNew: form.isNew,
      hidden: form.hidden,
      images: form.images.slice(0, 4),
      createdAt: form.createdAt ?? Date.now(),
    };
    setSaving(true);
    try {
      if (form.id) await setDoc(doc(db, 'products', form.id), data);
      else await addDoc(collection(db, 'products'), data);
      toast.show(t('admin.saved'));
      setForm(null);
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: { id: string }) => {
    if (!db || !window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'products', p.id));
      toast.show(t('admin.deleted'));
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    }
  };

  const toggleHidden = async (p: Product & { id: string }) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'products', p.id), { hidden: !p.hidden });
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    }
  };

  const f = form;
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setForm((cur) => (cur ? { ...cur, [k]: v } : cur));

  return (
    <div>
      <div className="toolbar">
        <input className="input" type="search" placeholder={t('admin.products.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="grow" />
        <button type="button" className="btn btn-primary" onClick={() => setForm({ ...empty, categoryId: cats.items[0]?.id ?? '' })}>
          + {t('admin.products.add')}
        </button>
      </div>

      {error && <p className="notice notice-err">{error}</p>}
      <div className="panel table-wrap">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : list.length === 0 ? (
          <p className="empty">{t('admin.products.empty')}</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th></th>
                <th>{t('admin.products.name')}</th>
                <th>{t('admin.products.category')}</th>
                <th>{t('admin.products.price')}</th>
                <th>{t('admin.products.stockBadge')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.images?.[0] ? <img className="thumb-s" src={p.images[0]} alt="" /> : <div className="thumb-s" />}</td>
                  <td>
                    <strong>{p.name}</strong>{' '}
                    {p.hidden && <span className="tag tag-cancelled">{t('admin.products.hiddenBadge')}</span>}{' '}
                    {p.featured && <span className="tag">★</span>}
                  </td>
                  <td>{catName(p.categoryId)}</td>
                  <td>
                    <bdi>{formatPrice(p.price, settings.currency)}</bdi>
                    {p.oldPrice != null && p.oldPrice > p.price && (
                      <div className="muted small">
                        <s>
                          <bdi>{formatPrice(p.oldPrice, settings.currency)}</bdi>
                        </s>
                      </div>
                    )}
                  </td>
                  <td>{p.stock == null ? '—' : <bdi>{p.stock}</bdi>}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => edit(p)}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleHidden(p)}>
                        {p.hidden ? t('admin.products.showBtn') : t('admin.products.hideBtn')}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(p)}>
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {f && (
        <Modal title={f.id ? t('admin.products.edit') : t('admin.products.add')} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <TextField label={t('admin.products.name') + ' *'} value={f.name} onChange={(v) => up('name', v)} />
              <TextField label={t('admin.products.nameFr')} value={f.nameFr} dir="ltr" onChange={(v) => up('nameFr', v)} />
              <AreaField label={t('admin.products.desc')} value={f.description} onChange={(v) => up('description', v)} />
              <AreaField label={t('admin.products.descFr')} value={f.descriptionFr} onChange={(v) => up('descriptionFr', v)} />
              <TextField label={t('admin.products.price') + ` (${settings.currency}) *`} type="number" min={0} value={f.price} dir="ltr" onChange={(v) => up('price', v)} />
              <TextField label={t('admin.products.oldPrice')} type="number" min={0} value={f.oldPrice} dir="ltr" onChange={(v) => up('oldPrice', v)} />
              <label className="field">
                <span>{t('admin.products.category')} *</span>
                <select className="input" value={f.categoryId} onChange={(e) => up('categoryId', e.target.value)}>
                  <option value="">{t('admin.products.categoryPick')}</option>
                  {cats.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label={t('admin.products.brand')} value={f.brand} onChange={(v) => up('brand', v)} />
              <TextField label={t('admin.products.size')} type="number" min={0} value={f.sizeMl} dir="ltr" onChange={(v) => up('sizeMl', v)} />
              <TextField label={t('admin.products.stock')} type="number" min={0} value={f.stock} dir="ltr" onChange={(v) => up('stock', v)} />
              <ImageField label={t('admin.products.images')} value={f.images} onChange={(v) => up('images', v)} max={4} folder="products" />
              <CheckField label={t('admin.products.featured')} checked={f.featured} onChange={(v) => up('featured', v)} />
              <CheckField label={t('admin.products.isNew')} checked={f.isNew} onChange={(v) => up('isNew', v)} />
              <CheckField label={t('admin.products.hidden')} checked={f.hidden} onChange={(v) => up('hidden', v)} />
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
