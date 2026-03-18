import { useEffect } from 'react';

interface SeoConfig {
  title?: string;
  description?: string;
  canonical?: string;
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

export function useDocumentSeo({ title, description, canonical }: SeoConfig) {
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
  }, [title, description, canonical]);
}
