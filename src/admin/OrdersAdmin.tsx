import { useMemo, useState } from 'react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n, type TKey } from '../i18n';
import { useToast } from '../state/toast';
import { useData } from '../state/data';
import { formatPrice, telHref } from '../lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus, type Product } from '../lib/types';
import { Modal, useAdminCollection } from './ui';

export default function OrdersAdmin() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { settings } = useData();
  const orders = useAdminCollection<Omit<Order, 'id'>>('orders');
  const prods = useAdminCollection<Omit<Product, 'id'>>('products');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const cur = settings.currency;
  const locale = lang === 'fr' ? 'fr-FR' : 'ar-MR-u-nu-latn';

  const fmtDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return new Date(ts).toLocaleString('en-GB');
    }
  };

  const list = useMemo(() => {
    const nq = q.trim().toLowerCase();
    const lo = from ? new Date(from + 'T00:00:00').getTime() : -Infinity;
    const hi = to ? new Date(to + 'T23:59:59').getTime() : Infinity;
    return orders.items
      .filter((o) => (!status || o.status === status) && o.createdAt >= lo && o.createdAt <= hi)
      .filter((o) => !nq || `${o.customerName} ${o.phone} ${o.ref}`.toLowerCase().includes(nq))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders.items, q, status, from, to]);

  const setOrderStatus = async (id: string, next: OrderStatus) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', id), { status: next });
      toast.show(t('admin.saved'));
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    }
  };

  const deleteOrder = async (id: string, ref: string) => {
    if (!db) return;
    const confirmMsg =
      lang === 'fr'
        ? `Êtes-vous sûr de vouloir supprimer définitivement la commande ${ref} ?`
        : `هل أنت متأكد من حذف الطلب ${ref} نهائياً؟`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      toast.show(lang === 'fr' ? 'Commande supprimée avec succès' : 'تم حذف الطلب بنجاح');
      if (openId === id) setOpenId(null);
    } catch (err) {
      console.error(err);
      toast.show(t('admin.saveFailed'), 'error');
    }
  };

  const open = orders.items.find((o) => o.id === openId);
  const mismatch = (it: Order['items'][number]) => {
    const p = prods.items.find((x) => x.id === it.productId);
    return !p || p.price !== it.price;
  };

  const statusLabel = (s: OrderStatus) => t(`status.${s}` as TKey);

  return (
    <div>
      <div className="toolbar">
        <input className="input" type="search" placeholder={t('admin.orders.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value as '' | OrderStatus)} aria-label={t('admin.orders.status')}>
          <option value="">{t('admin.orders.status')}: {t('common.all')}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <label className="check small">
          {t('admin.orders.from')} <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="check small">
          {t('admin.orders.to')} <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      {orders.error && <p className="notice notice-err">{orders.error}</p>}
      <div className="panel table-wrap">
        {orders.loading ? (
          <p>{t('common.loading')}</p>
        ) : list.length === 0 ? (
          <p className="empty">{t('admin.orders.empty')}</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('cart.orderRef')}</th>
                <th>{t('admin.orders.date')}</th>
                <th>{t('admin.orders.customer')}</th>
                <th>{t('cart.total')}</th>
                <th>{t('admin.orders.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>
                    <bdi>{o.ref}</bdi>
                  </td>
                  <td>
                    <bdi>{fmtDate(o.createdAt)}</bdi>
                  </td>
                  <td>
                    {o.customerName}
                    <div className="muted small">
                      <bdi dir="ltr">{o.phone}</bdi>
                    </div>
                  </td>
                  <td>
                    <bdi>{formatPrice(o.total, cur)}</bdi>
                  </td>
                  <td>
                    <select className={`input tag tag-${o.status}`} value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value as OrderStatus)} aria-label={t('admin.orders.status')}>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenId(o.id)}>
                        {t('admin.orders.details')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        title={lang === 'fr' ? 'Supprimer' : 'حذف الطلب'}
                        onClick={() => deleteOrder(o.id, o.ref)}
                      >
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

      {open && (
        <Modal title={`${t('admin.orders.details')} — ${open.ref}`} onClose={() => setOpenId(null)}>
          <dl className="kv">
            <dt>{t('admin.orders.date')}</dt>
            <dd>
              <bdi>{fmtDate(open.createdAt)}</bdi>
            </dd>
            <dt>{t('admin.orders.customer')}</dt>
            <dd>{open.customerName}</dd>
            <dt>{t('cart.phone')}</dt>
            <dd>
              <bdi dir="ltr">{open.phone}</bdi>
            </dd>
            <dt>{t('cart.city')}</dt>
            <dd>{open.city}</dd>
            <dt>{t('cart.method')}</dt>
            <dd>
              {open.method === 'delivery' ? `${t('cart.deliveryOpt')}${open.zone ? ` (${open.zone})` : ''}` : t('cart.pickup')}
            </dd>
            {open.address && (
              <>
                <dt>{t('cart.address')}</dt>
                <dd>{open.address}</dd>
              </>
            )}
            {open.notes && (
              <>
                <dt>{t('cart.notes')}</dt>
                <dd>{open.notes}</dd>
              </>
            )}
            <dt>{t('admin.orders.channel')}</dt>
            <dd>{t(open.channel === 'whatsapp' ? 'admin.orders.channel.whatsapp' : 'admin.orders.channel.site')}</dd>
          </dl>

          <h3>{t('admin.orders.items')}</h3>
          <div className="table-wrap">
            <table className="tbl">
              <tbody>
                {open.items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      {it.name}
                      {mismatch(it) && <p className="warn">{t('admin.orders.mismatch')}</p>}
                    </td>
                    <td>
                      <bdi>
                        {it.qty} × {formatPrice(it.price, cur)}
                      </bdi>
                    </td>
                    <td>
                      <bdi>{formatPrice(it.qty * it.price, cur)}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="totals">
            <dt>{t('cart.subtotal')}</dt>
            <dd>
              <bdi>{formatPrice(open.subtotal, cur)}</bdi>
            </dd>
            {open.method === 'delivery' && (
              <>
                <dt>{t('cart.delivery')}</dt>
                <dd>
                  <bdi>{formatPrice(open.deliveryFee, cur)}</bdi>
                </dd>
              </>
            )}
            <dt className="grand">{t('cart.total')}</dt>
            <dd className="grand">
              <bdi>{formatPrice(open.total, cur)}</bdi>
            </dd>
          </dl>
          <p className="muted small">{t('admin.orders.stockNote')}</p>
          <div className="modal-foot">
            <a className="btn btn-outline" href={telHref(open.phone)}>
              {t('admin.orders.callCustomer')}
            </a>
            <select className="input" style={{ maxWidth: 200 }} value={open.status} onChange={(e) => setOrderStatus(open.id, e.target.value as OrderStatus)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => deleteOrder(open.id, open.ref)}
            >
              {lang === 'fr' ? 'Supprimer la commande' : 'حذف الطلب'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
