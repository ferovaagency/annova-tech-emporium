import { Link } from 'react-router-dom';
import { ImageIcon, ShoppingCart, Star } from 'lucide-react';
import { Product, formatPrice } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasImage = Boolean(product.image && product.image.trim());

  const badgeClass = product.badge === 'Oferta' ? 'bg-primary text-primary-foreground' :
    product.badge === 'Reacondicionado' ? 'bg-secondary text-secondary-foreground' :
    product.badge === 'Más vendido' ? 'bg-accent text-accent-foreground' :
    'bg-secondary text-secondary-foreground';

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/producto/${product.slug}`} className="relative overflow-hidden" title={product.name}>
        {hasImage ? (
          <img
            src={product.image}
            alt={`${product.name}${product.brand ? ` ${product.brand}` : ''} | AnnovaSoft`}
            title={product.name}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const t = e.currentTarget;
              const fallback = window.location.origin + '/placeholder.svg';
              if (t.src !== fallback) t.src = fallback;
            }}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageIcon className="h-10 w-10" />
              <span className="px-4 text-xs font-medium">Imagen no disponible</span>
            </div>
          </div>
        )}
        {product.badge && (
          <Badge className={`absolute left-2 top-2 ${badgeClass} text-xs`}>
            {product.badge}
          </Badge>
        )}
        {product.oldPrice && (
          <Badge className="absolute right-2 top-2 bg-primary text-primary-foreground text-xs">
            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 text-xs text-muted-foreground">{product.brand} · {product.condition}</p>
        <Link to={`/producto/${product.slug}`} title={product.name}>
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight transition-colors hover:text-primary font-montserrat">{product.name}</h3>
        </Link>

        <div className="mb-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); addToCart(product); }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
