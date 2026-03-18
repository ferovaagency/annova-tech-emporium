import { getWhatsAppUrl, getWhatsAppUrlForOrder, getWhatsAppUrlForProduct } from '@/lib/whatsapp';

function getCurrentUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

export function getAdvisorWhatsAppUrl() {
  return getWhatsAppUrl(`Hola, quiero hablar con un asesor de AnnovaSoft. Contexto: ${getCurrentUrl() || 'sitio web'}`, getCurrentUrl());
}

export function getProductWhatsAppUrl(productName: string, productUrl?: string) {
  return getWhatsAppUrlForProduct(productName, productUrl || getCurrentUrl(), productUrl || getCurrentUrl());
}

export function getCartWhatsAppUrl(items: Array<{ name: string; quantity: number; price: number }>, total: number, customerEmail?: string) {
  const base = getWhatsAppUrlForOrder(items, total, customerEmail || getCurrentUrl());
  const currentUrl = getCurrentUrl();
  if (!currentUrl) return base;
  return `${base}%0A%0AVi%20este%20carrito%20en:%20${encodeURIComponent(currentUrl)}`;
}
