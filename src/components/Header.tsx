import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Phone, Mail, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { categories } from '@/data/products';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-accent text-accent-foreground text-xs py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +57 (1) 234-5678</span>
            <span className="hidden sm:flex items-center gap-1"><Mail className="w-3 h-3" /> ventas@annova.com.co</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="hover:underline">Blog</Link>
            <span>Envíos a todo Colombia</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          {/* Mobile menu */}
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-bebas text-2xl md:text-3xl tracking-wider">
              <span className="text-primary">ANNOVA</span>
              <span className="text-secondary"> SOFTWARE</span>
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar productos, marcas, categorías..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-12 rounded-lg border-2 border-secondary bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <Link
                to={searchQuery ? `/tienda?q=${encodeURIComponent(searchQuery)}` : '/tienda'}
                className="absolute right-0 top-0 h-full px-4 bg-secondary text-secondary-foreground rounded-r-lg flex items-center hover:opacity-90 transition-opacity"
              >
                <Search className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/tienda" className="md:hidden p-2"><Search className="w-5 h-5" /></Link>
            <Button variant="ghost" size="icon" className="relative">
              <User className="w-5 h-5" />
            </Button>
            <Link to="/carrito" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Categories nav */}
      <nav className="bg-accent text-accent-foreground hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <button
              className="flex items-center gap-2 py-2.5 px-4 font-semibold text-sm hover:bg-primary transition-colors"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <Menu className="w-4 h-4" /> Categorías <ChevronDown className="w-3 h-3" />
            </button>
            {categories.map(cat => (
              <Link
                key={cat.slug}
                to={`/tienda?categoria=${cat.slug}`}
                className="py-2.5 px-3 text-sm font-medium hover:bg-primary transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mega menu dropdown */}
      {megaMenuOpen && (
        <div
          className="absolute left-0 w-full bg-background border-b shadow-xl z-50 hidden lg:block"
          onMouseEnter={() => setMegaMenuOpen(true)}
          onMouseLeave={() => setMegaMenuOpen(false)}
        >
          <div className="container mx-auto px-4 py-6 grid grid-cols-3 gap-6">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                to={`/tienda?categoria=${cat.slug}`}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <h3 className="font-montserrat font-semibold text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b shadow-lg">
          <div className="p-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-input bg-background text-foreground"
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground" />
            </div>
            {categories.map(cat => (
              <Link
                key={cat.slug}
                to={`/tienda?categoria=${cat.slug}`}
                className="flex items-center gap-3 py-3 px-2 border-b border-border hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.name}</span>
              </Link>
            ))}
            <Link to="/blog" className="block py-3 px-2 font-medium text-sm text-secondary" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
