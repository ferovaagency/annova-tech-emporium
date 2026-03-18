import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Shield, Truck, Headphones } from 'lucide-react';
import { products as localProducts, formatPrice, Product } from '@/data/products';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { mapDbProduct } from '@/lib/catalog';
import { useActiveCategories } from '@/hooks/useActiveCategories';
import heroBanner1 from '@/assets/hero-banner-1.png';

function ProductSkeleton() {
  return <div className="space-y-3 rounded-lg border bg-card p-3"><Skeleton className="aspect-square w-full rounded-md" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-8 w-full rounded-md" /></div>;
}

const heroBanners = [
  {
    src: heroBanner1,
    alt: 'Banner principal AnnovaSoft tecnología empresarial Colombia',
    title: 'AnnovaSoft tecnología empresarial',
  },
];

function CategoryVisual({ name, image }: { name: string; image?: string }) {
  const hasRealImage = Boolean(image && image.trim() && image !== '/placeholder.svg');

  if (hasRealImage) {
    return <img src={image} alt={`${name} AnnovaSoft tecnología empresarial Colombia`} title={name} className="h-32 w-full object-cover object-center transition-transform duration-300 group-hover:scale-110" loading="lazy" />;
  }

  return <div className="h-32 w-full bg-muted" aria-hidden="true" />;
}

