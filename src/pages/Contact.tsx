import { Phone, Mail, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function Contact() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bebas text-center mb-4"><span className="text-primary">Contáctanos</span></h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">Estamos listos para ayudarte con tus necesidades tecnológicas empresariales.</p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bebas mb-6">Información de <span className="text-primary">Contacto</span></h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Teléfonos</h3>
                  <p className="text-muted-foreground text-sm">+57 305 7950550</p>
                  <p className="text-muted-foreground text-sm">+57 301 6491625</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Correos</h3>
                  <p className="text-muted-foreground text-sm">comercial1@annovasoft.com</p>
                  <p className="text-muted-foreground text-sm">gerencia@annovasoft.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Dirección</h3>
                  <p className="text-muted-foreground text-sm">Avenida Carrera 15 79-65</p>
                  <p className="text-muted-foreground text-sm">Bogotá 110221</p>
                  <p className="text-muted-foreground text-sm">Bogotá, Colombia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bebas mb-6">Envíanos un <span className="text-primary">Mensaje</span></h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <Input placeholder="Nombre completo" />
              <Input placeholder="Empresa" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Teléfono" type="tel" />
              <Textarea placeholder="¿Cómo podemos ayudarte?" rows={5} />
              <Button className="bg-primary text-primary-foreground hover:opacity-90 px-8 w-full">Enviar Mensaje</Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
