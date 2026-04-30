import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mapDbProduct } from '@/lib/catalog';
import { useDbCategories } from '@/hooks/useDbCategories';
import { useDocumentSeo } from '@/hooks/useDocumentSeo';
import { buildSiteUrl } from '@/lib/site';

type StoreProduct = Product & {
  rawCategory?: string;
  specs?: Record<string, string>;
};

export default function Store() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories: allCategories, parentCategories, getChildren, getDescendantSlugs } = useDbCategories();
  const categoryFilter = searchParams.get('categoria') || '';
  const searchQuery = searchParams.get('q') || '';
  const [conditionFilter, setConditionFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevancia');
  const [priceRange, setPriceRange] = useState([0, 15000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [dbProducts, setDbProducts] = useState<StoreProduct[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  useDocumentSeo({
    title: 'Tienda de Tecnología | Computadores, Servidores y más — AnnovaSoft',
    description:
      'Compra computadores, servidores, workstations, equipos de red, gamer y licencias en Bogotá Colombia. AnnovaSoft — tecnología empresarial con garantía.',
    canonical: buildSiteUrl('/tienda'),
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false });
        if (!error && data) setDbProducts(data.map(mapDbProduct) as StoreProduct[]);
      } finally {
        setLoadingDb(false);
      }
    }
    fetchProducts();
  }, []);

  const allProducts = dbProducts;
  const brands = useMemo(() => [...new Set(allProducts.map((p) => p.brand).filter(Boolean))], [allProducts]);

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (categoryFilter) {
      const allSlugs = getDescendantSlugs(categoryFilter);
      result = result.filter((product) => allSlugs.includes(product.categorySlug));
    }

    if (conditionFilter) result = result.filter((p) => p.condition === conditionFilter);
    if (brandFilter) result = result.filter((p) => p.brand === brandFilter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const haystack = [p.name, p.brand, p.category, (p as StoreProduct).rawCategory].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === 'precio-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'precio-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'nombre') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [allProducts, categoryFilter, conditionFilter, brandFilter, searchQuery, sortBy, priceRange, getDescendantSlugs]);

  const activeCategory = allCategories.find((c) => c.slug === categoryFilter);

  const clearFilters = () => {
    setSearchParams(searchQuery ? { q: searchQuery } : {});
    setConditionFilter('');
    setBrandFilter('');
    setPriceRange([0, 15000000]);
  };

  const setCategoryParam = (slug: string) => {
    setSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), categoria: slug });
  };

  // Auto-expand parents when a child category is selected
  useEffect(() => {
    if (!categoryFilter || allCategories.length === 0) return;
    const cat = allCategories.find((c) => c.slug === categoryFilter);
    if (!cat) return;
    const toOpen: string[] = [];
    if (cat.parent_id) {
      toOpen.push(cat.parent_id);
      const parent = allCategories.find((c) => c.id === cat.parent_id);
      if (parent?.parent_id) toOpen.push(parent.parent_id);
    }
    if (toOpen.length) {
      setExpanded((prev) => Array.from(new Set([...prev, ...toOpen])));
    }
  }, [categoryFilter, allCategories]);

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bebas md:text-4xl">
              {activeCategory ? activeCategory.name : searchQuery ? `Resultados para "${searchQuery}"` : 'Tienda'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loadingDb ? 'Cargando productos...' : `${filtered.length} productos encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm lg:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {(categoryFilter || conditionFilter || brandFilter || searchQuery) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeCategory && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchParams(searchQuery ? { q: searchQuery } : {})}>
                {activeCategory.name} <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            {conditionFilter && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setConditionFilter('')}>
                {conditionFilter} <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            {brandFilter && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setBrandFilter('')}>
                {brandFilter} <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            <button className="text-sm text-primary hover:underline" onClick={clearFilters}>Limpiar todo</button>
          </div>
        )}

        <div className="flex gap-6">
          <aside className={`${showFilters ? 'block' : 'hidden'} w-64 shrink-0 lg:block`}>
            <div className="sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto pr-2 space-y-6 rounded-lg border bg-card p-4">
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Categorías</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSearchParams(searchQuery ? { q: searchQuery } : {})}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${!categoryFilter ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'}`}
                  >
                    Todas las categorías
                  </button>
                  {parentCategories.map((parent) => {
                    const subs = getChildren(parent.id);
                    const isOpen = expanded.includes(parent.id);
                    const hasActiveChild = subs.some(
                      (s) => s.slug === categoryFilter || getChildren(s.id).some((s3) => s3.slug === categoryFilter),
                    );
                    return (
                      <div key={parent.id} className="mb-1">
                        {/* PADRE — solo accordion, NO filtra */}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(parent.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors cursor-pointer ${hasActiveChild ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                          aria-expanded={isOpen}
                        >
                          <span>{parent.name}</span>
                          <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {/* HIJOS — visibles solo si padre está expandido */}
                        {isOpen && subs.length > 0 && (
                          <div className="ml-2 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
                            {subs.map((sub) => {
                              const sub3 = getChildren(sub.id);
                              const isSubActive = categoryFilter === sub.slug;
                              const hasSub3Active = sub3.some((s) => s.slug === categoryFilter);
                              const subOpen = expanded.includes(sub.id);
                              return (
                                <div key={sub.id}>
                                  {/* HIJO nivel 2 — SÍ filtra */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategoryParam(sub.slug);
                                      if (sub3.length > 0 && !subOpen) {
                                        setExpanded((prev) => [...prev, sub.id]);
                                      }
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${isSubActive || hasSub3Active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                                  >
                                    <span>{sub.name}</span>
                                    {sub3.length > 0 && (
                                      <ChevronDown
                                        className={`w-3 h-3 transition-transform ${subOpen ? 'rotate-180' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpanded(sub.id);
                                        }}
                                      />
                                    )}
                                  </button>
                                  {/* NIETOS nivel 3 — SÍ filtran */}
                                  {sub3.length > 0 && subOpen && (
                                    <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                                      {sub3.map((s3) => (
                                        <button
                                          key={s3.id}
                                          type="button"
                                          onClick={() => setCategoryParam(s3.slug)}
                                          className={`w-full rounded px-2 py-1 text-left text-[11px] transition-colors ${categoryFilter === s3.slug ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground/70 hover:bg-muted'}`}
                                        >
                                          · {s3.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Condición</h3>
                <div className="space-y-2">
                  {['Nuevo', 'Reacondicionado', 'Usado'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setConditionFilter(conditionFilter === c ? '' : c)}
                      className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${conditionFilter === c ? 'bg-muted font-semibold text-primary' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Marca</h3>
                <div className="space-y-2">
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBrandFilter(brandFilter === b ? '' : b)}
                      className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${brandFilter === b ? 'bg-muted font-semibold text-primary' : ''}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Rango de precio</h3>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={15000000} step={100000} className="mt-2" />
              </div>
            </div>
          </aside>
          <div className="flex-1">
            {loadingDb ? (
              <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="mb-4 text-xl font-bebas text-muted-foreground">No hay productos con este filtro</p>
                <button onClick={clearFilters} className="text-primary hover:underline">Limpiar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