export default function Index() {
  const { categories } = useActiveCategories();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        let { data: featData } = await supabase.from('products').select('*').eq('active', true).eq('featured', true).limit(8);
        if (!featData || featData.length === 0) {
          const latest = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }).limit(8);
          featData = latest.data || [];
        }
        const offerData = await supabase.from('products').select('*').eq('active', true).not('sale_price', 'is', null).limit(8);
        const activeData = await supabase.from('products').select('*').eq('active', true);
        const activeProducts = (activeData.data || []).map(mapDbProduct);
        setFeatured((featData || []).length > 0 ? (featData || []).map(mapDbProduct) : localProducts.slice(0, 8));
        setOffers((offerData.data || []).length > 0 ? (offerData.data || []).map(mapDbProduct) : localProducts.filter((p) => p.oldPrice).slice(0, 8));
        setBestSellers(activeProducts.length > 0 ? [...activeProducts].sort(() => Math.random() - 0.5).slice(0, 8) : localProducts.slice(0, 8));
      } catch {
        setFeatured(localProducts.slice(0, 8));
        setOffers(localProducts.filter((p) => p.oldPrice).slice(0, 8));
        setBestSellers(localProducts.slice(0, 8));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const skeletons = useMemo(() => Array.from({ length: 4 }, (_, i) => <ProductSkeleton key={i} />), []);

  const goToBanner = (index: number) => setHeroIndex(index);
  const goPrev = () => setHeroIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  const goNext = () => setHeroIndex((prev) => (prev + 1) % heroBanners.length);

  return (
    <main>
      <section className="relative max-h-[560px] overflow-hidden bg-accent md:max-h-[560px]">
        <div className="relative h-[320px] w-full max-h-[560px] md:h-[560px] md:max-h-[560px]">
          {heroBanners.map((banner, index) => (
            <div key={banner.src} className={`absolute inset-0 transition-opacity duration-700 ${index === heroIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              <img src={banner.src} alt={banner.alt} title={banner.title} className="h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/20" />
            </div>
          ))}

          <div className="absolute inset-0">
            <div className="container mx-auto flex h-full items-center px-4">
              <div className="max-w-2xl text-foreground">
                <h1 className="mb-4 text-4xl font-bebas leading-none md:text-6xl lg:text-7xl">Tecnología<br /><span className="text-primary">Empresarial</span><br />al Mejor Precio</h1>
                <p className="mb-8 max-w-lg font-montserrat text-base text-foreground/80 md:text-lg">Software, servidores, infraestructura y equipos de cómputo para tu empresa con precios competitivos y soporte dedicado.</p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/tienda" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground transition-opacity hover:opacity-90">Comprar Ahora <ArrowRight className="h-5 w-5" /></Link>
                  <a href={getWhatsAppUrl('Necesito cotización empresarial de AnnovaSoft')} target="_blank" rel="noopener noreferrer" className="rounded-lg border-2 border-foreground/20 px-8 py-3 text-lg font-semibold text-foreground transition-colors hover:border-foreground/40">Cotizar</a>
                </div>
              </div>
            </div>
          </div>

          {heroBanners.length > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-3 text-foreground shadow hover:bg-background" aria-label="Banner anterior">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-3 text-foreground shadow hover:bg-background" aria-label="Siguiente banner">
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                {heroBanners.map((banner, index) => (
                  <button key={banner.src} onClick={() => goToBanner(index)} className={`h-2.5 w-2.5 rounded-full transition-all ${index === heroIndex ? 'scale-110 bg-primary' : 'bg-background/70'}`} aria-label={`Ir al banner ${index + 1}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="border-b bg-muted py-4"><div className="container mx-auto flex flex-wrap justify-center gap-8 px-4 text-sm font-medium text-muted-foreground"><span className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Envío a todo Colombia</span><span className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Garantía empresarial</span><span className="flex items-center gap-2"><Headphones className="h-5 w-5 text-primary" /> Soporte dedicado</span></div></section>

      {categories.length > 0 && <section className="py-12"><div className="container mx-auto px-4"><h2 className="mb-8 text-center text-3xl font-bebas md:text-4xl">Explora Nuestras <span className="text-primary">Categorías</span></h2><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">{categories.map((cat) => <Link key={cat.slug} to={`/tienda?categoria=${cat.slug}`} className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg"><div className="overflow-hidden"><CategoryVisual name={cat.name} image={cat.image} /></div><div className="p-3 text-center"><span className="text-2xl">{cat.icon}</span><h3 className="mt-1 font-montserrat text-xs font-semibold">{cat.name}</h3></div></Link>)}</div></div></section>}

      <section className="bg-muted py-12"><div className="container mx-auto px-4"><div className="mb-8 flex items-center justify-between"><h2 className="text-3xl font-bebas md:text-4xl">Productos <span className="text-primary">Destacados</span></h2><Link to="/tienda" className="flex items-center gap-1 text-sm font-semibold text-secondary hover:underline">Ver todos <ArrowRight className="h-4 w-4" /></Link></div><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{loading ? skeletons : featured.map((p) => <ProductCard key={p.id} product={p} />)}</div></div></section>

      {(loading || offers.length > 0) && <section className="bg-gradient-to-r from-primary to-accent py-12 text-primary-foreground"><div className="container mx-auto px-4"><div className="mb-8 text-center"><h2 className="text-3xl font-bebas md:text-5xl">🔥 Ofertas Especiales</h2><p className="mt-2 font-montserrat opacity-90">Aprovecha descuentos exclusivos en tecnología empresarial</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{loading ? Array.from({ length: 3 }, (_, i) => <div key={i} className="flex items-center gap-4 rounded-xl bg-background/10 p-4 backdrop-blur-sm"><Skeleton className="h-24 w-24 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-6 w-1/2" /></div></div>) : offers.map((p) => <Link key={p.id} to={`/producto/${p.slug}`} className="flex items-center gap-4 rounded-xl bg-background/10 p-4 backdrop-blur-sm transition-colors hover:bg-background/20">{p.image ? <img src={p.image} alt={`${p.name}${p.brand ? ` ${p.brand}` : ''} | AnnovaSoft`} title={p.name} className="h-24 w-24 rounded-lg object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-background/20 text-xs font-semibold">Sin imagen</div>}<div><h3 className="text-sm font-semibold">{p.name}</h3><div className="mt-1 flex items-baseline gap-2"><span className="text-xl font-bold">{formatPrice(p.price)}</span>{p.oldPrice && <span className="text-sm opacity-60 line-through">{formatPrice(p.oldPrice)}</span>}</div></div></Link>)}</div></div></section>}

      <section className="py-12"><div className="container mx-auto px-4"><h2 className="mb-8 text-center text-3xl font-bebas md:text-4xl">Los Más <span className="text-primary">Vendidos</span></h2><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{loading ? skeletons : bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}</div></div></section>

      <section className="border-t bg-muted py-16"><div className="container mx-auto px-4 text-center"><h2 className="mb-4 text-3xl font-bebas md:text-5xl">¿Necesitas Equipar Tu Empresa?</h2><p className="mx-auto mb-8 max-w-2xl font-montserrat text-lg text-muted-foreground">Solicita una cotización personalizada y recibe asesoría de nuestros expertos en tecnología empresarial.</p><a href={getWhatsAppUrl('Hola, necesito una cotización empresarial de AnnovaSoft')} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-primary px-10 py-4 text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90">Solicitar Cotización</a></div></section>
    </main>
  );
}
