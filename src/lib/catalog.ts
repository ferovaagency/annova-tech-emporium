import { Product } from '@/data/products';
import { buildDynamicCategories, getParentCategory, normalizeCategorySlug, SUBCATEGORIES } from '@/lib/category-visuals';

export { buildDynamicCategories, getParentCategory, normalizeCategorySlug };

export function normalizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images.filter((image): image is string => {
    return typeof image === 'string' && image.trim().length > 0;
  });
}

/** Check if the raw category matches a known subcategory slug */
function matchSubcategory(rawCategory: string): string | null {
  const slug = normalizeCategorySlug(rawCategory);
  for (const subs of Object.values(SUBCATEGORIES)) {
    const match = subs.find((s) => s.slug === slug || normalizeCategorySlug(s.name) === slug);
    if (match) return match.slug;
  }
  return null;
}

export function mapDbProduct(p: any): Product {
  const normalizedImages = normalizeImageList(p.images);
  const rawCategory = p.category || '';

  // Check subcategory first
  const subSlug = matchSubcategory(rawCategory);
  const normalizedCategory = subSlug
    ? rawCategory.trim()
    : getParentCategory(rawCategory, `${p.name || ''} ${p.description || ''} ${JSON.stringify(p.specs || {})}`);
  const categorySlug = subSlug || normalizeCategorySlug(normalizedCategory);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.sale_price || p.price,
    oldPrice: p.sale_price ? p.price : undefined,
    image: normalizedImages[0] || '',
    images: normalizedImages,
    category: normalizedCategory,
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
