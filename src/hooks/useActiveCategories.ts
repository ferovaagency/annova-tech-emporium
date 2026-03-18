import { useEffect, useMemo, useState } from 'react';
import type { Category } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { buildDynamicCategories, FIXED_PARENT_CATEGORIES } from '@/lib/category-visuals';

export function useActiveCategories() {
  const [categoryNames, setCategoryNames] = useState<string[]>(FIXED_PARENT_CATEGORIES.map((category) => category.name));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase.from('products').select('category').eq('active', true),
          supabase.from('categories').select('name'),
        ]);

        if (!mounted) return;

        const names = [
          ...FIXED_PARENT_CATEGORIES.map((category) => category.name),
          ...((productsRes.data || []).map((item) => item.category).filter(Boolean) as string[]),
          ...((categoriesRes.data || []).map((item) => item.name).filter(Boolean) as string[]),
        ];

        setCategoryNames(Array.from(new Set(names)));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const categories: Category[] = useMemo(() => buildDynamicCategories(categoryNames), [categoryNames]);

  return { categories, loading };
}
