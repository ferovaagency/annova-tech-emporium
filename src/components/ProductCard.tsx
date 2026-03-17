import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product, formatPrice } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const badgeClass = product.badge === 'Oferta' ? 'bg-primary text-primary-foreground' :
    product.badge === 'Reacondicionado' ? 'bg-secondary text-secondary-foreground' :
    product.badge === 'Más vendido' ? 'bg-accent text-accent-foreground' :
    'bg-secondary text-secondary-foreground';

  return (
    <div className="group bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <Link to={`/producto/${product.slug}`} className="relative overflow-hidden" title={product.name}>
        <img
          src={product.image}
          alt={`${product.name}${product.brand ? ` ${product.brand}` : ''} | AnnovaSoft`}
          title={product.name}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.badge && (
          <Badge className={`absolute top-2 left-2 ${badgeClass} text-xs`}>
            {product.badge}
          </Badge>
        )}
        {product.oldPrice && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </Badge>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground mb-1">{product.brand} · {product.condition}</p>
        <Link to={`/producto/${product.slug}`} title={product.name}>
          <h3 className="font-montserrat font-semibold text-sm leading-tight mb-2 hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); addToCart(product); }}
            className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
