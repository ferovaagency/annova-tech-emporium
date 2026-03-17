import { Product, type Category } from '@/data/products';
import { generateSlug } from '@/lib/slug';

export function normalizeCategorySlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

export function normalizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images.filter((image): image is string => {
    return typeof image === 'string' && image.trim().length > 0;
  });
}

export function mapDbProduct(p: any): Product {
  const normalizedImages = normalizeImageList(p.images);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.sale_price || p.price,
    oldPrice: p.sale_price ? p.price : undefined,
    image: normalizedImages[0] || '',
    images: normalizedImages,
    category: p.category || '',
    categorySlug: normalizeCategorySlug(p.category || ''),
    brand: p.brand || '',
    condition: (p.condition || 'Nuevo') as Product['condition'],
    shortDescription: p.short_description || '',
    description: p.description || '',
    specs: (p.specs || {}) as Record<string, string>,
    rating: 4.8,
    reviews: Array.isArray(p.reviews) ? p.reviews.length : 0,
    featured: Boolean(p.featured),
  };
}

export function buildDynamicCategories(names: string[]): Category[] {
  return names
    .filter(Boolean)
    .map((name) => name.trim())
    .filter((name, index, array) => array.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index)
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((name) => ({
      name,
      slug: generateSlug(name),
      icon: '📦',
      description: `Productos disponibles en ${name}`,
      image: '/placeholder.svg',
    }));
}

export function isExternalImageUrl(imageUrl: string) {
  return /^https?:\/\//i.test(imageUrl) && !imageUrl.includes('/storage/v1/object/public/product-images/');
}
