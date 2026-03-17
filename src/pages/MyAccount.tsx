import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import { formatPrice } from '@/data/products';

interface OrderResult {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
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

    const { data, error } = await supabase
      .from('availability_requests')
      .select('*')
      .eq('customer_email', email)
      .eq('order_id', reference)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setResult(data as unknown as OrderResult);
    }
    setLoading(false);
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-500' },
    available: { label: 'Disponibilidad confirmada', color: 'bg-blue-500' },
    unavailable: { label: 'No disponible', color: 'bg-red-500' },
  };

  return (
    <main className="py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <Package className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bebas">Consulta tu <span className="text-primary">Pedido</span></h1>
          <p className="text-muted-foreground text-sm mt-2">Ingresa tu email y número de referencia para ver el estado de tu pedido.</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 mb-8">
          <Input placeholder="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Número de pedido (referencia)" required value={reference} onChange={e => setReference(e.target.value)} />
          <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
            <Search className="w-4 h-4 mr-2" /> Buscar pedido
          </Button>
        </form>

        {notFound && (
          <div className="text-center py-8 bg-muted rounded-lg">
            <p className="text-muted-foreground">No encontramos un pedido con esos datos. Verifica tu email y número de pedido.</p>
          </div>
        )}

        {result && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground">Ref: {result.order_id}</span>
              <Badge className={`${statusConfig[result.status]?.color || 'bg-gray-500'} text-white`}>
                {statusConfig[result.status]?.label || result.status}
              </Badge>
            </div>
            <p className="font-medium text-sm mb-1">{result.customer_name}</p>
            <p className="text-xs text-muted-foreground mb-4">{new Date(result.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <div className="space-y-2 mb-4">
              {(result.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(result.total)}</span>
            </div>
            {result.admin_notes && (
              <div className="mt-4 bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Nota del asesor:</p>
                <p className="text-muted-foreground">{result.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
