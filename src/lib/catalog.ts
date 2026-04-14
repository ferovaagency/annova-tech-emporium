import { Product } from '@/data/products';
import { normalizeCategorySlug, getParentCategory } from '@/lib/category-visuals';

export { normalizeCategorySlug, getParentCategory };

export function normalizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images.filter((image): image is string => {
    return typeof image === 'string' && image.trim().length > 0;
  });
}

export function mapDbProduct(p: any): Product {
  const normalizedImages = normalizeImageList(p.images);
  const rawCategory = p.category || '';
  const categorySlug = normalizeCategorySlug(rawCategory);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.sale_price || p.price,
    oldPrice: p.sale_price ? p.price : undefined,
    image: normalizedImages[0] || '',
    images: normalizedImages,
    category: rawCategory.trim() || 'Sin categoría',
    categorySlug,
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
