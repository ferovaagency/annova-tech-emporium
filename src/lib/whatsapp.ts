const ASESORES = [
  { name: "Sergio Muñoz", phone: "573202579393" },
  { name: "Isabella Garzón", phone: "573507501878" },
  { name: "Annova Soft Unilago", phone: "573057950550" },
];

export function getWhatsAppUrl(message: string): string {
  const index = Math.floor(Date.now() / 1000) % ASESORES.length;
  const asesor = ASESORES[index];
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${asesor.phone}?text=${encoded}`;
}

export function getWhatsAppUrlForProduct(productName: string, productUrl: string): string {
  const msg = `Hola, estoy interesado en ${productName}. Lo vi en ${productUrl} y quiero más información.`;
  return getWhatsAppUrl(msg);
}
