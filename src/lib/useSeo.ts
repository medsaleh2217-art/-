import { useEffect } from 'react';

interface Seo {
  title: string;
  description?: string;
  image?: string;
  /** بيانات منظمة JSON-LD (كائن أو مصفوفة) */
  jsonLd?: unknown;
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo({ title, description, image, jsonLd, noindex }: Seo) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    document.title = title;
    const desc = description || '';
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', window.location.href);
    if (image && /^https?:/.test(image)) setMeta('property', 'og:image', image);
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.rel = 'canonical';
      document.head.appendChild(canon);
    }
    canon.href = window.location.origin + window.location.pathname;

    const id = 'ld-json-page';
    document.getElementById(id)?.remove();
    if (ld) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = id;
      s.textContent = ld;
      document.head.appendChild(s);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [title, description, image, ld, noindex]);
}
