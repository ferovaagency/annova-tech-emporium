import { Shield, Users, Award, Target } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export default function About() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bebas text-center mb-4">Sobre <span className="text-primary">Nosotros</span></h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">Somos Annova Software y Accesorios SAS, proveedor líder de soluciones tecnológicas empresariales en Colombia.</p>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bebas mb-4 text-primary">Nuestra Misión</h2>
            <p className="text-muted-foreground leading-relaxed">Proveer a las empresas colombianas soluciones tecnológicas de alta calidad, desde software y licenciamiento hasta infraestructura y equipos de cómputo, con precios competitivos y soporte dedicado que impulsen su transformación digital.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bebas mb-4 text-primary">Nuestra Visión</h2>
            <p className="text-muted-foreground leading-relaxed">Ser el marketplace de referencia en tecnología empresarial B2B en Colombia, reconocidos por nuestra confiabilidad, variedad de productos y compromiso con el éxito de nuestros clientes corporativos.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Shield, title: 'Garantía', desc: 'Garantía empresarial en todos nuestros productos' },
            { icon: Users, title: 'Soporte', desc: 'Equipo de expertos dedicados a tu empresa' },
            { icon: Award, title: 'Calidad', desc: 'Productos certificados y marcas reconocidas' },
            { icon: Target, title: 'B2B', desc: 'Enfoque exclusivo en soluciones empresariales' },
          ].map(item => (
            <div key={item.title} className="text-center p-6 bg-card rounded-xl border">
              <item.icon className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-bebas text-lg mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <section className="bg-muted rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bebas mb-3">¿Listo para <span className="text-primary">Trabajar Juntos</span>?</h2>
          <p className="text-muted-foreground mb-6">Contáctanos para una asesoría personalizada.</p>
          <a href={getWhatsAppUrl("Hola, quiero más información")} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-primary-foreground font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Contactar por WhatsApp
          </a>
        </section>
      </div>
    </main>
  );
}
