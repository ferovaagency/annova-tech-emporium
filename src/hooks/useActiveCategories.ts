import { useMemo } from 'react';
import type { Category } from '@/data/products';
import { useDbCategories, type DbCategory } from '@/hooks/useDbCategories';
import { getManualCategoryImage } from '@/lib/category-visuals';

function toCategory(row: DbCategory): Category {
  return {
    name: row.name,
    slug: row.slug,
    icon: '',
    description: '',
    image: row.image_url?.trim() || getManualCategoryImage(row.name),
  };
}

export function useActiveCategories() {
  const { parentCategories, loading } = useDbCategories();

  const categories: Category[] = useMemo(
    () => parentCategories.map(toCategory),
    [parentCategories],
  );

  return { categories, loading };
}
