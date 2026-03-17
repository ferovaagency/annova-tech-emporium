import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle, Star, ChevronRight, Loader2, ImageIcon } from 'lucide-react';
import { products as localProducts, formatPrice } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCard from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getWhatsAppUrlForProduct } from '@/lib/whatsapp';
import UrgencyBadge from '@/components/UrgencyBadge';
import { GA } from '@/hooks/useAnalytics';

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
  category: string | null;
  brand: string | null;
  condition: string | null;
  warranty: string | null;
  short_description: string | null;
  description: string | null;
  specs: Record<string, string> | null;
  stock: number | null;
  reviews: Array<{ author: string; role: string; text: string; rating: number }> | null;
  meta_title: string | null;
  meta_description: string | null;
  active: boolean | null;
}

function formatSpecKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function ImageFallback({ label }: { label: string }) {
  return <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground"><div className="flex flex-col items-center gap-2 text-center"><ImageIcon className="h-12 w-12" /><span className="px-4 text-sm font-medium">{label}</span></div></div>;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [related, setRelated] = useState<DBProduct[]>([]);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setNotFound(false);
      setSelectedImage(0);
      const { data: supabaseProduct } = await supabase.from('products').select('*').eq('slug', slug).eq('active', true).maybeSingle();
      if (supabaseProduct) {
        setProduct(supabaseProduct as unknown as DBProduct);
        setLoading(false);
        return;
      }
      const localProduct = localProducts.find(p => p.slug === slug);
      if (localProduct) {
        setProduct({ id: localProduct.id, name: localProduct.name, slug: localProduct.slug, price: localProduct.oldPrice || localProduct.price, sale_price: localProduct.oldPrice ? localProduct.price : null, images: localProduct.images, category: localProduct.category, brand: localProduct.brand, condition: localProduct.condition, warranty: null, short_description: localProduct.shortDescription, description: localProduct.description, specs: localProduct.specs, stock: null, reviews: null, meta_title: null, meta_description: null, active: true });
        setLoading(false);
        return;
      }
      setNotFound(true);
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (product) {
      GA.viewItem(product.id, product.name, product.sale_price || product.price, product.category || undefined);
    }
    if (product?.category) {
      supabase.from('products').select('*').eq('category', product.category).eq('active', true).neq('id', product.id).limit(4).then(({ data }) => { if (data) setRelated(data as unknown as DBProduct[]); });
    }
  }, [product]);

  if (loading) return <main className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></main>;
  if (notFound || !product) return <div className="container mx-auto px-4 py-16 text-center"><h1 className="text-3xl font-bebas">Producto no encontrado</h1><Link to="/tienda" className="text-primary hover:underline mt-4 inline-block">Volver a la tienda</Link></div>;

  const images = (product.images || []).filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
  const specs = (product.specs || {}) as Record<string, string>;
  const reviews = (product.reviews || []) as Array<{ author: string; role: string; text: string; rating: number }>;
  const productUrl = `${window.location.origin}/producto/${product.slug}`;
  const whatsappUrl = getWhatsAppUrlForProduct(product.name, productUrl);
  const isHtmlDescription = product.description && product.description.trim().startsWith('<');
  const primaryImage = images[0] || '';

  const cartProduct = { id: product.id, name: product.name, slug: product.slug, price: product.sale_price || product.price, oldPrice: product.sale_price ? product.price : undefined, image: primaryImage, images, category: product.category || '', categorySlug: '', brand: product.brand || '', condition: (product.condition || 'Nuevo') as any, shortDescription: product.short_description || '', description: product.description || '', specs, rating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 5, reviews: reviews.length };

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Inicio</Link><ChevronRight className="w-3 h-3" /><Link to="/tienda" className="hover:text-foreground">Tienda</Link><ChevronRight className="w-3 h-3" />{product.category && <><Link to={`/tienda?categoria=${product.category}`} className="hover:text-foreground">{product.category}</Link><ChevronRight className="w-3 h-3" /></>}<span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="bg-muted rounded-xl overflow-hidden mb-4">{images[selectedImage] ? <img src={images[selectedImage]} alt={`${product.name} - imagen ${selectedImage + 1} | AnnovaSoft`} title={product.name} className="w-full aspect-square object-contain p-8" /> : <ImageFallback label="Imagen no disponible" />}</div>
            {images.length > 1 && <div className="flex gap-2">{images.map((img, i) => <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-lg border-2 overflow-hidden ${i === selectedImage ? 'border-primary' : 'border-transparent'}`} title={`${product.name} imagen ${i + 1}`}>{img ? <img src={img} alt={`${product.name} - imagen ${i + 1} | AnnovaSoft`} title={product.name} className="w-full h-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}</button>)}</div>}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2"><Badge variant="secondary" className="text-xs">{product.condition || 'Nuevo'}</Badge>{product.warranty && <Badge className="bg-primary text-primary-foreground text-xs">{product.warranty}</Badge>}</div>
            <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-bebas mb-4">{product.name}</h1>
            {reviews.length > 0 && <div className="flex items-center gap-2 mb-4">{[...Array(5)].map((_, i) => { const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length; return <Star key={i} className={`w-4 h-4 ${i < Math.floor(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />; })}<span className="text-sm text-muted-foreground">({reviews.length} reseñas)</span></div>}
            <div className="flex items-baseline gap-3 mb-4"><span className="text-3xl font-bold text-primary">{formatPrice(product.sale_price || product.price)}</span>{product.sale_price && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>}</div>
            {product.short_description && <p className="text-muted-foreground mb-4">{product.short_description}</p>}
            <UrgencyBadge stock={product.stock ?? undefined} />
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4 mt-4 flex items-start gap-2"><MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><p className="text-sm font-medium text-foreground">Antes de comprar, consulta disponibilidad por WhatsApp</p></div>
            <div className="space-y-3 mb-8"><button onClick={() => addToCart(cartProduct)} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"><ShoppingCart className="w-5 h-5" /> Agregar al Carrito</button><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"><MessageCircle className="w-5 h-5" /> Consulta Disponibilidad</a></div>
            {Object.keys(specs).length > 0 && <div className="bg-muted rounded-lg p-4"><h3 className="font-montserrat font-semibold text-sm mb-3">Especificaciones clave</h3><dl className="space-y-2">{Object.entries(specs).slice(0, 4).map(([k, v]) => <div key={k} className="flex justify-between text-sm"><dt className="text-muted-foreground">{formatSpecKey(k)}</dt><dd className="font-medium">{String(v)}</dd></div>)}</dl></div>}
          </div>
        </div>

        <Tabs defaultValue="descripcion" className="mb-12"><TabsList className="w-full justify-start"><TabsTrigger value="descripcion">Descripción</TabsTrigger><TabsTrigger value="especificaciones">Especificaciones</TabsTrigger><TabsTrigger value="resenas">Reseñas ({reviews.length})</TabsTrigger></TabsList><TabsContent value="descripcion" className="mt-6">{product.description ? (isHtmlDescription ? <div className="prose prose-slate max-w-none product-description" dangerouslySetInnerHTML={{ __html: product.description }} /> : <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>) : <p className="text-muted-foreground">No hay descripción disponible.</p>}</TabsContent><TabsContent value="especificaciones" className="mt-6">{Object.keys(specs).length > 0 ? <div className="bg-card rounded-lg border">{Object.entries(specs).map(([k, v], i) => <div key={k} className={`flex justify-between p-4 text-sm ${i % 2 ? '' : 'bg-muted/50'}`}><span className="font-medium">{formatSpecKey(k)}</span><span className="text-muted-foreground">{String(v)}</span></div>)}</div> : <p className="text-muted-foreground">No hay especificaciones disponibles.</p>}</TabsContent><TabsContent value="resenas" className="mt-6">{reviews.length > 0 ? <div className="space-y-6">{reviews.map((review, i) => <div key={i} className="bg-card border rounded-lg p-5"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">{review.author.charAt(0).toUpperCase()}</div><div><p className="font-medium text-sm">{review.author}</p><p className="text-xs text-muted-foreground">{review.role}</p></div></div><div className="flex gap-1 mb-2">{[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />)}</div><p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p></div>)}</div> : <div className="text-center py-8 text-muted-foreground"><p>Sé el primero en reseñar este producto.</p></div>}</TabsContent></Tabs>

        <section className="bg-muted rounded-2xl p-6 md:p-8 mb-12"><h2 className="text-2xl font-bebas mb-2">Solicita <span className="text-primary">Cotización Empresarial</span></h2><p className="text-sm text-muted-foreground mb-6">Completa el formulario y un asesor te contactará con precios especiales para tu empresa.</p><form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => e.preventDefault()}><Input placeholder="Nombre completo" /><Input placeholder="Empresa" /><Input placeholder="Email corporativo" type="email" /><Input placeholder="Teléfono" type="tel" /><Input placeholder="NIT de la empresa" /><Input placeholder="Cantidad requerida" type="number" /><Textarea placeholder="Mensaje adicional" className="md:col-span-2" /><div className="md:col-span-2"><Button className="bg-primary text-primary-foreground hover:opacity-90 px-8">Enviar Solicitud</Button></div></form></section>

        {related.length > 0 && <section><h2 className="text-2xl font-bebas mb-6">Productos <span className="text-primary">Relacionados</span></h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map(p => { const relatedCartProduct = { id: p.id, name: p.name, slug: p.slug, price: p.sale_price || p.price, oldPrice: p.sale_price ? p.price : undefined, image: (p.images && p.images[0]) || '', images: (p.images || []).filter((img): img is string => typeof img === 'string' && img.trim().length > 0), category: p.category || '', categorySlug: '', brand: p.brand || '', condition: (p.condition || 'Nuevo') as any, shortDescription: p.short_description || '', description: '', specs: {}, rating: 5, reviews: 0 }; return <ProductCard key={p.id} product={relatedCartProduct} />; })}</div></section>}
      </div>
    </main>
  );
}
