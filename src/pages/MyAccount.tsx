import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Search } from 'lucide-react';
import { formatPrice } from '@/data/products';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderResult {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
  admin_notes?: string | null;
}

export default function MyAccount() {
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<OrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedReference = reference.trim();

    const { data: orderData } = await supabase
      .from('orders')
      .select('id, reference, customer_name, customer_email, items, total, status, created_at')
      .eq('customer_email', normalizedEmail)
      .eq('reference', normalizedReference)
      .maybeSingle();

    if (orderData) {
      setResult(orderData as unknown as OrderResult);
      setLoading(false);
      return;
    }

    const { data: availabilityData } = await supabase
      .from('availability_requests')
      .select('*')
      .eq('customer_email', normalizedEmail)
      .eq('order_id', normalizedReference)
      .maybeSingle();

    if (!availabilityData) {
      setNotFound(true);
    } else {
      setResult({
        id: availabilityData.id,
        reference: availabilityData.order_id,
        customer_name: availabilityData.customer_name,
        customer_email: availabilityData.customer_email,
        items: (availabilityData.items || []) as OrderItem[],
        total: Number(availabilityData.total || 0),
        status: availabilityData.status,
        created_at: availabilityData.created_at,
        admin_notes: availabilityData.admin_notes,
      });
    }

    setLoading(false);
  };

  const statusConfig: Record<string, string> = {
    pending: 'bg-yellow-500 text-white',
    available: 'bg-blue-500 text-white',
    unavailable: 'bg-red-500 text-white',
    paid: 'bg-blue-600 text-white',
    shipped: 'bg-orange-500 text-white',
    delivered: 'bg-green-600 text-white',
    cancelled: 'bg-red-600 text-white',
  };

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    available: 'Disponibilidad confirmada',
    unavailable: 'No disponible',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <main className="py-12">
      <div className="container mx-auto max-w-lg px-4">
        <div className="mb-8 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bebas">Consulta tu <span className="text-primary">Pedido</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingresa tu email y el código de pedido para ver el estado actualizado.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <Input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Código de pedido / referencia" required value={reference} onChange={(e) => setReference(e.target.value)} />
          <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {loading ? 'Buscando...' : 'Buscar pedido'}
          </Button>
        </form>

        {notFound && (
          <div className="rounded-lg bg-muted py-8 text-center">
            <p className="text-muted-foreground">No encontramos un pedido con esos datos. Verifica tu email y tu código de pedido.</p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Ref: {result.reference}</span>
              <Badge className={statusConfig[result.status] || 'bg-muted-foreground text-white'}>
                {statusLabel[result.status] || result.status}
              </Badge>
            </div>
            <p className="mb-1 text-sm font-medium">{result.customer_name}</p>
            <p className="mb-4 text-xs text-muted-foreground">
              {new Date(result.created_at).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <div className="mb-4 space-y-2">
              {(result.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t pt-3 font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(Number(result.total || 0))}</span>
            </div>
            {result.admin_notes && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                <p className="mb-1 font-medium">Nota del asesor:</p>
                <p className="text-muted-foreground">{result.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
