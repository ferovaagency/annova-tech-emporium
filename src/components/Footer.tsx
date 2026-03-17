import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { useActiveCategories } from '@/hooks/useActiveCategories';

const asesores = [
  { name: 'Sergio Muñoz', phoneLabel: '+57 320 257 9393', seed: 'Sergio Muñoz' },
  { name: 'Isabella Garzón', phoneLabel: '+57 350 750 1878', seed: 'Isabella Garzón' },
  { name: 'AnnovaSoft Unilago', phoneLabel: '+57 305 795 0550', seed: 'AnnovaSoft Unilago' },
];

export default function Footer() {
  const { categories } = useActiveCategories();

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bebas text-2xl mb-4"><span className="text-primary">ANNOVA</span>SOFT</h3>
            <p className="text-sm opacity-80 mb-4">Annova Software y Accesorios SAS, soluciones tecnológicas empresariales en Colombia.</p>
            <div className="space-y-2 text-sm opacity-80">
              {asesores.map((asesor) => (
                <a
                  key={asesor.name}
                  href={getWhatsAppUrl('Hola, quiero información sobre productos de AnnovaSoft', asesor.seed)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> {asesor.name}: {asesor.phoneLabel}
                </a>
              ))}
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> comercial1@annovasoft.com</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> gerencia@annovasoft.com</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Cra 15 # 76-53 Oficina 204, Bogotá, Colombia</p>
            </div>
          </div>

          <div>
            <h4 className="font-bebas text-xl mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm">
              {categories.length > 0 ? categories.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/tienda?categoria=${cat.slug}`} className="opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                </li>
              )) : <li className="opacity-60">Sin categorías disponibles</li>}
            </ul>
          </div>

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

          <div>
            <h4 className="font-bebas text-xl mb-4">Cotización Empresarial</h4>
            <p className="text-sm opacity-80 mb-4">¿Necesitas una cotización para tu empresa? Contáctanos y te asesoramos.</p>
            <a
              href={getWhatsAppUrl('Hola, necesito una cotización empresarial de AnnovaSoft')}
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
