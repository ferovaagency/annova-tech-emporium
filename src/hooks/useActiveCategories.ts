import type { Category } from '@/data/products';
import { categories as fixedCategories } from '@/data/products';

export function useActiveCategories() {
  const categories: Category[] = fixedCategories;
  return { categories, loading: false };
}
