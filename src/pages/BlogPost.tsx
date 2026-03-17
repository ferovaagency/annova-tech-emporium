import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  author: string | null;
  created_at: string;
  active: boolean;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const { data } = await (supabase as any)
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('active', true)
          .maybeSingle();

        setPost((data as BlogPostRow | null) || null);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  if (loading) {
    return <main className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></main>;
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-3xl font-bebas">Artículo no encontrado</h1>
        <Link to="/blog" className="mt-4 inline-block text-primary hover:underline">Volver al blog</Link>
      </div>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-secondary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver al blog
        </Link>

        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="mb-6 h-64 w-full rounded-xl object-cover object-center md:h-80" />
        ) : (
          <div className="mb-6 flex h-64 w-full items-center justify-center rounded-xl bg-muted text-muted-foreground md:h-80">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-10 w-10" />
              <span className="text-sm font-medium">Blog AnnovaSoft</span>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(post.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          <span>· {post.author || 'AnnovaSoft'}</span>
        </div>
        <h1 className="mb-6 text-3xl font-bebas md:text-4xl">{post.title}</h1>
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content || `<p>${post.excerpt || ''}</p>` }} />
      </div>
    </main>
  );
}