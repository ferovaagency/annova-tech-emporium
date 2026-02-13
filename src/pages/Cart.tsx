import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { Button } from '@/components/ui/button';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <main className="py-16 text-center container mx-auto px-4">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bebas mb-2">Tu carrito está vacío</h1>
        <p className="text-muted-foreground mb-6">Agrega productos para comenzar tu pedido</p>
        <Link to="/tienda" className="inline-block bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
          Ir a la Tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bebas mb-8">Carrito de <span className="text-primary">Compras</span> ({totalItems})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 bg-card rounded-lg border p-4">
                <Link to={`/producto/${product.slug}`}>
                  <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/producto/${product.slug}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">{product.name}</Link>
                  <p className="text-xs text-muted-foreground mt-1">{product.brand} · {product.condition}</p>
                  <p className="text-lg font-bold text-primary mt-2">{formatPrice(product.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(product.id)} className="text-muted-foreground hover:text-primary transition-colors"><Trash2 className="w-4 h-4" /></button>
                  <div className="flex items-center gap-2 border rounded-lg">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-2 hover:bg-muted transition-colors"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-2 hover:bg-muted transition-colors"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card rounded-lg border p-6 h-fit sticky top-40">
            <h2 className="text-xl font-bebas mb-4">Resumen del Pedido</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal ({totalItems} productos)</span><span>{formatPrice(totalPrice)}</span></div>
              <div className="flex justify-between"><span>Envío</span><span className="text-secondary font-medium">Por cotizar</span></div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{formatPrice(totalPrice)}</span></div>
            </div>
            <Link to="/checkout" className="block mt-6">
              <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 text-lg py-3 h-auto">Proceder al Checkout</Button>
            </Link>
            <Link to="/tienda" className="block text-center text-sm text-secondary hover:underline mt-3">Seguir comprando</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
