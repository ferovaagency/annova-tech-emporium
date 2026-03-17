import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, price, condition, warranty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Eres un redactor experto de fichas de producto para AnnovaSoft (Annova Software y Accesorios SAS), una empresa colombiana de tecnología empresarial.
Generas contenido completo para fichas de producto. Siempre escribes en español colombiano profesional.
Responde SOLO con un JSON válido con estos campos exactos:
- "description": string (HTML estructurado de la descripción larga)
- "short_description": string (máx 160 chars, optimizada para SEO)
- "meta_title": string (máx 60 chars, formato "keyword | AnnovaSoft")
- "meta_description": string (150-160 chars, propuesta de valor + keyword + CTA implícita)
- "category": string (categoría más apropiada del producto)
- "brand": string (marca detectada del nombre del producto)
- "specs": object (especificaciones técnicas clave-valor)
- "reviews": array de 3 objetos con { "author": "nombre colombiano", "role": "cargo · ciudad, Colombia", "text": "testimonio específico máx 4 oraciones", "rating": 5 }`;

    const userPrompt = `Genera la ficha completa para:
Producto: ${productName}
Precio: ${price ? `$${Number(price).toLocaleString('es-CO')} COP` : 'No especificado'}
Estado: ${condition || 'Nuevo'}
Garantía: ${warranty || '12 meses con fabricante'}

La descripción HTML debe tener esta estructura EXACTA:

<p><strong>[Afirmación inicial contundente: Sujeto + Verbo + Predicado técnico. 1 oración.]</strong></p>
<p>[Párrafo intro: qué es, para qué sirve, qué gana el comprador. 3-5 oraciones. Keyword natural.]</p>

<h2>¿Para quién es este producto?</h2>
<h3>[Perfil 1 empresa colombiana]</h3>
<h4>[Caso de uso específico]</h4>
<h3>[Perfil 2]</h3>
<h4>[Caso de uso]</h4>
<h3>[Perfil 3]</h3>
<h4>[Caso de uso]</h4>

<h2>Especificaciones Técnicas</h2>
<table><thead><tr><th>Especificación</th><th>Valor</th><th>¿Qué significa para ti?</th></tr></thead><tbody>[filas con specs reales]</tbody></table>

<h2>Beneficios Reales</h2>
<ul>[mín 4 beneficios como ganancias concretas del comprador, NO features]</ul>

<h2>Sobre [MARCA]</h2>
<p>[Historia, posicionamiento, certificaciones, presencia en Colombia. 3-5 oraciones.]</p>

<h2>¿Por qué comprarlo en AnnovaSoft?</h2>
<ul>
<li>Garantía: ${warranty || '12 meses con fabricante'}</li>
<li>Soporte técnico pre y post venta sin costo adicional</li>
<li>Autenticidad verificable con factura de importación</li>
<li>Entrega a todo Colombia en 1-5 días hábiles</li>
<li>Pago seguro con Wompi: tarjeta, PSE o Nequi</li>
</ul>

<h2>Preguntas Frecuentes</h2>
<h3>¿[Pregunta de compatibilidad técnica]?</h3><p>[Respuesta 2-3 oraciones]</p>
<h3>¿Qué garantía tiene este producto en AnnovaSoft?</h3><p>[Respuesta con ${warranty}]</p>
<h3>¿[Pregunta de uso empresarial Colombia]?</h3><p>[Respuesta]</p>
<h3>¿Hacen envíos a todo Colombia?</h3><p>[Respuesta con tiempos]</p>
<h3>¿Qué medios de pago aceptan?</h3><p>[Respuesta: Wompi, PSE, Nequi, tarjeta]</p>

<h2>Tu decisión inteligente en tecnología</h2>
<p>[Cierre: resumen + diferencial AnnovaSoft + CTA sutil]</p>

Las 3 reseñas deben ser de nombres colombianos verosímiles con cargos reales (Gerente TI, Coordinadora de Compras, etc.) y ciudades colombianas reales.

Responde SOLO con JSON válido.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        description: content,
        short_description: `${productName} disponible en AnnovaSoft con envío a todo Colombia.`,
        meta_title: `${productName} | AnnovaSoft`.slice(0, 60),
        meta_description: `${productName} disponible en AnnovaSoft. Envío a todo Colombia. Pago seguro con Wompi.`,
        category: "General",
        brand: "",
        specs: {},
        reviews: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
