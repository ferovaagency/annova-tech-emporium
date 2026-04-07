import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://annovasoft.com";

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/tienda", priority: "1.0", changefreq: "daily" },
  { loc: "/blog", priority: "1.0", changefreq: "daily" },
  { loc: "/contacto", priority: "1.0", changefreq: "daily" },
  { loc: "/nosotros", priority: "0.8", changefreq: "monthly" },
  { loc: "/tienda?categoria=computadores", priority: "0.9", changefreq: "daily" },
  { loc: "/tienda?categoria=licenciamiento", priority: "0.9", changefreq: "daily" },
  { loc: "/tienda?categoria=servidores", priority: "0.9", changefreq: "daily" },
  { loc: "/tienda?categoria=workstations", priority: "0.9", changefreq: "daily" },
  { loc: "/tienda?categoria=partes-para-servidores", priority: "0.8", changefreq: "daily" },
];

function toISODate(d: string | null): string {
  if (!d) return new Date().toISOString().split("T")[0];
  return new Date(d).toISOString().split("T")[0];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [productsRes, postsRes] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("active", true)
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
    ]);

    const products = productsRes.data ?? [];
    const posts = postsRes.data ?? [];
    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products
    for (const p of products) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/producto/${escapeXml(p.slug)}</loc>\n`;
      xml += `    <lastmod>${toISODate(p.updated_at)}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Blog posts
    for (const b of posts) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/blog/${escapeXml(b.slug)}</loc>\n`;
      xml += `    <lastmod>${toISODate(b.updated_at)}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url></urlset>`,
      {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      }
    );
  }
});
