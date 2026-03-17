const ASESORES = [
  { name: "Sergio Muñoz", phone: "573202579393" },
  { name: "Isabella Garzón", phone: "573507501878" },
  { name: "Annova Soft Unilago", phone: "573057950550" },
];

function getAsesorIndex(seed?: string): number {
  if (!seed) {
    return Math.floor(Date.now() / 10000) % ASESORES.length;
  }
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % ASESORES.length;
}

export function getWhatsAppUrl(message: string, seed?: string): string {
  const asesor = ASESORES[getAsesorIndex(seed)];
  return `https://wa.me/${asesor.phone}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppUrlForProduct(productName: string, productUrl: string, seed?: string): string {
  const msg = `Hola, estoy interesado en *${productName}*.\nLo vi en: ${productUrl}\n¿Podrían darme más información y confirmar disponibilidad?`;
  return getWhatsAppUrl(msg, seed || productName);
}

export function getWhatsAppUrlForOrder(
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  customerEmail?: string
): string {
  const lista = items.map(i => `• ${i.name} x${i.quantity} — $${i.price.toLocaleString('es-CO')} COP`).join('\n');
  const msg = `Hola, quiero confirmar disponibilidad de mi pedido:\n\n${lista}\n\n*Total: $${total.toLocaleString('es-CO')} COP*\n\nEstoy listo para pagar en cuanto confirmen.`;
  return getWhatsAppUrl(msg, customerEmail);
}
