import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products as localProducts, categories, Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Store() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('categoria') || '';
  const searchQuery = searchParams.get('q') || '';
  const [conditionFilter, setConditionFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevancia');
  const [priceRange, setPriceRange] = useState([0, 15000000]);
  const [showFilters, setShowFilters] = useState(false);

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.sale_price || p.price,
            oldPrice: p.sale_price ? p.price : undefined,
            image: (p.images && p.images[0]) || 'https://placehold.co/400x400?text=Sin+imagen',
            images: p.images || [],
            category: p.category || '',
            categorySlug: p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : '',
            brand: p.brand || '',
            condition: (p.condition || 'Nuevo') as any,
            shortDescription: p.short_description || '',
            description: p.description || '',
            specs: (p.specs || {}) as Record<string, string>,
            rating: p.reviews ? (p.reviews as any[]).reduce((s: number, r: any) => s + r.rating, 0) / (p.reviews as any[]).length : 5,
            reviews: p.reviews ? (p.reviews as any[]).length : 0,
          }));
          setDbProducts(mapped);
        }
      } catch {
        // fallback to local products
      }
      setLoadingDb(false);
    }
    fetchProducts();
  }, []);

  // Merge: DB products first, then local products as fallback
  const allProducts = useMemo(() => {
    if (dbProducts.length > 0) {
      // Include both DB and local, dedup by slug
      const slugSet = new Set(dbProducts.map(p => p.slug));
      const localFallback = localProducts.filter(p => !slugSet.has(p.slug));
      return [...dbProducts, ...localFallback];
    }
    return localProducts;
  }, [dbProducts]);

  const brands = useMemo(() => [...new Set(allProducts.map(p => p.brand))], [allProducts]);

  const filtered = useMemo(() => {
    let result = [...allProducts];
    if (categoryFilter) result = result.filter(p => p.categorySlug === categoryFilter || p.category?.toLowerCase().replace(/\s+/g, '-') === categoryFilter);
    if (conditionFilter) result = result.filter(p => p.condition === conditionFilter);
    if (brandFilter) result = result.filter(p => p.brand === brandFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === 'precio-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'precio-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'nombre') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [allProducts, categoryFilter, conditionFilter, brandFilter, searchQuery, sortBy, priceRange]);

  const activeCategory = categories.find(c => c.slug === categoryFilter);

  const clearFilters = () => {
    setSearchParams({});
    setConditionFilter('');
    setBrandFilter('');
    setPriceRange([0, 15000000]);
  };

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bebas">
              {activeCategory ? activeCategory.name : searchQuery ? `Resultados para "${searchQuery}"` : 'Tienda'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {loadingDb ? 'Cargando productos...' : `${filtered.length} productos encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg text-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" /> Filtros
            </button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevancia">Relevancia</SelectItem>
                <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="nombre">Nombre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters */}
        {(categoryFilter || conditionFilter || brandFilter) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeCategory && <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchParams(prev => { prev.delete('categoria'); return prev; })}>{activeCategory.name} <X className="w-3 h-3 ml-1" /></Badge>}
            {conditionFilter && <Badge variant="secondary" className="cursor-pointer" onClick={() => setConditionFilter('')}>{conditionFilter} <X className="w-3 h-3 ml-1" /></Badge>}
            {brandFilter && <Badge variant="secondary" className="cursor-pointer" onClick={() => setBrandFilter('')}>{brandFilter} <X className="w-3 h-3 ml-1" /></Badge>}
            <button className="text-sm text-primary hover:underline" onClick={clearFilters}>Limpiar todo</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-card rounded-lg border p-4 space-y-6 sticky top-40">
              <div>
                <h3 className="font-montserrat font-semibold text-sm mb-3">Categoría</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => setSearchParams(prev => { prev.set('categoria', cat.slug); return prev; })}
                      className={`block w-full text-left text-sm py-1.5 px-2 rounded hover:bg-muted transition-colors ${categoryFilter === cat.slug ? 'bg-muted font-semibold text-primary' : ''}`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-montserrat font-semibold text-sm mb-3">Condición</h3>
                <div className="space-y-2">
                  {['Nuevo', 'Reacondicionado'].map(c => (
                    <button
                      key={c}
                      onClick={() => setConditionFilter(conditionFilter === c ? '' : c)}
                      className={`block w-full text-left text-sm py-1.5 px-2 rounded hover:bg-muted transition-colors ${conditionFilter === c ? 'bg-muted font-semibold text-primary' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-montserrat font-semibold text-sm mb-3">Marca</h3>
                <div className="space-y-2">
                  {brands.map(b => (
                    <button
                      key={b}
                      onClick={() => setBrandFilter(brandFilter === b ? '' : b)}
                      className={`block w-full text-left text-sm py-1.5 px-2 rounded hover:bg-muted transition-colors ${brandFilter === b ? 'bg-muted font-semibold text-primary' : ''}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-montserrat font-semibold text-sm mb-3">Rango de precio</h3>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={15000000}
                  step={100000}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>${(priceRange[0] / 1000).toFixed(0)}K</span>
                  <span>${(priceRange[1] / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loadingDb ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl font-bebas text-muted-foreground mb-4">No se encontraron productos</p>
                <button onClick={clearFilters} className="text-primary hover:underline">Limpiar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
