import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, brand, category, specs, shortDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const specsText = specs ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join("\n") : "";

    const systemPrompt = `Eres un redactor experto de fichas de producto para Annova Tech, una empresa colombiana de tecnología empresarial. 
Generas HTML profesional para fichas de producto siguiendo la guía editorial de Ferova Agency.
Siempre escribes en español colombiano profesional. No uses markdown, solo HTML puro.
Responde SOLO con un JSON con tres campos: "description" (HTML), "meta_title" (máx 60 chars), "meta_description" (exactamente 155 chars).`;

    const userPrompt = `Genera la ficha de producto completa para:

Producto: ${productName}
Marca: ${brand || "Sin marca"}
Categoría: ${category || "General"}
Descripción corta: ${shortDescription || ""}
Especificaciones:
${specsText}

La estructura HTML debe ser EXACTAMENTE esta:

<p><strong>[AFIRMACIÓN INICIAL: Sujeto + Verbo + Predicado técnico sobre el producto, 1 oración contundente]</strong></p>
<p>[Párrafo introductorio: qué es, para qué sirve, qué gana el comprador. 3-5 oraciones. Incluir keyword natural. Tono conversado pero profesional.]</p>

<h2>¿Para quién es este producto?</h2>
<ul>
<li><strong>[Perfil 1 de empresa colombiana]</strong>: [Caso de uso específico con detalle real]</li>
<li><strong>[Perfil 2]</strong>: [Caso de uso]</li>
<li><strong>[Perfil 3]</strong>: [Caso de uso]</li>
</ul>

<h2>Especificaciones Técnicas de ${productName}</h2>
<table><thead><tr><th>Especificación</th><th>Valor</th><th>¿Qué significa para ti?</th></tr></thead><tbody>[filas con datos reales del producto]</tbody></table>

<h2>Beneficios Reales de ${productName}</h2>
<ul>[Lista de beneficios como ganancias concretas del comprador, NO features. Mín 4 beneficios.]</ul>

<h2>Sobre ${brand || "la marca"}</h2>
<p>[Historia, posicionamiento, certificaciones, garantía oficial, presencia en Colombia. 3-5 oraciones.]</p>

<h2>¿Por qué comprarlo en Annova Tech?</h2>
<ul>[Argumentos concretos: garantía Annova Tech, soporte técnico pre y post venta, autenticidad verificable, velocidad de entrega en Colombia.]</ul>

<h2>Lo que dicen nuestros clientes</h2>
<blockquote>[Testimonio verosímil: nombre colombiano con inicial de apellido, cargo, ciudad, beneficio específico. — Nombre · Cargo · Ciudad, Colombia]</blockquote>

<h2>Preguntas Frecuentes sobre ${productName}</h2>
<details><summary>¿[Pregunta de compatibilidad técnica]?</summary><p>[Respuesta directa 2-3 oraciones]</p></details>
<details><summary>¿Qué garantía tiene en Annova Tech?</summary><p>[Respuesta con detalles]</p></details>
<details><summary>¿[Pregunta de uso específico para empresa colombiana]?</summary><p>[Respuesta]</p></details>
<details><summary>¿Hacen envíos a todo Colombia?</summary><p>[Respuesta con tiempos reales]</p></details>
<details><summary>¿[Pregunta de pago o financiamiento]?</summary><p>[Respuesta mencionando Wompi, PSE, Nequi]</p></details>

<h2>Tu decisión inteligente en tecnología empresarial</h2>
<p>[Cierre: resumen del argumento principal + diferencial Annova Tech + CTA sutil]</p>

meta_title: máx 60 chars, formato: "[keyword principal] | Annova Tech"
meta_description: exactamente 155 chars, propuesta de valor + keyword + CTA implícita tipo "Disponible en todo Colombia"

Responde SOLO con JSON válido: {"description": "...", "meta_title": "...", "meta_description": "..."}`;

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
    
    // Try to parse the JSON from the AI response
    let parsed;
    try {
      // Remove markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { description: content, meta_title: `${productName} | Annova Tech`, meta_description: `${productName} disponible en Annova Tech. Envío a todo Colombia.` };
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
