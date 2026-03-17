import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, FileText, Loader2 } from 'lucide-react';
import { blogPosts as localBlogPosts } from '@/data/products';
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

        if (data?.length) {
          setPosts(data as BlogPostRow[]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const fallbackPosts = localBlogPosts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover_image: post.image,
    author: post.author,
    created_at: post.date,
    active: true,
  }));

  const visiblePosts = posts.length > 0 ? posts : fallbackPosts;

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl md:text-5xl font-bebas">Blog <span className="text-primary">AnnovaSoft</span></h1>
          <p className="mx-auto max-w-lg text-muted-foreground">Artículos sobre tecnología empresarial, licencias, infraestructura y equipos reacondicionados.</p>
        </div>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
                {post.cover_image ? (
                  <div className="overflow-hidden">
                    <img src={post.cover_image} alt={post.title} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
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
                  <h2 className="mb-2 text-lg font-bold leading-tight transition-colors group-hover:text-primary font-montserrat">{post.title}</h2>
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
