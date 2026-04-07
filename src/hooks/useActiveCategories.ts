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

        const allowedRows = ((data || []) as CategoryRow[]).filter((row) => FIXED_SLUGS.includes(normalizeCategorySlug(row.slug || row.name)));
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
    return FIXED_PARENT_CATEGORIES.map((baseCategory) => {
      const row = categoryRows.find((item) => normalizeCategorySlug(item.slug || item.name) === baseCategory.slug);
      const manualImage = getManualCategoryImage(baseCategory.name);
      if (!row) {
        return {
          ...baseCategory,
          image: manualImage,
        };
      }

      return {
        ...buildCategoryRecord(baseCategory.name),
        name: row.name || baseCategory.name,
        slug: baseCategory.slug,
        image: row.image_url?.trim() || manualImage,
      };
    });
  }, [categoryRows]);

  return { categories, loading };
}
