import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <main className="py-16 text-center container mx-auto px-4">
        <CheckCircle className="w-20 h-20 mx-auto text-secondary mb-4" />
        <h1 className="text-3xl font-bebas mb-2">¡Pedido Recibido!</h1>
        <p className="text-muted-foreground mb-2 max-w-md mx-auto">Tu solicitud ha sido enviada exitosamente. Un asesor de Annova se comunicará contigo para confirmar los detalles y coordinar el pago.</p>
        <p className="text-sm text-muted-foreground mb-6">Referencia: ANV-{Date.now().toString().slice(-6)}</p>
        <a href="/" className="inline-block bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg">Volver al Inicio</a>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="py-16 text-center container mx-auto px-4">
        <h1 className="text-3xl font-bebas mb-4">No hay productos en tu carrito</h1>
        <a href="/tienda" className="text-primary hover:underline">Ir a la tienda</a>
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bebas mb-8">Checkout <span className="text-primary">Empresarial</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={e => { e.preventDefault(); clearCart(); setSubmitted(true); }} className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bebas mb-4">Datos de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Razón Social *" required />
                  <Input placeholder="NIT *" required />
                  <Input placeholder="Nombre del contacto *" required />
                  <Input placeholder="Cargo" />
                  <Input placeholder="Email corporativo *" type="email" required />
                  <Input placeholder="Teléfono *" type="tel" required />
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bebas mb-4">Dirección de Entrega</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Dirección *" required className="md:col-span-2" />
                  <Input placeholder="Ciudad *" required />
                  <Input placeholder="Departamento *" required />
                  <Input placeholder="Código postal" />
                  <Input placeholder="Referencias adicionales" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90 text-lg py-3 h-auto">
                Confirmar Pedido
              </Button>
              <p className="text-xs text-muted-foreground text-center">Un asesor te contactará para coordinar forma de pago y envío</p>
            </form>
          </div>

          {/* Order summary */}
          <div className="bg-card rounded-lg border p-6 h-fit sticky top-40">
            <h2 className="text-xl font-bebas mb-4">Resumen ({totalItems})</h2>
            <div className="space-y-3 mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <img src={product.image} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">x{quantity}</p>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(product.price * quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
