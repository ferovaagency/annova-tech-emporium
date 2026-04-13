import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
}

export function useDbCategories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from('categories')
      .select('id,name,slug,image_url,parent_id,sort_order')
      .order('sort_order', { ascending: true })
      .then(({ data }: { data: DbCategory[] | null }) => {
        setCategories(data || []);
        setLoading(false);
      });
  }, []);

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  );

  const getChildren = useCallback(
    (parentId: string) =>
      categories
        .filter((c) => c.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const getDescendantSlugs = useCallback(
    (slug: string): string[] => {
      const cat = categories.find((c) => c.slug === slug);
      if (!cat) return [slug];
      const children = categories.filter((c) => c.parent_id === cat.id);
      return [slug, ...children.flatMap((c) => getDescendantSlugs(c.slug))];
    },
    [categories],
  );

  return { categories, parentCategories, getChildren, getDescendantSlugs, loading };
}
