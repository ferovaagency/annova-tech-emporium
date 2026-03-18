import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

const DISABLED_ACTIONS = new Set([
  "download_remote_image",
  "sync_category_image",
  "generate_blog_cover",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: Record<string, unknown> = {};

    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    const action = typeof payload.action === "string" ? payload.action : "";

    if (!action) {
      return new Response(JSON.stringify({ ok: false, error: "Action is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (DISABLED_ACTIONS.has(action)) {
      return new Response(JSON.stringify({
        ok: true,
        disabled: true,
        action,
        error: "La automatización de imágenes está desactivada en media-tools",
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Unsupported action" }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("media-tools error:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
