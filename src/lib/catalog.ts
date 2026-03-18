import { Product } from '@/data/products';
import { buildDynamicCategories, normalizeText } from '@/lib/category-visuals';

export { buildDynamicCategories };

export function normalizeCategorySlug(value: string) {
  return normalizeText(value).replace(/\s+/g, '-');
}

export function getParentCategory(input?: string | null, context = ''): string {
  const text = normalizeText(`${input || ''} ${context}`);

  if (text.includes('licenciamiento')) return 'Licenciamiento';
  if (text.includes('servidores')) return 'Servidores';
  if (text.includes('computadores')) return 'Computadores';
  if (['server', 'servidor', 'rack', 'tower', 'xeon', 'datacenter', 'dl380', 'poweredge', 'proliant', 'nas', 'storage', 'raid', 'blade', 'switch', 'firewall', 'ups'].some((keyword) => text.includes(keyword))) return 'Servidores';
  if (['licencia', 'licenciamiento', 'software', 'microsoft 365', 'office', 'windows', 'antivirus', 'subscription', 'suscripcion', 'adobe', 'autodesk', 'sql server', 'visual studio', 'project', 'visio'].some((keyword) => text.includes(keyword))) return 'Licenciamiento';
  return 'Computadores';
}

export function normalizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images.filter((image): image is string => {
    return typeof image === 'string' && image.trim().length > 0;
  });
}

export function mapDbProduct(p: any): Product {
  const normalizedImages = normalizeImageList(p.images);
  const rawCategory = p.category || '';
  const normalizedCategory = getParentCategory(rawCategory, `${p.name || ''} ${p.description || ''} ${JSON.stringify(p.specs || {})}`);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.sale_price || p.price,
    oldPrice: p.sale_price ? p.price : undefined,
    image: normalizedImages[0] || '',
    images: normalizedImages,
    category: normalizedCategory,
    categorySlug: normalizeCategorySlug(normalizedCategory),
    brand: p.brand || '',
    condition: (p.condition || 'Nuevo') as Product['condition'],
    shortDescription: p.short_description || '',
    description: p.description || '',
    specs: (p.specs || {}) as Record<string, string>,
    rating: 4.8,
    reviews: Array.isArray(p.reviews) ? p.reviews.length : 0,
    featured: Boolean(p.featured),
    rawCategory,
  } as Product;
}

export function isExternalImageUrl(imageUrl: string) {
  return /^https?:\/\//i.test(imageUrl) && !imageUrl.includes('/storage/v1/object/public/product-images/');
}
