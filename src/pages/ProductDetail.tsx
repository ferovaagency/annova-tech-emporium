import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, MessageCircle, Star, ChevronRight } from 'lucide-react';
import { products, formatPrice } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCard from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ProductDetail() {
  const { slug } = useParams();
  const product = products.find(p => p.slug === slug);
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bebas">Producto no encontrado</h1>
      <Link to="/tienda" className="text-primary hover:underline mt-4 inline-block">Volver a la tienda</Link>
    </div>
  );

  const related = products.filter(p => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4);
  const whatsappMsg = encodeURIComponent(`Hola, quiero información sobre: ${product.name} - ${formatPrice(product.price)}`);

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/tienda" className="hover:text-foreground">Tienda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/tienda?categoria=${product.categorySlug}`} className="hover:text-foreground">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        {/* Product top */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <div>
            <div className="bg-muted rounded-xl overflow-hidden mb-4">
              <img src={product.images[selectedImage]} alt={product.name} className="w-full aspect-square object-contain p-8" />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-lg border-2 overflow-hidden ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{product.condition}</Badge>
              {product.badge && product.badge !== product.condition && <Badge className="bg-primary text-primary-foreground text-xs">{product.badge}</Badge>}
            </div>

            <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-bebas mb-4">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
              ))}
              <span className="text-sm text-muted-foreground">({product.reviews} reseñas)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.oldPrice && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>}
            </div>

            <p className="text-muted-foreground mb-6">{product.shortDescription}</p>

            <div className="space-y-3 mb-8">
              <button onClick={() => addToCart(product)} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <ShoppingCart className="w-5 h-5" /> Agregar al Carrito
              </button>
              <a
                href={`https://wa.me/5712345678?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-5 h-5" /> Consulta Disponibilidad
              </a>
            </div>

            {/* Quick specs */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-montserrat font-semibold text-sm mb-3">Especificaciones clave</h3>
              <dl className="space-y-2">
                {Object.entries(product.specs).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="descripcion" className="mb-12">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="descripcion">Descripción</TabsTrigger>
            <TabsTrigger value="especificaciones">Especificaciones</TabsTrigger>
            <TabsTrigger value="resenas">Reseñas ({product.reviews})</TabsTrigger>
          </TabsList>
          <TabsContent value="descripcion" className="mt-6">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="especificaciones" className="mt-6">
            <div className="bg-card rounded-lg border">
              {Object.entries(product.specs).map(([k, v], i) => (
                <div key={k} className={`flex justify-between p-4 text-sm ${i % 2 ? '' : 'bg-muted/50'}`}>
                  <span className="font-medium">{k}</span>
                  <span className="text-muted-foreground">{v}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="resenas" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>Las reseñas estarán disponibles próximamente.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quote form */}
        <section className="bg-muted rounded-2xl p-6 md:p-8 mb-12">
          <h2 className="text-2xl font-bebas mb-2">Solicita <span className="text-primary">Cotización Empresarial</span></h2>
          <p className="text-sm text-muted-foreground mb-6">Completa el formulario y un asesor te contactará con precios especiales para tu empresa.</p>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => e.preventDefault()}>
            <Input placeholder="Nombre completo" />
            <Input placeholder="Empresa" />
            <Input placeholder="Email corporativo" type="email" />
            <Input placeholder="Teléfono" type="tel" />
            <Input placeholder="NIT de la empresa" />
            <Input placeholder="Cantidad requerida" type="number" />
            <Textarea placeholder="Mensaje adicional" className="md:col-span-2" />
            <div className="md:col-span-2">
              <Button className="bg-primary text-primary-foreground hover:opacity-90 px-8">Enviar Solicitud</Button>
            </div>
          </form>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bebas mb-6">Productos <span className="text-secondary">Relacionados</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
