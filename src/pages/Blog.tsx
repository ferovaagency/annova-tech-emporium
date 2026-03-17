import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string | null;
  created_at: string;
  active: boolean;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data } = await (supabase as any)
          .from('blog_posts')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        setPosts((data as BlogPostRow[]) || []);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bebas md:text-5xl">Blog <span className="text-primary">AnnovaSoft</span></h1>
          <p className="mx-auto max-w-lg text-muted-foreground">Artículos sobre tecnología empresarial, licencias, infraestructura y equipos reacondicionados.</p>
        </div>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-16 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bebas">Aún no hay artículos publicados</h2>
            <p className="text-muted-foreground">Cuando publiques los primeros artículos desde el panel, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
                {post.cover_image ? (
                  <div className="overflow-hidden">
                    <img src={post.cover_image} alt={post.title} className="h-48 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-muted text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10" />
                      <span className="text-sm font-medium">Artículo AnnovaSoft</span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    <span>· {post.author || 'AnnovaSoft'}</span>
                  </div>
                  <h2 className="mb-2 text-lg font-bold leading-tight font-montserrat transition-colors group-hover:text-primary">{post.title}</h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt || 'Artículo optimizado sobre tecnología empresarial y decisiones digitales.'}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">Leer más <ArrowRight className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}