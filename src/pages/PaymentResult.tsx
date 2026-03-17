import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getTransactionByReference } from '@/lib/wompi';
import { formatPrice } from '@/data/products';

interface OrderRow {
  customer_email: string;
  customer_name: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export default function PaymentResult() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || '';
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('PENDING');
  const [transactionId, setTransactionId] = useState<string>('');
  const [order, setOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!reference) {
        setStatus('ERROR');
        setLoading(false);
        return;
      }

      const tx = await getTransactionByReference(reference);
      const nextStatus = String(tx?.status || 'PENDING').toUpperCase();
      const nextTransactionId = tx?.id ? String(tx.id) : '';

      const { data } = await supabase
        .from('orders')
        .select('customer_email, customer_name, items, total')
        .eq('reference', reference)
        .maybeSingle();

      if (!active) return;

      setStatus(nextStatus);
      setTransactionId(nextTransactionId);
      if (data) setOrder(data as unknown as OrderRow);

      if (nextStatus === 'APPROVED') {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
            status_history: [
              {
                status: 'paid',
                at: new Date().toISOString(),
                source: 'payment_result',
                transaction_id: nextTransactionId || null,
              },
            ],
          })
          .eq('reference', reference);

        if (data) {
          await supabase.functions.invoke('send-order-confirmation', {
            body: {
              reference,
              transactionId: nextTransactionId,
              customerEmail: data.customer_email,
              customerName: data.customer_name,
              items: data.items,
              total: data.total,
            },
          });
        }
      }

      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [reference]);

  const title = useMemo(() => {
    if (status === 'APPROVED') return '¡Tu pago fue exitoso!';
    if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') return 'Tu pago no fue aprobado';
    return 'Estamos validando tu pago';
  }, [status]);

  return (
    <main className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          {loading ? (
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          ) : status === 'APPROVED' ? (
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
          ) : (
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          )}

          <h1 className="mb-3 text-3xl font-bebas">{title}</h1>
          {reference && <p className="mb-2 text-sm text-muted-foreground">Referencia: {reference}</p>}
          {transactionId && <p className="mb-6 text-sm text-muted-foreground">Transacción: {transactionId}</p>}

          {order && (
            <div className="mb-6 rounded-xl bg-muted/50 p-4 text-left">
              <p className="mb-2 text-sm font-semibold">Resumen del pedido</p>
              <div className="space-y-2 text-sm">
                {order.items?.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(Number(order.total || 0))}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/tienda" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Volver a la tienda
            </Link>
            <Link to="/mi-cuenta" className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              Ver mi cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
