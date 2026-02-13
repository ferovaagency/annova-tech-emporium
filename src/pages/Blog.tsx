import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { blogPosts } from '@/data/products';

export default function Blog() {
  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bebas mb-2">Blog <span className="text-primary">Annova</span></h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Artículos sobre tecnología empresarial, licencias, infraestructura y equipos reacondicionados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  <span>· {post.author}</span>
                </div>
                <h2 className="font-montserrat font-bold text-lg mb-2 group-hover:text-primary transition-colors leading-tight">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-sm text-secondary font-semibold mt-3">Leer más <ArrowRight className="w-3 h-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
