import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mapDbProduct, normalizeCategorySlug } from '@/lib/catalog';
import { FIXED_PARENT_CATEGORIES } from '@/lib/category-visuals';

function CategoryBadgeVisual({ name, image }: { name: string; image?: string }) {
  const hasRealImage = Boolean(image && image.trim() && image !== '/placeholder.svg');
  if (!hasRealImage) return <div className="rounded-lg bg-gradient-to-r from-primary via-accent to-accent px-3 py-2 text-center text-xs font-semibold text-primary-foreground">{name}</div>;
  return <div className="rounded-lg border bg-muted px-3 py-2 text-xs font-semibold">{name}</div>;
}

type StoreProduct = Product & {
  rawCategory?: string;
  specs?: Record<string, string>;
};

export default function Store() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('categoria') || '';
  const searchQuery = searchParams.get('q') || '';
  const [conditionFilter, setConditionFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevancia');
  const [priceRange, setPriceRange] = useState([0, 15000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [dbProducts, setDbProducts] = useState<StoreProduct[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

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
  const attributeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    allProducts.forEach((product) => {
      Object.entries((product.specs || {}) as Record<string, string>).forEach(([key, value]) => {
        const normalizedKey = key.trim();
        const normalizedValue = String(value).trim();
        if (!normalizedKey || !normalizedValue) return;
        const option = `${normalizedKey}::${normalizedValue}`;
        counts.set(option, (counts.get(option) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([value]) => {
        const [key, optionValue] = value.split('::');
        return { value, label: `${key}: ${optionValue}` };
      });
  }, [allProducts]);

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (categoryFilter) {
      result = result.filter((product) => {
        const rawCategorySlug = normalizeCategorySlug((product as StoreProduct).rawCategory || '');
        return product.categorySlug === categoryFilter || rawCategorySlug === categoryFilter;
      });
    }

    if (conditionFilter) result = result.filter((p) => p.condition === conditionFilter);
    if (brandFilter) result = result.filter((p) => p.brand === brandFilter);
    if (attributeFilter) {
      const [key, value] = attributeFilter.split('::');
      result = result.filter((product) => String((product.specs || {})[key] || '') === value);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const haystack = [p.name, p.brand, p.category, (p as StoreProduct).rawCategory, JSON.stringify(p.specs || {})].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === 'precio-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'precio-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'nombre') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [allProducts, categoryFilter, conditionFilter, brandFilter, attributeFilter, searchQuery, sortBy, priceRange]);

  const activeCategory = FIXED_PARENT_CATEGORIES.find((category) => category.slug === categoryFilter);

  const clearFilters = () => {
    setSearchParams(searchQuery ? { q: searchQuery } : {});
    setConditionFilter('');
    setBrandFilter('');
    setAttributeFilter('');
    setPriceRange([0, 15000000]);
  };

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bebas md:text-4xl">{activeCategory ? activeCategory.name : searchQuery ? `Resultados para "${searchQuery}"` : 'Tienda'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{loadingDb ? 'Cargando productos...' : `${filtered.length} productos encontrados`}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm lg:hidden" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-4 w-4" /> Filtros</button>
            <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-48"><SelectValue placeholder="Ordenar por" /></SelectTrigger><SelectContent><SelectItem value="relevancia">Relevancia</SelectItem><SelectItem value="precio-asc">Precio: menor a mayor</SelectItem><SelectItem value="precio-desc">Precio: mayor a menor</SelectItem><SelectItem value="nombre">Nombre A-Z</SelectItem></SelectContent></Select>
          </div>
        </div>

        {(categoryFilter || conditionFilter || brandFilter || attributeFilter || searchQuery) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeCategory && <button onClick={() => setSearchParams(searchQuery ? { q: searchQuery } : {})}><CategoryBadgeVisual name={activeCategory.name} image={activeCategory.image} /></button>}
            {conditionFilter && <Badge variant="secondary" className="cursor-pointer" onClick={() => setConditionFilter('')}>{conditionFilter} <X className="ml-1 h-3 w-3" /></Badge>}
            {brandFilter && <Badge variant="secondary" className="cursor-pointer" onClick={() => setBrandFilter('')}>{brandFilter} <X className="ml-1 h-3 w-3" /></Badge>}
            {attributeFilter && <Badge variant="secondary" className="cursor-pointer" onClick={() => setAttributeFilter('')}>{attributeOptions.find((option) => option.value === attributeFilter)?.label || 'Atributo'} <X className="ml-1 h-3 w-3" /></Badge>}
            <button className="text-sm text-primary hover:underline" onClick={clearFilters}>Limpiar todo</button>
          </div>
        )}

        <div className="flex gap-8">
          <aside className={`${showFilters ? 'block' : 'hidden'} w-full flex-shrink-0 lg:block lg:w-64`}>
            <div className="sticky top-40 space-y-6 rounded-lg border bg-card p-4">
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Categoría</h3>
                <div className="space-y-2">
                  {FIXED_PARENT_CATEGORIES.map((cat) => (
                    <button key={cat.slug} onClick={() => setSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), categoria: cat.slug })} className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${categoryFilter === cat.slug ? 'bg-muted font-semibold text-primary' : ''}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Condición</h3>
                <div className="space-y-2">{['Nuevo', 'Reacondicionado', 'Usado'].map((c) => <button key={c} onClick={() => setConditionFilter(conditionFilter === c ? '' : c)} className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${conditionFilter === c ? 'bg-muted font-semibold text-primary' : ''}`}>{c}</button>)}</div>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Marca</h3>
                <div className="space-y-2">{brands.map((b) => <button key={b} onClick={() => setBrandFilter(brandFilter === b ? '' : b)} className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${brandFilter === b ? 'bg-muted font-semibold text-primary' : ''}`}>{b}</button>)}</div>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Atributos</h3>
                <Select value={attributeFilter || 'all'} onValueChange={(value) => setAttributeFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un atributo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {attributeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h3 className="mb-3 font-montserrat text-sm font-semibold">Rango de precio</h3>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={15000000} step={100000} className="mt-2" />
              </div>
            </div>
          </aside>
          <div className="flex-1">{loadingDb ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="py-16 text-center"><p className="mb-4 text-xl font-bebas text-muted-foreground">No hay productos con este filtro</p><button onClick={clearFilters} className="text-primary hover:underline">Limpiar filtros</button></div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{filtered.map((p) => <ProductCard key={p.id} product={p} />)}</div>}</div>
        </div>
      </div>
    </main>
  );
}
