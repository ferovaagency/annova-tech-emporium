import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, ExternalLink, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { buildWompiCheckoutUrl, generateOrderReference } from '@/lib/wompi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { GA } from '@/hooks/useAnalytics';

type AvailabilityStatus = 'idle' | 'pending' | 'available' | 'unavailable' | 'timeout';

interface SuggestedProduct {
  name: string;
  slug: string;
  price: number;
}

const TIMER_SECONDS = 180; // 3 minutes

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { toast } = useToast();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');

  // Availability modal
  const [modalOpen, setModalOpen] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [adminNotes, setAdminNotes] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  useEffect(() => {
    GA.beginCheckout(totalPrice);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Autocomplete from customers table
  const handleEmailBlur = async () => {
    if (!email) return;
    try {
      const { data } = await supabase
        .from('customers')
        .select('name, phone, city')
        .eq('email', email)
        .single();
      if (data) {
        if (data.name && !fullName) setFullName(data.name);
        if (data.phone && !phone) setPhone(data.phone);
        if (data.city && !city) setCity(data.city);
        toast({ title: 'Encontramos tus datos guardados. Puedes editarlos si necesitas.' });
      }
    } catch { /* no previous customer data */ }
  };

  const startTimer = () => {
    setTimeLeft(TIMER_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setAvailabilityStatus(s => s === 'pending' ? 'timeout' : s);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
        setSuggestedProducts((data.suggested_products as unknown as SuggestedProduct[]) || []);
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 5000);
  };

  const createRequest = async () => {
    const ref = generateOrderReference();
    setOrderRef(ref);
    setModalOpen(true);
    setAvailabilityStatus('pending');
    startTimer();

    await supabase.from('customers').upsert({
      email,
      name: fullName,
      phone,
      city,
      last_order_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    await supabase.functions.invoke('send-notification', {
      body: { type: 'new_customer', payload: { email, name: fullName, phone, city } },
    });

    const { data, error } = await supabase.from('availability_requests').insert({
      order_id: ref,
      customer_name: fullName,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequest();
  };

  const handleProceedToPayment = async () => {
    GA.purchase(orderRef, totalPrice);
    GA.availabilityTimer('available');

    await supabase.from('orders').upsert({
      reference: orderRef,
      customer_name: fullName,
      customer_email: email,
      customer_phone: phone || null,
      total: totalPrice,
      items: items.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        quantity,
        price: product.price,
        slug: product.slug,
      })),
      shipping_address: {
        address,
        city,
        department,
        companyName,
        nit,
      },
      status: 'pending',
      status_history: [
        {
          status: 'pending',
          at: new Date().toISOString(),
          source: 'checkout',
        },
      ],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'reference' });

    const url = await buildWompiCheckoutUrl({
      reference: orderRef,
      amountInCents: totalPrice * 100,
      customerEmail: email,
      customerFullName: fullName,
      customerPhoneNumber: phone,
    });
    clearCart();
    window.location.href = url;
  };

  const handleRetry = async () => {
    setAvailabilityStatus('idle');
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    await createRequest();
  };

  const closeAndReset = () => {
    setModalOpen(false);
    setAvailabilityStatus('idle');
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

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
                <h2 className="text-xl font-bebas mb-4">Datos del Contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Nombre completo *" required value={fullName} onChange={e => setFullName(e.target.value)} />
                  <Input placeholder="Email *" type="email" required value={email} onChange={e => setEmail(e.target.value)} onBlur={handleEmailBlur} />
                  <Input placeholder="Teléfono *" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input placeholder="Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  <Input placeholder="NIT" value={nit} onChange={e => setNit(e.target.value)} />
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-bebas mb-4">Dirección de Entrega</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Dirección *" required className="md:col-span-2" value={address} onChange={e => setAddress(e.target.value)} />
                  <Input placeholder="Ciudad *" required value={city} onChange={e => setCity(e.target.value)} />
                  <Input placeholder="Departamento *" required value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90 text-lg py-3 h-auto">
                Confirmar pedido
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
            {orderRef && (
              <p className="text-xs text-muted-foreground mt-2">Ref: {orderRef}</p>
            )}
          </div>
        </div>
      </div>

      {/* Availability confirmation modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        if (!open && availabilityStatus === 'pending') return;
        if (!open) closeAndReset();
      }}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => {
          if (availabilityStatus === 'pending') e.preventDefault();
        }}>
          {availabilityStatus === 'pending' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Verificando disponibilidad de tu pedido</DialogTitle>
                <DialogDescription>Un asesor está revisando tu pedido ahora mismo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold font-mono">{formatTimer(timeLeft)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span>{product.name} x{quantity}</span>
                      <span className="font-medium">{formatPrice(product.price * quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Esperando confirmación del asesor...</span>
                </div>
              </div>
            </>
          )}

          {availabilityStatus === 'available' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" /> ¡Tu pedido está confirmado!
                </DialogTitle>
                <DialogDescription>Procede al pago seguro con Wompi</DialogDescription>
              </DialogHeader>
              {adminNotes && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Nota del asesor:</p>
                  <p className="text-muted-foreground">{adminNotes}</p>
                </div>
              )}
              <Button onClick={handleProceedToPayment} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 h-auto">
                Pagar ahora con Wompi
              </Button>
            </>
          )}

          {availabilityStatus === 'unavailable' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-red-600 flex items-center gap-2">
                  <XCircle className="w-6 h-6" /> Algunos productos no están disponibles
                </DialogTitle>
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
                  <p className="text-xs text-muted-foreground mt-2">Estos productos son sugerencias. No se agregan automáticamente a tu carrito.</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={closeAndReset}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Modificar mi pedido
                </Button>
                <Button className="flex-1" onClick={() => { closeAndReset(); window.location.href = '/tienda'; }}>
                  Explorar tienda
                </Button>
              </div>
            </>
          )}

          {availabilityStatus === 'timeout' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" /> El tiempo de verificación venció
                </DialogTitle>
                <DialogDescription>
                  Puedes esperar a que un asesor te contacte o intentarlo de nuevo más tarde.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleRetry}>
                  Intentar de nuevo
                </Button>
                <Button className="flex-1" onClick={() => { closeAndReset(); window.location.href = '/tienda'; }}>
                  Ir a la tienda
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
