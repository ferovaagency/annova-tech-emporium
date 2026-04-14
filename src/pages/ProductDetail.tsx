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
import { normalizeCategorySlug } from '@/lib/catalog';
import { useDbCategories } from '@/hooks/useDbCategories';
import UrgencyBadge from '@/components/UrgencyBadge';
import { GA } from '@/hooks/useAnalytics';
import { useDocumentSeo } from '@/hooks/useDocumentSeo';
import { buildSiteUrl } from '@/lib/site';

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

  useDocumentSeo({
    title: product?.meta_title || (product ? `${product.name} | AnnovaSoft` : 'AnnovaSoft'),
    description: product?.meta_description || product?.short_description || 'Tecnología empresarial en Colombia.',
    canonical: product ? buildSiteUrl(`/producto/${product.slug}`) : undefined,
  });

  if (loading) return <main className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></main>;
  if (notFound || !product) return <div className="container mx-auto px-4 py-16 text-center"><h1 className="text-3xl font-bebas">Producto no encontrado</h1><Link to="/tienda" className="mt-4 inline-block text-primary hover:underline">Volver a la tienda</Link></div>;

  const images = (product.images || []).filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
  const specs = (product.specs || {}) as Record<string, string>;
  const reviews = (product.reviews || []) as Array<{ author: string; role: string; text: string; rating: number }>;
  const productUrl = buildSiteUrl(`/producto/${product.slug}`);
  const whatsappUrl = getWhatsAppUrlForProduct(product.name, productUrl);
  const isHtmlDescription = product.description && product.description.trim().startsWith('<');
  const primaryImage = images[0] || '';
  const categorySlug = product.category ? normalizeCategorySlug(product.category) : '';

  // Find parent category for subcategory breadcrumb using DB categories
  const { categories: allCats } = useDbCategories();
  let parentCategoryName = '';
  let parentCategorySlug = '';
  const currentCat = allCats.find((c) => c.slug === categorySlug);
  if (currentCat?.parent_id) {
    const parentCat = allCats.find((c) => c.id === currentCat.parent_id);
    if (parentCat) {
      parentCategorySlug = parentCat.slug;
      parentCategoryName = parentCat.name;
    }
  }

  const cartProduct = { id: product.id, name: product.name, slug: product.slug, price: product.sale_price || product.price, oldPrice: product.sale_price ? product.price : undefined, image: primaryImage, images, category: product.category || '', categorySlug, brand: product.brand || '', condition: (product.condition || 'Nuevo') as any, shortDescription: product.short_description || '', description: product.description || '', specs, rating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 5, reviews: reviews.length };

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Inicio</Link><ChevronRight className="h-3 w-3" /><Link to="/tienda" className="hover:text-foreground">Tienda</Link><ChevronRight className="h-3 w-3" />
          {parentCategoryName && <><Link to={`/tienda?categoria=${parentCategorySlug}`} className="hover:text-foreground">{parentCategoryName}</Link><ChevronRight className="h-3 w-3" /></>}
          {product.category && <><Link to={`/tienda?categoria=${categorySlug}`} className="hover:text-foreground">{product.category}</Link><ChevronRight className="h-3 w-3" /></>}
          <span className="truncate font-medium text-foreground">{product.name}</span>
        </nav>

        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 overflow-hidden rounded-xl bg-muted">{images[selectedImage] ? <img src={images[selectedImage]} alt={`${product.name} - imagen ${selectedImage + 1} | AnnovaSoft`} title={product.name} className="aspect-square w-full object-contain p-8" /> : <ImageFallback label="Imagen no disponible" />}</div>
            {images.length > 1 && <div className="flex gap-2">{images.map((img, i) => <button key={i} onClick={() => setSelectedImage(i)} className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`} title={`${product.name} imagen ${i + 1}`}>{img ? <img src={img} alt={`${product.name} - imagen ${i + 1} | AnnovaSoft`} title={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}</button>)}</div>}
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2"><Badge variant="secondary" className="text-xs">{product.condition || 'Nuevo'}</Badge>{product.warranty && <Badge className="bg-primary text-xs text-primary-foreground">{product.warranty}</Badge>}</div>
            <p className="mb-1 text-sm text-muted-foreground">{product.brand}</p>
            <h1 className="mb-4 text-2xl font-bebas md:text-3xl">{product.name}</h1>
            {reviews.length > 0 && <div className="mb-4 flex items-center gap-2">{[...Array(5)].map((_, i) => { const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length; return <Star key={i} className={`h-4 w-4 ${i < Math.floor(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />; })}<span className="text-sm text-muted-foreground">({reviews.length} reseñas)</span></div>}
            <div className="mb-4 flex items-baseline gap-3"><span className="text-3xl font-bold text-primary">{formatPrice(product.sale_price || product.price)}</span>{product.sale_price && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>}</div>
            {product.short_description && <p className="mb-4 text-muted-foreground">{product.short_description}</p>}
            <UrgencyBadge stock={product.stock ?? undefined} showTimer={false} />
            <div className="mt-4 mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3"><MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" /><p className="text-sm font-medium text-foreground">Solicita disponibilidad y te confirmamos en máximo 48h.</p></div>
            <div className="mb-8 space-y-3"><button onClick={() => addToCart(cartProduct)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"><ShoppingCart className="h-5 w-5" /> Agregar al Carrito</button><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"><MessageCircle className="h-5 w-5" /> Solicitar disponibilidad</a></div>
            {Object.keys(specs).length > 0 && <div className="rounded-lg bg-muted p-4"><h3 className="mb-3 text-sm font-semibold font-montserrat">Especificaciones clave</h3><dl className="space-y-2">{Object.entries(specs).slice(0, 4).map(([k, v]) => <div key={k} className="flex justify-between text-sm"><dt className="text-muted-foreground">{formatSpecKey(k)}</dt><dd className="font-medium">{String(v)}</dd></div>)}</dl></div>}
          </div>
        </div>

        <Tabs defaultValue="descripcion" className="mb-12"><TabsList className="w-full justify-start"><TabsTrigger value="descripcion">Descripción</TabsTrigger><TabsTrigger value="especificaciones">Especificaciones</TabsTrigger><TabsTrigger value="resenas">Reseñas ({reviews.length})</TabsTrigger></TabsList><TabsContent value="descripcion" className="mt-6">{product.description ? (isHtmlDescription ? <div className="product-description prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} /> : <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>) : <p className="text-muted-foreground">No hay descripción disponible.</p>}</TabsContent><TabsContent value="especificaciones" className="mt-6">{Object.keys(specs).length > 0 ? <div className="rounded-lg border bg-card">{Object.entries(specs).map(([k, v], i) => <div key={k} className={`flex justify-between p-4 text-sm ${i % 2 ? '' : 'bg-muted/50'}`}><span className="font-medium">{formatSpecKey(k)}</span><span className="text-muted-foreground">{String(v)}</span></div>)}</div> : <p className="text-muted-foreground">No hay especificaciones disponibles.</p>}</TabsContent><TabsContent value="resenas" className="mt-6">{reviews.length > 0 ? <div className="space-y-6">{reviews.map((review, i) => <div key={i} className="rounded-lg border bg-card p-5"><div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{review.author.charAt(0).toUpperCase()}</div><div><p className="text-sm font-medium">{review.author}</p><p className="text-xs text-muted-foreground">{review.role}</p></div></div><div className="mb-2 flex gap-1">{[...Array(5)].map((_, j) => <Star key={j} className={`h-4 w-4 ${j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />)}</div><p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p></div>)}</div> : <div className="py-8 text-center text-muted-foreground"><p>Sé el primero en reseñar este producto.</p></div>}</TabsContent></Tabs>

        <section className="mb-12 rounded-2xl bg-muted p-6 md:p-8"><h2 className="mb-2 text-2xl font-bebas">Solicita <span className="text-primary">Cotización Empresarial</span></h2><p className="mb-6 text-sm text-muted-foreground">Completa el formulario y un asesor te contactará con precios especiales para tu empresa.</p><form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={e => e.preventDefault()}><Input placeholder="Nombre completo" /><Input placeholder="Empresa" /><Input placeholder="Email corporativo" type="email" /><Input placeholder="Teléfono" type="tel" /><Input placeholder="NIT de la empresa" /><Input placeholder="Cantidad requerida" type="number" /><Textarea placeholder="Mensaje adicional" className="md:col-span-2" /><div className="md:col-span-2"><Button className="bg-primary px-8 text-primary-foreground hover:opacity-90">Enviar Solicitud</Button></div></form></section>

        {related.length > 0 && <section><h2 className="mb-6 text-2xl font-bebas">Productos <span className="text-primary">Relacionados</span></h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map(p => { const relatedCartProduct = { id: p.id, name: p.name, slug: p.slug, price: p.sale_price || p.price, oldPrice: p.sale_price ? p.price : undefined, image: (p.images && p.images[0]) || '', images: (p.images || []).filter((img): img is string => typeof img === 'string' && img.trim().length > 0), category: p.category || '', categorySlug: p.category ? normalizeCategorySlug(p.category) : '', brand: p.brand || '', condition: (p.condition || 'Nuevo') as any, shortDescription: p.short_description || '', description: '', specs: {}, rating: 5, reviews: 0 }; return <ProductCard key={p.id} product={relatedCartProduct} />; })}</div></section>}
      </div>
    </main>
  );
}
