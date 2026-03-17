import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { categories } from '@/data/products';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo-annovasoft.png';

export default function Header() {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-accent text-accent-foreground text-xs py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-y-1">
          <div className="flex items-center gap-3 divide-x divide-accent-foreground/20">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +57 305 7950550</span>
            <span className="hidden sm:flex items-center gap-1 pl-3"><Phone className="w-3 h-3" /> +57 301 6491625</span>
            <span className="hidden md:flex items-center gap-1 pl-3"><Mail className="w-3 h-3" /> comercial1@annovasoft.com</span>
            <span className="hidden lg:flex items-center gap-1 pl-3"><Mail className="w-3 h-3" /> gerencia@annovasoft.com</span>
          </div>
          <div className="hidden xl:flex items-center gap-1 text-accent-foreground/80">
            <MapPin className="w-3 h-3" /> Av. Cra 15 #79-65, Bogotá 110221, Colombia
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-background border-b shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-[20px] py-[30px]">
          {/* Mobile menu */}
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logoImg} alt="AnnovaSoft" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar productos, marcas, categorías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-12 rounded-lg border-2 border-muted-foreground/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />

              <Link
                to={searchQuery ? `/tienda?q=${encodeURIComponent(searchQuery)}` : '/tienda'}
                className="absolute right-0 top-0 h-full px-4 bg-primary text-primary-foreground rounded-r-lg flex items-center hover:opacity-90 transition-opacity">

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
              {totalItems > 0 &&
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              }
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-accent text-accent-foreground hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1">
            <Link to="/" className="py-2.5 px-4 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap rounded-sm">Inicio</Link>
            <button
              className="flex items-center gap-2 py-2.5 px-4 font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors rounded-sm"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}>

              <Menu className="w-4 h-4" /> Categorías <ChevronDown className="w-3 h-3" />
            </button>
            {categories.map((cat) =>
            <Link
              key={cat.slug}
              to={`/tienda?categoria=${cat.slug}`}
              className="py-2.5 px-4 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap rounded-sm">

                {cat.name}
              </Link>
            )}
            <Link to="/blog" className="py-2.5 px-4 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap rounded-sm">Blog</Link>
            <Link to="/nosotros" className="py-2.5 px-4 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap rounded-sm">Nosotros</Link>
            <Link to="/contacto" className="py-2.5 px-4 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap rounded-sm">Contáctanos</Link>
          </div>
        </div>
      </nav>

      {/* Mega menu dropdown */}
      {megaMenuOpen &&
      <div
        className="absolute left-0 w-full bg-background border-b shadow-xl z-50 hidden lg:block"
        onMouseEnter={() => setMegaMenuOpen(true)}
        onMouseLeave={() => setMegaMenuOpen(false)}>

          <div className="container mx-auto px-4 py-6 grid grid-cols-3 gap-6">
            {categories.map((cat) =>
          <Link
            key={cat.slug}
            to={`/tienda?categoria=${cat.slug}`}
            className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors group">

                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <h3 className="font-montserrat font-semibold text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                </div>
              </Link>
          )}
          </div>
        </div>
      }

      {/* Mobile menu */}
      {mobileMenuOpen &&
      <div className="lg:hidden bg-background border-b shadow-lg">
          <div className="p-4">
            <div className="relative mb-4">
              <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-input bg-background text-foreground" />

              <Search className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground" />
            </div>
            <Link to="/" className="block py-3 px-2 font-semibold text-sm border-b border-border" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
            {categories.map((cat) =>
          <Link
            key={cat.slug}
            to={`/tienda?categoria=${cat.slug}`}
            className="flex items-center gap-3 py-3 px-2 border-b border-border hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(false)}>

                <span className="text-xl">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.name}</span>
              </Link>
          )}
            <Link to="/blog" className="block py-3 px-2 font-semibold text-sm border-b border-border" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link to="/nosotros" className="block py-3 px-2 font-semibold text-sm border-b border-border" onClick={() => setMobileMenuOpen(false)}>Nosotros</Link>
            <Link to="/contacto" className="block py-3 px-2 font-semibold text-sm" onClick={() => setMobileMenuOpen(false)}>Contáctanos</Link>
          </div>
        </div>
      }
    </header>);

}
