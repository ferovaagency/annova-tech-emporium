import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useActiveCategories } from '@/hooks/useActiveCategories';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/products';
import logoImg from '@/assets/logo-annovasoft-new.png';

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
  sku: string | null;
}

export default function Header() {
  const { totalItems } = useCart();
  const { categories } = useActiveCategories();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoadingResults(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id,slug,name,price,sale_price,images,sku')
        .eq('active', true)
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(6);
      setResults((data || []) as SearchResult[]);
      setOpen(true);
      setLoadingResults(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-accent py-1.5 text-xs text-accent-foreground">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-y-1 px-4">
          <div className="flex flex-wrap items-center gap-3 divide-x divide-accent-foreground/20">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +57 320 257 9393</span>
            <span className="hidden items-center gap-1 pl-3 sm:flex"><Phone className="h-3 w-3" /> +57 350 750 1878</span>
            <span className="hidden items-center gap-1 pl-3 md:flex"><Phone className="h-3 w-3" /> +57 305 795 0550</span>
            <span className="hidden items-center gap-1 pl-3 lg:flex"><Mail className="h-3 w-3" /> administrativo@annovasoft.com</span>
          </div>
          <div className="hidden items-center gap-1 text-accent-foreground/80 xl:flex">
            <MapPin className="h-3 w-3" /> Cra 15 # 76-53 Oficina 204, Bogotá, Colombia
          </div>
        </div>
      </div>

      <div className="border-b bg-background shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-[20px] py-[24px]">
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link to="/" className="flex-shrink-0">
            <img src={logoImg} alt="AnnovaSoft" className="h-10 w-auto md:h-12" />
          </Link>

          <div className="mx-4 hidden max-w-2xl flex-1 md:flex" ref={searchBoxRef}>
            <form onSubmit={submitSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Buscar productos, marcas, categorías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => results.length > 0 && setOpen(true)}
                className="h-11 w-full rounded-lg border-2 border-muted-foreground/30 bg-background pl-4 pr-12 text-base text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 flex h-full items-center rounded-r-lg bg-primary px-4 text-primary-foreground transition-opacity hover:opacity-90"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>

              {open && (results.length > 0 || loadingResults) && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border bg-popover shadow-xl">
                  {loadingResults && (
                    <div className="p-3 text-center text-sm text-muted-foreground">Buscando…</div>
                  )}
                  {!loadingResults && results.map((r) => {
                    const price = r.sale_price ?? r.price;
                    const img = r.images?.[0];
                    return (
                      <Link
                        key={r.id}
                        to={`/producto/${r.slug}`}
                        onClick={() => { setOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 border-b border-border/50 p-3 text-left transition-colors last:border-0 hover:bg-muted"
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={r.name}
                            className="h-12 w-12 flex-shrink-0 rounded object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const t = e.currentTarget;
                              const fb = window.location.origin + '/placeholder.svg';
                              if (t.src !== fb) t.src = fb;
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 flex-shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                          <p className="text-sm font-semibold text-primary">{formatPrice(price)}</p>
                        </div>
                      </Link>
                    );
                  })}
                  {!loadingResults && results.length > 0 && (
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="block w-full border-t bg-muted/40 p-2 text-center text-xs font-semibold text-primary hover:bg-muted"
                    >
                      Ver todos los resultados para "{searchQuery}"
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/tienda" className="p-2 md:hidden"><Search className="h-5 w-5" /></Link>
            <Link to="/mi-cuenta" className="rounded-lg p-2 transition-colors hover:bg-muted"><User className="h-5 w-5" /></Link>
            <Link to="/carrito" className="relative rounded-lg p-2 transition-colors hover:bg-muted">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <nav className="hidden bg-accent text-accent-foreground lg:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1">
            <Link to="/" className="whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground">Inicio</Link>
            <button
              className="flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <Menu className="h-4 w-4" /> Categorías <ChevronDown className="h-3 w-3" />
            </button>
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/tienda?categoria=${cat.slug}`} className="whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground">
                {cat.name}
              </Link>
            ))}
            <Link to="/blog" className="whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground">Blog</Link>
            <Link to="/nosotros" className="whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground">Nosotros</Link>
            <Link to="/contacto" className="whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground">Contáctanos</Link>
          </div>
        </div>
      </nav>

      {megaMenuOpen && (
        <div
          className="absolute left-0 z-50 hidden w-full border-b bg-background shadow-xl lg:block"
          onMouseEnter={() => setMegaMenuOpen(true)}
          onMouseLeave={() => setMegaMenuOpen(false)}
        >
          <div className="container mx-auto grid grid-cols-3 gap-6 px-4 py-6">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/tienda?categoria=${cat.slug}`} className="group flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-muted">
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <h3 className="font-montserrat text-sm font-semibold transition-colors group-hover:text-primary">{cat.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="border-b bg-background shadow-lg lg:hidden">
          <div className="p-4">
            <form onSubmit={submitSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background pl-4 pr-10 text-base text-foreground"
              />
              <button type="submit" className="absolute right-3 top-2.5" aria-label="Buscar">
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            </form>
            <Link to="/" className="block border-b border-border py-3 px-2 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/tienda?categoria=${cat.slug}`} className="flex items-center gap-3 border-b border-border py-3 px-2 transition-colors hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
            <Link to="/blog" className="block border-b border-border py-3 px-2 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link to="/nosotros" className="block border-b border-border py-3 px-2 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Nosotros</Link>
            <Link to="/contacto" className="block py-3 px-2 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Contáctanos</Link>
          </div>
        </div>
      )}
    </header>
  );
}
