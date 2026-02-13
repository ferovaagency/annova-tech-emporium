import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { blogPosts } from '@/data/products';

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bebas">Artículo no encontrado</h1>
      <Link to="/blog" className="text-primary hover:underline mt-4 inline-block">Volver al blog</Link>
    </div>
  );

  return (
    <main className="py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-secondary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al blog
        </Link>
        <img src={post.image} alt={post.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-6" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="w-4 h-4" />
          {new Date(post.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          <span>· {post.author}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bebas mb-6">{post.title}</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
          {post.content}
        </div>
      </div>
    </main>
  );
}
