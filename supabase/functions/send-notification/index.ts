import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { type, payload } = await req.json();

    const recipients = ['administrativo@annovasoft.com', 'Comercial1@annovasoft.com', 'gerencia@annovasoft.com'];

    const subject = type === 'new_customer'
      ? `Nuevo cliente - ${payload?.name || 'sin nombre'}`
      : `Nueva cotización - ${payload?.name || 'sin nombre'}`;

    const html = type === 'new_customer'
      ? `
        <div style="font-family:Arial,sans-serif;background:#ffffff;color:#111827;padding:24px;max-width:640px;margin:0 auto;">
          <h1 style="color:#CC0000;margin:0 0 16px;">Nuevo cliente registrado</h1>
          <p><strong>Nombre:</strong> ${payload?.name || '-'}</p>
          <p><strong>Email:</strong> ${payload?.email || '-'}</p>
          <p><strong>Teléfono:</strong> ${payload?.phone || '-'}</p>
          <p><strong>Ciudad:</strong> ${payload?.city || '-'}</p>
        </div>`
      : `
        <div style="font-family:Arial,sans-serif;background:#ffffff;color:#111827;padding:24px;max-width:640px;margin:0 auto;">
          <h1 style="color:#CC0000;margin:0 0 16px;">Nueva cotización</h1>
          <p><strong>Nombre:</strong> ${payload?.name || '-'}</p>
          <p><strong>Email:</strong> ${payload?.email || '-'}</p>
          <p><strong>Teléfono:</strong> ${payload?.phone || '-'}</p>
          <p><strong>Empresa:</strong> ${payload?.company || '-'}</p>
          <p><strong>Mensaje:</strong> ${payload?.message || '-'}</p>
          <p><strong>Productos:</strong> ${payload?.products ? JSON.stringify(payload.products) : '-'}</p>
          <p><strong>Origen:</strong> ${payload?.source || '-'}</p>
        </div>`;

    console.log('send-notification payload', JSON.stringify({ type, payload, recipients, subject, hasEmailDomain: false }));

    return new Response(JSON.stringify({ queued: false, reason: 'email_domain_required', recipients, subject, html }), {
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
