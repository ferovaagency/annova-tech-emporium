import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "product-images";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "asset";
}

function extensionFromContentType(contentType: string | null, fallbackUrl = "") {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("svg")) return "svg";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";

  const match = fallbackUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() || "jpg";
}

function splitTitleLines(title: string) {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 24 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function buildCoverSvg(title: string, excerpt: string, category: string) {
  const safeTitle = title.replace(/[<&>]/g, "");
  const safeExcerpt = excerpt.replace(/[<&>]/g, "");
  const safeCategory = category.replace(/[<&>]/g, "");
  const lines = splitTitleLines(safeTitle);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1600" y2="900" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1A1D24" />
        <stop offset="0.55" stop-color="#4A0A0A" />
        <stop offset="1" stop-color="#CC0000" />
      </linearGradient>
      <linearGradient id="glass" x1="220" y1="150" x2="1380" y2="770" gradientUnits="userSpaceOnUse">
        <stop stop-color="rgba(255,255,255,0.18)" />
        <stop offset="1" stop-color="rgba(255,255,255,0.06)" />
      </linearGradient>
    </defs>
    <rect width="1600" height="900" rx="0" fill="url(#bg)"/>
    <circle cx="1320" cy="140" r="220" fill="rgba(255,255,255,0.08)"/>
    <circle cx="210" cy="760" r="280" fill="rgba(255,255,255,0.06)"/>
    <rect x="140" y="110" width="1320" height="680" rx="34" fill="rgba(10,10,12,0.24)" stroke="rgba(255,255,255,0.18)"/>
    <rect x="200" y="170" width="180" height="44" rx="22" fill="rgba(255,255,255,0.14)"/>
    <text x="290" y="199" text-anchor="middle" fill="#FFFFFF" font-size="22" font-family="Arial, sans-serif" font-weight="700" letter-spacing="2">ANNOVASOFT BLOG</text>
    <text x="200" y="275" fill="#FFD7D7" font-size="28" font-family="Arial, sans-serif" font-weight="700">${safeCategory || "Tecnología empresarial"}</text>
    ${lines.map((line, index) => `<text x="200" y="${360 + index * 78}" fill="#FFFFFF" font-size="64" font-family="Arial, sans-serif" font-weight="800">${line}</text>`).join("")}
    <text x="200" y="690" fill="#FFE8E8" font-size="28" font-family="Arial, sans-serif" font-weight="400">${safeExcerpt.slice(0, 160)}</text>
    <text x="200" y="760" fill="#FFFFFF" font-size="24" font-family="Arial, sans-serif" font-weight="700">Soluciones tecnológicas para empresas en Colombia</text>
  </svg>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing backend configuration for media tools");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { action, url, title, excerpt, category } = await req.json();

    if (action === "download_remote_image") {
      if (!url || typeof url !== "string") {
        return new Response(JSON.stringify({ error: "Image URL is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; AnnovaSoftBot/1.0)",
        },
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `No se pudo descargar la imagen (${response.status})` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.startsWith("image/")) {
        return new Response(JSON.stringify({ error: "La URL no devolvió una imagen válida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const ext = extensionFromContentType(contentType, url);
      const fileName = `products/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, bytes, {
        contentType,
        upsert: false,
      });

      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      return new Response(JSON.stringify({ publicUrl: data.publicUrl, path: fileName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_blog_cover") {
      const safeTitle = typeof title === "string" ? title : "Blog AnnovaSoft";
      const safeExcerpt = typeof excerpt === "string" ? excerpt : "";
      const safeCategory = typeof category === "string" ? category : "Tecnología empresarial";
      const svg = buildCoverSvg(safeTitle, safeExcerpt, safeCategory);
      const fileName = `blog/${Date.now()}-${slugify(safeTitle)}.svg`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, new TextEncoder().encode(svg), {
        contentType: "image/svg+xml",
        upsert: false,
      });

      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      return new Response(JSON.stringify({ publicUrl: data.publicUrl, path: fileName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("media-tools error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});