// يولّد dist/sitemap.xml ويحدّث dist/robots.txt بعد البناء.
// يقرأ المنتجات الظاهرة عبر Firestore REST API (قراءة عامة وفق القواعد) إذا توفّر إعداد Firebase.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const site = (env.VITE_SITE_URL || '').replace(/\/$/, '');
if (!site || !existsSync('dist')) {
  console.log('[sitemap] تخطّي: لم يُضبط VITE_SITE_URL أو لا يوجد مجلد dist.');
  process.exit(0);
}

const paths = ['/', '/products', '/about', '/contact', '/privacy', '/policy'];

async function productIds() {
  const project = env.VITE_FIREBASE_PROJECT_ID;
  if (!project) return [];
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'products' }],
          where: { fieldFilter: { field: { fieldPath: 'hidden' }, op: 'EQUAL', value: { booleanValue: false } } },
          limit: 1000,
        },
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const rows = await res.json();
    return rows.filter((r) => r.document).map((r) => r.document.name.split('/').pop());
  } catch (e) {
    console.warn('[sitemap] تعذّر جلب المنتجات، سيُنشأ الملف بالصفحات الثابتة فقط:', e.message);
    return [];
  }
}

const ids = await productIds();
const today = new Date().toISOString().slice(0, 10);
const urls = [...paths, ...ids.map((id) => `/product/${id}`)];
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`;
writeFileSync('dist/sitemap.xml', xml);

const robotsPath = 'dist/robots.txt';
let robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8') : 'User-agent: *\nAllow: /\n';
robots = robots.replace(/^Sitemap:.*$/gm, '').trimEnd() + `\nSitemap: ${site}/sitemap.xml\n`;
writeFileSync(robotsPath, robots);
console.log(`[sitemap] تم إنشاء sitemap.xml (${urls.length} رابط).`);
