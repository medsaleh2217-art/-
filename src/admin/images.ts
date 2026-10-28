import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { imageStorageMode } from '../lib/firebase';
import { storage } from '../lib/adminFirebase';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function canvasToBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, q));
}

/** يصغّر الصورة ويضغطها حتى تصبح أقل من الحجم المطلوب */
async function compress(file: File, maxDim: number, maxBytes: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const type = 'image/webp';
  for (let attempt = 0; attempt < 8; attempt++) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * scale));
    c.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas unsupported');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.82, 0.7, 0.58, 0.46]) {
      const blob = await canvasToBlob(c, type, q);
      if (blob.size <= maxBytes) return blob;
    }
    scale *= 0.8;
  }
  throw new Error('image too large');
}

/**
 * يعالج صورة مرفوعة:
 *  - الوضع الافتراضي "firestore": صورة مصغّرة ومضغوطة (~45KB) تُخزَّن كسلسلة data URL داخل المستند (مجاني، بدون Storage).
 *  - الوضع "storage": رفع إلى Firebase Storage وإرجاع رابط التحميل (يتطلب خطة Blaze للمشاريع الجديدة).
 */
export async function processImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not an image');
  if (imageStorageMode === 'storage') {
    if (!storage) throw new Error('storage not configured');
    const blob = await compress(file, 1200, 900 * 1024);
    const r = ref(storage, `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`);
    await uploadBytes(r, blob, { contentType: 'image/webp' });
    return getDownloadURL(r);
  }
  const blob = await compress(file, 640, 45 * 1024);
  return blobToDataUrl(blob);
}
