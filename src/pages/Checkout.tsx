import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, ShoppingCart, CheckCircle2, Clock3 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateOrderReference } from '@/lib/wompi';
import { getCartWhatsAppUrl } from '@/lib/whatsapp-context';
import { GA } from '@/hooks/useAnalytics';

export default function Checkout() {
  const { items, totalPrice, totalItems } = useCart();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReference, setRequestReference] = useState('');

  useEffect(() => {
    GA.beginCheckout(totalPrice);
  }, [totalPrice]);

  const whatsappUrl = useMemo(() => getCartWhatsAppUrl(
    items.map(({ product, quantity }) => ({ name: product.name, quantity, price: product.price })),
    totalPrice,
    email,
  ), [items, totalPrice, email]);

  const handleEmailBlur = async () => {
    if (!email) return;
    try {
      const { data } = await supabase
        .from('customers')
        .select('name, phone')
        .eq('email', email)
        .single();

      if (data) {
        if (data.name && !fullName) setFullName(data.name);
        if (data.phone && !phone) setPhone(data.phone);
        toast({ title: 'Encontramos tus datos guardados. Puedes editarlos si necesitas.' });
      }
    } catch {
      // ignore
    }
  };

  const openOptions = (event: React.FormEvent) => {
    event.preventDefault();
    setModalOpen(true);
  };

  const handleWaitForConfirmation = async () => {
    if (!fullName || !email || !phone) {
      return toast({ title: 'Nombre, email y teléfono son requeridos', variant: 'destructive' });
    }

    setSaving(true);
    try {
      const reference = generateOrderReference();

      await supabase.from('customers').upsert({
        email,
        name: fullName,
        phone,
        last_order_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      const { error } = await supabase.from('availability_requests').insert({
        order_id: reference,
        customer_name: fullName,
        customer_phone: phone,
        customer_email: email,
        items: items.map(({ product, quantity }) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          quantity,
          price: product.price,
        })),
        total: totalPrice,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'new_customer',
          payload: {
            name: fullName,
            email,
            phone,
            city: 'Pendiente de validación',
            source: 'availability_request',
            orderReference: reference,
          },
        },
      });

      setRequestReference(reference);
      setRequestSent(true);
      setModalOpen(false);
      toast({ title: 'Solicitud enviada', description: 'Te confirmaremos disponibilidad en máximo 48 horas.' });
    } catch (error: any) {
      toast({ title: 'No se pudo registrar la solicitud', description: error?.message || 'Intenta nuevamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bebas">No hay productos en tu carrito</h1>
        <a href="/tienda" className="text-primary hover:underline">Ir a la tienda</a>
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bebas">Solicitar <span className="text-primary">Disponibilidad</span></h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={openOptions} className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-bebas">Datos de contacto</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input placeholder="Nombre completo *" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  <Input placeholder="Email *" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} onBlur={handleEmailBlur} />
                  <Input placeholder="Teléfono *" type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} className="md:col-span-2" />
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Confirmación en máximo 48 horas</h2>
                    <p className="mt-1 text-sm text-muted-foreground">No se realiza pago en línea. Primero validamos disponibilidad y luego te contactamos por el canal que elijas.</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full text-lg py-3 h-auto">
                Solicitar disponibilidad
              </Button>
            </form>

            {requestSent && (
              <div className="mt-6 rounded-lg border bg-card p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">Solicitud recibida</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Nuestro equipo te confirmará disponibilidad en máximo 48 horas.</p>
                    <p className="mt-3 text-xs text-muted-foreground">Referencia: {requestReference}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky top-40 h-fit rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bebas">Resumen ({totalItems})</h2>
            <div className="mb-4 space-y-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">Sin imagen</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">x{quantity}</p>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(product.price * quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Elige cómo continuar</DialogTitle>
            <DialogDescription>Podemos atenderte por WhatsApp de inmediato o registrar tu solicitud para confirmarte disponibilidad en máximo 48 horas.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button type="button" className="w-full justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Hablar con un asesor
              </Button>
            </a>
            <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={handleWaitForConfirmation} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              Esperar confirmación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
