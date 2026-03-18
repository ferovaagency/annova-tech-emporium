import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { useActiveCategories } from '@/hooks/useActiveCategories';
import { getAdvisorWhatsAppUrl } from '@/lib/whatsapp-context';

const asesores = [
  { name: 'Sergio Muñoz', phoneLabel: '+57 320 257 9393' },
  { name: 'Isabella Garzón', phoneLabel: '+57 350 750 1878' },
  { name: 'AnnovaSoft Unilago', phoneLabel: '+57 305 795 0550' },
];

export default function Footer() {
  const { categories } = useActiveCategories();

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-4 text-sm opacity-80">Annova Software y Accesorios SAS, soluciones tecnológicas empresariales en Colombia.</p>
            <div className="space-y-2 text-sm opacity-80">
              {asesores.map((asesor) => (
                <a
                  key={asesor.name}
                  href={getAdvisorWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" /> {asesor.name}: {asesor.phoneLabel}
                </a>
              ))}
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> administrativo@annovasoft.com</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> Comercial1@annovasoft.com</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> Gerencia@annovasoft.com</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Cra 15 # 76-53 Oficina 204, Bogotá, Colombia</p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bebas text-xl">Categorías</h4>
            <ul className="space-y-2 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/tienda?categoria=${cat.slug}`} className="opacity-80 transition-colors hover:text-primary hover:opacity-100">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bebas text-xl">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="opacity-80 transition-colors hover:text-primary hover:opacity-100">Inicio</Link></li>
              <li><Link to="/tienda" className="opacity-80 transition-colors hover:text-primary hover:opacity-100">Tienda</Link></li>
              <li><Link to="/blog" className="opacity-80 transition-colors hover:text-primary hover:opacity-100">Blog</Link></li>
              <li><Link to="/nosotros" className="opacity-80 transition-colors hover:text-primary hover:opacity-100">Nosotros</Link></li>
              <li><Link to="/contacto" className="opacity-80 transition-colors hover:text-primary hover:opacity-100">Contáctanos</Link></li>
              <li><Link to="/legal" className="opacity-80 transition-colors hover:text-primary hover:opacity-100">Términos y Condiciones</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bebas text-xl">Atención comercial</h4>
            <p className="mb-4 text-sm opacity-80">Habla con un asesor y comparte el contexto exacto de la página actual por WhatsApp.</p>
            <a
              href={getAdvisorWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Hablar con un asesor
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-accent-foreground/20 pt-6 text-center text-sm opacity-60">
          <p>© 2025 Annova Software y Accesorios SAS. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
