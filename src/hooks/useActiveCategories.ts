import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/data/products';
import { buildDynamicCategories } from '@/lib/catalog';

export function useActiveCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      const { data } = await supabase
        .from('products')
        .select('category')
        .eq('active', true);

      if (!mounted) return;

      const names = (data || [])
        .map((item: any) => item.category)
        .filter((value: string | null) => Boolean(value && value.trim()));

      setCategories(buildDynamicCategories(names as string[]));
      setLoading(false);
    };

    loadCategories();

    const channel = supabase
      .channel('active-product-categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadCategories();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { categories, loading };
}
