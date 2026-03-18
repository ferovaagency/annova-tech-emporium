import { useEffect, useMemo, useState } from 'react';
import type { Category } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { buildCategoryRecord, FIXED_PARENT_CATEGORIES, normalizeCategorySlug } from '@/lib/category-visuals';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
};

const FIXED_SLUGS = FIXED_PARENT_CATEGORIES.map((category) => category.slug);

async function syncCategoryImage(row: CategoryRow) {
  const { data, error } = await supabase.functions.invoke('media-tools', {
    body: {
      action: 'sync_category_image',
      categoryName: row.name,
      categorySlug: row.slug,
    },
  });

  if (error) throw error;
  if (!data?.publicUrl) return null;

  await (supabase as any)
    .from('categories')
    .update({ image_url: data.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', row.id);

  return data.publicUrl as string;
}

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
        const missingImages = allowedRows.filter((row) => !row.image_url?.trim());

        if (missingImages.length > 0) {
          await Promise.allSettled(missingImages.map(syncCategoryImage));
          if (!mounted) return;

          const refreshed = await (supabase as any)
            .from('categories')
            .select('id,name,slug,image_url')
            .order('created_at', { ascending: true });

          setCategoryRows((((refreshed.data || []) as CategoryRow[]).filter((row) => FIXED_SLUGS.includes(normalizeCategorySlug(row.slug || row.name)))));
          return;
        }

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
      if (!row) return baseCategory;

      return {
        ...buildCategoryRecord(baseCategory.name),
        name: row.name || baseCategory.name,
        slug: baseCategory.slug,
        image: row.image_url?.trim() || baseCategory.image,
      };
    });
  }, [categoryRows]);

  return { categories, loading };
}
