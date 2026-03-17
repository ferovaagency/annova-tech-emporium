declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA = {
  event: (name: string, params?: Record<string, any>) => {
    if (window.gtag) window.gtag('event', name, params);
  },
  viewItem: (id: string, name: string, price: number, category?: string) =>
    GA.event('view_item', { currency: 'COP', value: price, items: [{ item_id: id, item_name: name, price, item_category: category }] }),
  addToCart: (id: string, name: string, price: number, qty: number) =>
    GA.event('add_to_cart', { currency: 'COP', value: price * qty, items: [{ item_id: id, item_name: name, price, quantity: qty }] }),
  removeFromCart: (id: string, name: string, price: number) =>
    GA.event('remove_from_cart', { currency: 'COP', value: price, items: [{ item_id: id, item_name: name, price }] }),
  beginCheckout: (total: number) =>
    GA.event('begin_checkout', { currency: 'COP', value: total }),
  purchase: (ref: string, total: number) =>
    GA.event('purchase', { transaction_id: ref, currency: 'COP', value: total }),
  cartAbandoned: (total: number, count: number) =>
    GA.event('cart_abandoned', { currency: 'COP', value: total, item_count: count }),
  availabilityTimer: (action: string) =>
    GA.event('availability_timer', { action }),
  whatsapp: (asesor: string, source: string) =>
    GA.event('whatsapp_click', { asesor_name: asesor, source }),
  nova: (action: string, secs?: number) =>
    GA.event('nova_chat', { action, duration_seconds: secs }),
};
