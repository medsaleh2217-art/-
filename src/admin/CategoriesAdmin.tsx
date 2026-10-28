import { useState, type FormEvent } from 'react';
import { addDoc, collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_CATEGORIES } from '../lib/seed';
import { useI18n } from '../i18n';
import { useToast } from '../state/toast';
import type { Category, Product } from '../lib/types';
import ImageField from './ImageField';
import { Modal, TextField, useAdminCollection } from './ui';

interface Form {
  id?: string;
  name: string;
  nameFr: string;
  order: string;
  image: string[];
}

export default function CategoriesAdmin() {
  const { t } = useI18n();
  const toast = useToast();
  const cats = useAdminCollection<Omit<Category, 'id'>>('categories');
  const prods = useAdminCollection<Omit<Product, 'id'>>('products');
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = [...cats.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const countFor = (id: string) => prods.items.filter((p) => p.categoryId === id).length;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !db) return;
    if (!form.name.trim()) return toast.show(t('admin.products.priceError'), 'error');
    const data = {
      name: form.name.trim(),
      nameFr: form.nameFr.trim(),
      order: Number(form.order) || 0,
      image: form.image[0] ?? '',
    };
    setSaving(true);
    try {
      if (form.id) await setDoc(doc(db, 'categories', form.id), data);
      else await addDoc(collection(db, 'categories'), data);
      toast.show(t('admin.saved'));
      setForm(null);
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!db) return;
    if (countFor(id) > 0) return toast.show(t('admin.cats.inUse'), 'error');
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.show(t('admin.deleted'));
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    }
  };

  const createDefaults = async () => {
    if (!db) return;
    try {
      for (const c of DEFAULT_CATEGORIES) {
        if (cats.items.some((x) => x.id === c.id)) continue;
        const { id, ...rest } = c;
        await setDoc(doc(db, 'categories', id), { ...rest, image: '' });
      }
      toast.show(t('admin.saved'));
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    }
  };

  const missingDefaults = DEFAULT_CATEGORIES.some((c) => !cats.items.some((x) => x.id === c.id));

  return (
    <div>
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setForm({ name: '', nameFr: '', order: String(sorted.length + 1), image: [] })}>
          + {t('admin.cats.add')}
        </button>
        {missingDefaults && (
          <button type="button" className="btn btn-outline" onClick={createDefaults}>
            {t('admin.cats.createDefaults')}
          </button>
        )}
      </div>
      {cats.error && <p className="notice notice-err">{cats.error}</p>}
      <div className="panel table-wrap">
        {cats.loading ? (
          <p>{t('common.loading')}</p>
        ) : sorted.length === 0 ? (
          <p className="empty">{t('admin.cats.empty')}</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th></th>
                <th>{t('admin.cats.name')}</th>
                <th>{t('admin.cats.order')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id}>
                  <td>{c.image ? <img className="thumb-s" src={c.image} alt="" /> : <div className="thumb-s" />}</td>
                  <td>
                    <strong>{c.name}</strong> <span className="muted small">({countFor(c.id)} {t('admin.cats.count')})</span>
                  </td>
                  <td>
                    <bdi>{c.order}</bdi>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ id: c.id, name: c.name, nameFr: c.nameFr ?? '', order: String(c.order ?? 0), image: c.image ? [c.image] : [] })}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>
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

      {form && (
        <Modal title={form.id ? t('common.edit') : t('admin.cats.add')} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <TextField label={t('admin.cats.name') + ' *'} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <TextField label={t('admin.cats.nameFr')} dir="ltr" value={form.nameFr} onChange={(v) => setForm({ ...form, nameFr: v })} />
              <TextField label={t('admin.cats.order')} type="number" dir="ltr" value={form.order} onChange={(v) => setForm({ ...form, order: v })} />
              <ImageField label={t('admin.cats.image')} value={form.image} onChange={(v) => setForm({ ...form, image: v })} max={1} folder="categories" />
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
