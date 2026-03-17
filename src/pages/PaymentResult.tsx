import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getTransactionByReference } from '@/lib/wompi';
import { formatPrice } from '@/data/products';

interface OrderRow {
  customer_email: string;
  customer_name: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  status_history: Array<{ status: string; at: string; source?: string; transaction_id?: string | null }>;
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
        .select('customer_email, customer_name, items, total, status, status_history')
        .eq('reference', reference)
        .maybeSingle();

      if (!active) return;

      const orderData = data as unknown as OrderRow | null;
      setStatus(nextStatus);
      setTransactionId(nextTransactionId);
      if (orderData) setOrder(orderData);

      if (nextStatus === 'APPROVED' && orderData) {
        const nextHistory = Array.isArray(orderData.status_history)
          ? [...orderData.status_history]
          : [];

        const alreadyPaid = nextHistory.some(
          (entry) => entry.status === 'paid' && entry.transaction_id === (nextTransactionId || null)
        );

        if (!alreadyPaid || orderData.status !== 'paid') {
          const paymentEntry = {
            status: 'paid',
            at: new Date().toISOString(),
            source: 'payment_result',
            transaction_id: nextTransactionId || null,
          };

          const updatedHistory = [...nextHistory, paymentEntry];

          await supabase
            .from('orders')
            .update({
              status: 'paid',
              updated_at: new Date().toISOString(),
              status_history: updatedHistory,
            })
            .eq('reference', reference);

          setOrder({ ...orderData, status: 'paid', status_history: updatedHistory });

          await supabase.functions.invoke('send-order-confirmation', {
            body: {
              reference,
              transactionId: nextTransactionId,
              customerName: orderData.customer_name,
              items: orderData.items,
              total: orderData.total,
            },
          });
        }
      }

      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [reference]);

  const title = useMemo(() => {
    if (status === 'APPROVED') return '¡Pago exitoso! Tu pedido está confirmado';
    if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') return 'Tu pago no fue aprobado';
    return 'Estamos validando tu pago';
  }, [status]);

  return (
    <main className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          {loading ? (
            <Loader2 className="mx-auto mb-6 h-10 w-10 animate-spin text-primary" />
          ) : status === 'APPROVED' ? (
            <>
              <CheckCircle2 className="mx-auto mb-6 h-24 w-24" style={{ color: 'hsl(142 71% 45%)' }} />
              <h1 className="mb-4 text-3xl font-bebas md:text-4xl">{title}</h1>
              {transactionId && <p className="mb-4 text-sm text-muted-foreground">Transacción: {transactionId}</p>}

              {reference && (
                <div className="mb-4 rounded-2xl border bg-muted px-6 py-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Código de pedido</p>
                  <div className="text-center text-3xl font-bold" style={{ color: 'hsl(0 100% 40%)' }}>
                    {reference}
                  </div>
                </div>
              )}

              <div
                className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-left"
                style={{ backgroundColor: 'hsl(48 100% 92%)', borderColor: 'hsl(45 93% 47%)' }}
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: 'hsl(38 92% 50%)' }} />
                <p className="text-sm font-medium text-foreground">
                  Guarda este código — lo necesitas para consultar tu pedido en “Mi Cuenta”.
                </p>
              </div>

              <p className="mb-6 text-base text-muted-foreground">
                Un asesor verificará tu pedido y recibirás atención personalizada.
              </p>

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
                <Link to="/" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Ir al inicio
                </Link>
                <Link to="/mi-cuenta" className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                  Ver mis pedidos
                </Link>
              </div>
            </>
          ) : (
            <>
              <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
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
                <Link to="/" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Ir al inicio
                </Link>
                <Link to="/mi-cuenta" className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                  Ver mis pedidos
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
