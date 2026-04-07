import { useEffect, useMemo, useState } from 'react';
import type { Category } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { buildCategoryRecord, FIXED_PARENT_CATEGORIES, SUBCATEGORIES, getManualCategoryImage, normalizeCategorySlug } from '@/lib/category-visuals';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  parent_id?: string | null;
};

const ALL_CATEGORY_SLUGS = [
  ...FIXED_PARENT_CATEGORIES.map((c) => c.slug),
  ...Object.values(SUBCATEGORIES).flat().map((c) => c.slug),
];

export function useActiveCategories() {
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const { data } = await (supabase as any)
          .from('categories')
          .select('id,name,slug,image_url')
          .order('created_at', { ascending: true });

        if (!mounted) return;

        const allowedRows = ((data || []) as CategoryRow[]).filter((row) => ALL_CATEGORY_SLUGS.includes(normalizeCategorySlug(row.slug || row.name)));
        setCategoryRows(allowedRows);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const categories: Category[] = useMemo(() => {
    const result: Category[] = [];

    FIXED_PARENT_CATEGORIES.forEach((baseCategory) => {
      const row = categoryRows.find((item) => normalizeCategorySlug(item.slug || item.name) === baseCategory.slug);
      const manualImage = getManualCategoryImage(baseCategory.name);

      const parent: Category = row
        ? {
            ...buildCategoryRecord(baseCategory.name),
            name: row.name || baseCategory.name,
            slug: baseCategory.slug,
            image: row.image_url?.trim() || manualImage,
          }
        : { ...baseCategory, image: manualImage };

      result.push(parent);

      const subs = SUBCATEGORIES[baseCategory.slug] || [];
      subs.forEach((sub) => {
        const subRow = categoryRows.find((item) => normalizeCategorySlug(item.slug || item.name) === sub.slug);
        result.push({
          ...sub,
          name: subRow?.name || sub.name,
          image: subRow?.image_url?.trim() || manualImage,
          parentSlug: baseCategory.slug,
        } as Category & { parentSlug?: string });
      });
    });

    return result;
  }, [categoryRows]);

  return { categories, loading };
}
