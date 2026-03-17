import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Truck, Headphones } from 'lucide-react';
import { products as localProducts, categories, formatPrice, Product } from '@/data/products';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

function mapDbProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.sale_price || p.price,
    oldPrice: p.sale_price ? p.price : undefined,
    image: (p.images && p.images[0]) || 'https://placehold.co/400x400?text=Sin+imagen',
    images: p.images || [],
    category: p.category || '',
    categorySlug: (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
    brand: p.brand || '',
    condition: (p.condition || 'Nuevo') as any,
    shortDescription: p.short_description || '',
    description: p.description || '',
    specs: (p.specs || {}) as Record<string, string>,
    rating: 4.8,
    reviews: Array.isArray(p.reviews) ? p.reviews.length : 0,
  };
}

function ProductSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-3 space-y-3">
      <Skeleton className="w-full aspect-square rounded-md" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

export default function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Featured
        let { data: featData } = await supabase.from('products').select('*').eq('active', true).eq('featured', true).limit(8);
        if (!featData || featData.length === 0) {
          ({ data: featData } = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }).limit(8));
        }
        setFeatured(featData && featData.length > 0 ? featData.map(mapDbProduct) : localProducts.filter(p => p.featured).slice(0, 8));

        // Offers
        const { data: offerData } = await supabase.from('products').select('*').eq('active', true).not('sale_price', 'is', null).limit(8);
        setOffers(offerData && offerData.length > 0 ? offerData.map(mapDbProduct) : localProducts.filter(p => p.oldPrice).slice(0, 8));

        // Best sellers - random active products
        const { data: bsData } = await supabase.from('products').select('*').eq('active', true).limit(8);
        setBestSellers(bsData && bsData.length > 0 ? bsData.map(mapDbProduct).sort(() => Math.random() - 0.5) : localProducts.filter(p => p.bestSeller));
      } catch {
        setFeatured(localProducts.filter(p => p.featured).slice(0, 8));
        setOffers(localProducts.filter(p => p.oldPrice).slice(0, 8));
        setBestSellers(localProducts.filter(p => p.bestSeller));
      }
      setLoading(false);
    }
    load();
  }, []);

  const skeletons = Array.from({ length: 4 }, (_, i) => <ProductSkeleton key={i} />);

  return (
    <main>
      {/* Hero Banner */}
      <section className="relative bg-accent overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-accent-foreground z-10">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bebas leading-none mb-4">
              Tecnología<br />
              <span className="text-primary">Empresarial</span><br />
              al Mejor Precio
            </h1>
            <p className="font-montserrat text-base md:text-lg opacity-80 mb-8 max-w-lg">
              Software, servidores, infraestructura y equipos de cómputo para tu empresa con precios competitivos y soporte dedicado.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/tienda" className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                Comprar Ahora <ArrowRight className="w-5 h-5" />
              </Link>
              <a href={getWhatsAppUrl("Necesito cotización empresarial")} target="_blank" rel="noopener noreferrer" className="border-2 border-accent-foreground/30 text-accent-foreground font-semibold px-8 py-3 rounded-lg text-lg hover:border-accent-foreground/60 transition-colors">
                Cotizar
              </a>
            </div>
          </div>
          <div className="flex-1 relative">
            <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop" alt="Infraestructura tecnológica empresarial" className="rounded-2xl shadow-2xl w-full max-w-lg mx-auto" />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-muted py-4 border-b">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground">
          <span className="flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Envío a todo Colombia</span>
          <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Garantía empresarial</span>
          <span className="flex items-center gap-2"><Headphones className="w-5 h-5 text-primary" /> Soporte dedicado</span>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bebas text-center mb-8">Explora Nuestras <span className="text-primary">Categorías</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link key={cat.slug} to={`/tienda?categoria=${cat.slug}`} className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-3 text-center">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="font-montserrat font-semibold text-xs mt-1">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bebas">Productos <span className="text-primary">Destacados</span></h2>
            <Link to="/tienda" className="text-secondary font-semibold text-sm hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading ? skeletons : featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Offers Banner */}
      {(loading || offers.length > 0) && (
        <section className="py-12 bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-bebas">🔥 Ofertas Especiales</h2>
              <p className="font-montserrat mt-2 opacity-90">Aprovecha descuentos exclusivos en tecnología empresarial</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="bg-background/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                offers.map(p => (
                  <Link key={p.id} to={`/producto/${p.slug}`} className="bg-background/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 hover:bg-background/20 transition-colors">
                    <img src={p.image} alt={p.name} className="w-24 h-24 object-cover rounded-lg" />
                    <div>
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold">{formatPrice(p.price)}</span>
                        {p.oldPrice && <span className="text-sm line-through opacity-60">{formatPrice(p.oldPrice)}</span>}
                      </div>
                      {p.oldPrice && <span className="text-xs bg-background/20 px-2 py-0.5 rounded-full">Ahorra {formatPrice(p.oldPrice - p.price)}</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bebas text-center mb-8">Los Más <span className="text-primary">Vendidos</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? skeletons : bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bebas mb-4">¿Necesitas Equipar Tu Empresa?</h2>
          <p className="font-montserrat text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Solicita una cotización personalizada y recibe asesoría de nuestros expertos en tecnología empresarial.</p>
          <a href={getWhatsAppUrl("Hola, necesito una cotización empresarial")} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-primary-foreground font-bold px-10 py-4 rounded-lg text-lg hover:opacity-90 transition-opacity">
            Solicitar Cotización
          </a>
        </div>
      </section>
    </main>
  );
}
