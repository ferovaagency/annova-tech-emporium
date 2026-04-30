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

function getVisibleCategoryIds(categories: DbCategory[], activeCatIds: Set<string>): Set<string> {
  function hasProducts(catId: string): boolean {
    if (activeCatIds.has(catId)) return true;
    return categories.some((c) => c.parent_id === catId && hasProducts(c.id));
  }
  return new Set(categories.filter((c) => hasProducts(c.id)).map((c) => c.id));
}

export function useDbCategories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [activeCatIds, setActiveCatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      (supabase as any)
        .from('categories')
        .select('id,name,slug,image_url,parent_id,sort_order')
        .order('sort_order', { ascending: true }),
      (supabase as any)
        .from('products')
        .select('category_id')
        .eq('active', true)
        .not('category_id', 'is', null),
    ]).then(([{ data: catData, error: catErr }, { data: prodData, error: prodErr }]) => {
      const cats: DbCategory[] = catData || [];
      setCategories(cats);
      if (!prodErr && prodData?.length) {
        setActiveCatIds(new Set(prodData.map((p: any) => p.category_id)));
      } else {
        // fallback: show all categories if product query fails
        setActiveCatIds(new Set(cats.map((c: DbCategory) => c.id)));
      }
      setLoading(false);
    });
  }, []);

  const visibleCatIds = useMemo(
    () => getVisibleCategoryIds(categories, activeCatIds),
    [categories, activeCatIds],
  );

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id && visibleCatIds.has(c.id)),
    [categories, visibleCatIds],
  );

  const getChildren = useCallback(
    (parentId: string) =>
      categories
        .filter((c) => c.parent_id === parentId && visibleCatIds.has(c.id))
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories, visibleCatIds],
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
