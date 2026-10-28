import { useRef, useState } from 'react';
import Icon from '../components/Icon';
import { useI18n } from '../i18n';
import { useToast } from '../state/toast';
import { processImage } from './images';

export default function ImageField({
  label,
  value,
  onChange,
  max,
  folder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
  folder: string;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');

  const onFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const next = [...value];
      for (const f of Array.from(files)) {
        if (next.length >= max) {
          toast.show(t('admin.products.maxImages'), 'info');
          break;
        }
        next.push(await processImage(f, folder));
      }
      onChange(next);
    } catch (e) {
      console.error(e);
      toast.show(t('admin.products.imageFailed'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https:\/\//i.test(u)) return toast.show(t('admin.products.imageFailed'), 'error');
    if (value.length >= max) return toast.show(t('admin.products.maxImages'), 'info');
    onChange([...value, u]);
    setUrl('');
  };

  return (
    <div className="field full">
      <span>{label}</span>
      <div className="img-list">
        {value.map((src, i) => (
          <div className="img-item" key={i}>
            <img src={src} alt="" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t('common.delete')}>
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="inline-add">
        <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => onFile(e.target.files)} />
        <button type="button" className="btn btn-outline btn-sm" disabled={busy || value.length >= max} onClick={() => input.current?.click()}>
          {busy ? t('admin.products.uploading') : t('admin.products.upload')}
        </button>
      </div>
      <div className="inline-add">
        <input className="input" dir="ltr" placeholder={t('admin.products.imageUrl')} value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={addUrl}>
          {t('admin.products.addUrl')}
        </button>
      </div>
    </div>
  );
}
