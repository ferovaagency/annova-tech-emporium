import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { reference, transactionId, customerName, items = [], total } = body;

    const recipients = ['administrativo@annovasoft.com', 'Comercial1@annovasoft.com', 'Gerencia@annovasoft.com'];
    const subject = `Nuevo pedido pagado - ${reference}`;

    const rows = (items as Array<{ name: string; quantity: number; price: number }>).map(
      (item) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${item.name} x${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">$${Number(item.price * item.quantity).toLocaleString('es-CO')} COP</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;background:#ffffff;color:#111827;padding:32px;max-width:640px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:28px;font-weight:800;color:#CC0000;">AnnovaSoft</div>
          <div style="font-size:14px;color:#6b7280;">Annova Software y Accesorios SAS</div>
        </div>
        <h1 style="font-size:32px;line-height:1.1;margin:0 0 16px;">Nuevo pedido pagado</h1>
        <p style="margin:0 0 20px;">${customerName ? `Cliente: <strong>${customerName}</strong>. ` : ''}${transactionId ? `Transacción: <strong>${transactionId}</strong>.` : ''}</p>
        <div style="font-size:2rem;font-weight:800;color:#CC0000;background:#f3f4f6;padding:20px;border-radius:16px;text-align:center;margin:0 0 24px;">${reference}</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rows}</table>
        <div style="font-size:24px;font-weight:800;margin:0 0 24px;">Total: <span style="color:#CC0000;">$${Number(total || 0).toLocaleString('es-CO')} COP</span></div>
        <div style="background:#f9fafb;border-radius:16px;padding:20px;margin-bottom:20px;">
          <h2 style="font-size:18px;margin:0 0 12px;">Contacto AnnovaSoft</h2>
          <p style="margin:0 0 8px;">Sergio Muñoz: +57 320 257 9393</p>
          <p style="margin:0 0 8px;">Isabella Garzón: +57 350 750 1878</p>
          <p style="margin:0 0 8px;">AnnovaSoft: +57 305 795 0550</p>
          <p style="margin:0 0 8px;">administrativo@annovasoft.com · Comercial1@annovasoft.com · Gerencia@annovasoft.com</p>
          <p style="margin:0;">Cra 15 # 76-53 Oficina 204 Bogotá</p>
        </div>
        <p style="font-size:13px;color:#6b7280;margin:0;">Annova Software y Accesorios SAS</p>
      </div>`;

    console.log('send-order-confirmation prepared', JSON.stringify({
      reference,
      subject,
      recipients,
      hasEmailDomain: false,
    }));

    return new Response(JSON.stringify({
      queued: false,
      reason: 'email_domain_required',
      recipients,
      subject,
      html,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
