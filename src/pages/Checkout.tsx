import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, ExternalLink, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { buildWompiCheckoutUrl, generateOrderReference } from '@/lib/wompi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type AvailabilityStatus = 'idle' | 'pending' | 'available' | 'unavailable';

interface SuggestedProduct {
  name: string;
  slug: string;
  price: number;
}

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');
  const [contactName, setContactName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [references, setReferences] = useState('');

  // Availability modal
  const [modalOpen, setModalOpen] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [adminNotes, setAdminNotes] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = (id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('availability_requests')
        .select('status, admin_notes, suggested_products')
        .eq('id', id)
        .single();

      if (data && data.status !== 'pending') {
        setAvailabilityStatus(data.status === 'available' ? 'available' : 'unavailable');
        setAdminNotes(data.admin_notes || '');
        setSuggestedProducts((data.suggested_products as SuggestedProduct[]) || []);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 8000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = generateOrderReference();

    setModalOpen(true);
    setAvailabilityStatus('pending');

    const { data, error } = await supabase.from('availability_requests').insert({
      order_id: orderId,
      customer_name: contactName,
      customer_phone: phone,
      customer_email: email,
      items: items.map(({ product, quantity }) => ({
        name: product.name,
        quantity,
        price: product.price,
        slug: product.slug,
      })),
      total: totalPrice,
      status: 'pending',
    }).select('id').single();

    if (error) {
      console.error('Error creating availability request:', error);
      setAvailabilityStatus('idle');
      setModalOpen(false);
      return;
    }

    if (data) {
      setRequestId(data.id);
      startPolling(data.id);
    }
  };

  const handleProceedToPayment = async () => {
    const url = await buildWompiCheckoutUrl({
      reference: generateOrderReference(),
      amountInCents: totalPrice * 100,
      customerEmail: email,
      customerFullName: contactName,
      customerPhoneNumber: phone,
      shippingAddress: { addressLine1: address, city },
    });
    clearCart();
    window.location.href = url;
  };

  const closeAndReset = () => {
    setModalOpen(false);
    setAvailabilityStatus('idle');
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bebas mb-4">Datos de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Razón Social *" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  <Input placeholder="NIT *" required value={nit} onChange={e => setNit(e.target.value)} />
                  <Input placeholder="Nombre del contacto *" required value={contactName} onChange={e => setContactName(e.target.value)} />
                  <Input placeholder="Cargo" value={position} onChange={e => setPosition(e.target.value)} />
                  <Input placeholder="Email corporativo *" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                  <Input placeholder="Teléfono *" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bebas mb-4">Dirección de Entrega</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Dirección *" required className="md:col-span-2" value={address} onChange={e => setAddress(e.target.value)} />
                  <Input placeholder="Ciudad *" required value={city} onChange={e => setCity(e.target.value)} />
                  <Input placeholder="Departamento *" required value={department} onChange={e => setDepartment(e.target.value)} />
                  <Input placeholder="Código postal" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                  <Input placeholder="Referencias adicionales" value={references} onChange={e => setReferences(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90 text-lg py-3 h-auto">
                Pagar
              </Button>
              <p className="text-xs text-muted-foreground text-center">Se verificará la disponibilidad antes de proceder al pago</p>
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

      {/* Availability confirmation modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        // Only allow closing if not pending
        if (!open && availabilityStatus === 'pending') return;
        if (!open) closeAndReset();
      }}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => {
          if (availabilityStatus === 'pending') e.preventDefault();
        }}>
          {availabilityStatus === 'pending' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Confirmando disponibilidad de tu pedido</DialogTitle>
                <DialogDescription>
                  Estamos verificando que todos tus productos están disponibles. Un asesor revisará tu pedido en minutos.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center py-8 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Esperando confirmación del asesor...</p>
              </div>
            </>
          )}

          {availabilityStatus === 'available' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-green-600">¡Productos disponibles! Procede a pagar</DialogTitle>
                <DialogDescription>
                  Tu pedido está listo. Haz clic para ir al pago seguro.
                </DialogDescription>
              </DialogHeader>
              {adminNotes && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Nota del asesor:</p>
                  <p className="text-muted-foreground">{adminNotes}</p>
                </div>
              )}
              <Button onClick={handleProceedToPayment} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 h-auto">
                Ir a pagar con Wompi
              </Button>
            </>
          )}

          {availabilityStatus === 'unavailable' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-red-600">Algunos productos no están disponibles</DialogTitle>
              </DialogHeader>
              {adminNotes && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1 text-red-800">Nota del asesor:</p>
                  <p className="text-red-700">{adminNotes}</p>
                </div>
              )}
              {suggestedProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Productos sugeridos como alternativa:</p>
                  <div className="space-y-2">
                    {suggestedProducts.map((sp, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium">{sp.name}</p>
                          <p className="text-xs text-primary font-bold">{formatPrice(sp.price)}</p>
                        </div>
                        <a href={`/producto/${sp.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          Ver producto <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Los productos sugeridos NO se agregan automáticamente. Puedes explorarlos y decidir.</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={closeAndReset}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Modificar carrito
                </Button>
                <Button className="flex-1" onClick={() => { closeAndReset(); window.location.href = '/tienda'; }}>
                  Ver tienda
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
