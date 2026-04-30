import { useEffect } from 'react';

interface SeoConfig {
  title?: string;
  description?: string;
  canonical?: string;
  jsonLd?: Record<string, any> | null;
}

function upsertMeta(selector: string, attribute: 'name' | 'property', value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

const JSONLD_ID = 'page-jsonld';

export function useDocumentSeo({ title, description, canonical, jsonLd }: SeoConfig) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }
    if (title) upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    }

    // Inject/update page-level JSON-LD
    const existing = document.getElementById(JSONLD_ID);
    if (jsonLd) {
      const script = (existing as HTMLScriptElement) || document.createElement('script');
      script.id = JSONLD_ID;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      if (!existing) document.head.appendChild(script);
    } else if (existing) {
      existing.remove();
    }

    return () => {
      const node = document.getElementById(JSONLD_ID);
      if (node) node.remove();
    };
  }, [title, description, canonical, jsonLd]);
}
