import { useEffect, useState, type ReactNode } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n';
import Icon from '../components/Icon';

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  full,
  placeholder,
  min,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  dir?: 'ltr' | 'rtl';
  full?: boolean;
  placeholder?: string;
  min?: number;
}) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>{label}</span>
      <input
        className="input"
        type={type}
        dir={dir}
        value={value}
        min={min}
        placeholder={placeholder}
        inputMode={type === 'number' ? 'decimal' : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function AreaField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="field full">
      <span>{label}</span>
      <textarea className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check full" style={{ margin: '6px 0' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" style={{ color: 'var(--navy)' }} onClick={onClose} aria-label={t('common.close')}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** يقرأ مجموعة كاملة بشكل لحظي (للمسؤول فقط؛ القواعد تمنع غير المسؤول) */
export function useAdminCollection<T extends DocumentData>(name: string): { items: (T & { id: string })[]; loading: boolean; error: string } {
  const [items, setItems] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, name),
      (snap) => {
        setItems(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
        setLoading(false);
        setError('');
      },
      (e) => {
        console.error(e);
        setError(e.message);
        setLoading(false);
      },
    );
  }, [name]);
  return { items, loading, error };
}
