import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { categories } from '@/data/products';

export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-bebas text-2xl mb-4"><span className="text-primary">ANNOVA</span>SOFT</h3>
            <p className="text-sm opacity-80 mb-4">Proveedor líder de soluciones tecnológicas empresariales en Colombia. Software, servidores, infraestructura y equipos de cómputo.</p>
            <div className="space-y-2 text-sm opacity-80">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +57 305 7950550</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +57 301 6491625</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> comercial1@annovasoft.com</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> gerencia@annovasoft.com</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Avenida Carrera 15 79-65, Bogotá 110221, Colombia</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bebas text-xl mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm">
              {categories.map(cat => (
                <li key={cat.slug}>
                  <Link to={`/tienda?categoria=${cat.slug}`} className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bebas text-xl mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link to="/tienda" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Tienda</Link></li>
              <li><Link to="/blog" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/nosotros" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Nosotros</Link></li>
              <li><Link to="/contacto" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Contáctanos</Link></li>
              <li><Link to="/legal" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/legal" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Política de Cookies</Link></li>
              <li><Link to="/legal" className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">Tratamiento de Datos</Link></li>
            </ul>
          </div>

          {/* Quote */}
          <div>
            <h4 className="font-bebas text-xl mb-4">Cotización Empresarial</h4>
            <p className="text-sm opacity-80 mb-4">¿Necesitas una cotización para tu empresa? Contáctanos y te asesoramos.</p>
            <a
              href={getWhatsAppUrl("Hola, necesito una cotización empresarial")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Solicitar Cotización
            </a>
          </div>
        </div>

        <div className="border-t border-accent-foreground/20 mt-8 pt-6 text-center text-sm opacity-60">
          <p>© 2025 Annova Software y Accesorios SAS. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
