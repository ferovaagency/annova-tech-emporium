import { useState } from 'react';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';

const asesores = [
  { name: 'Sergio Muñoz', phoneLabel: '+57 320 257 9393', seed: 'Sergio Muñoz' },
  { name: 'Isabella Garzón', phoneLabel: '+57 350 750 1878', seed: 'Isabella Garzón' },
  { name: 'AnnovaSoft Unilago', phoneLabel: '+57 305 795 0550', seed: 'AnnovaSoft Unilago' },
];

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company || null,
      message: form.message || null,
      source: 'contact',
    };

    const { error } = await supabase.from('quote_requests').insert(payload);
    await supabase.functions.invoke('send-notification', { body: { type: 'quote_request', payload } });

    if (error) {
      toast({ title: 'No se pudo enviar la solicitud', variant: 'destructive' });
    } else {
      toast({ title: 'Solicitud enviada', description: 'Te contactaremos pronto.' });
      setForm({ name: '', company: '', email: '', phone: '', message: '' });
    }

    setLoading(false);
  };

  return (
    <main className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bebas text-center mb-4"><span className="text-primary">Contáctanos</span></h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">AnnovaSoft y Annova Software y Accesorios SAS están listos para ayudarte con tecnología empresarial.</p>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bebas mb-6">Información de <span className="text-primary">Contacto</span></h2>
            <div className="space-y-4 mb-8">
              {asesores.map((asesor) => (
                <div key={asesor.name} className="border rounded-lg p-4 bg-card">
                  <p className="font-semibold text-sm">{asesor.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">{asesor.phoneLabel}</p>
                  <a
                    href={getWhatsAppUrl('Hola, quiero información sobre productos de AnnovaSoft', asesor.seed)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle className="w-4 h-4" /> Escribir por WhatsApp
                  </a>
                </div>
              ))}
            </div>

            <div className="space-y-6">
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
                  <p className="text-muted-foreground text-sm">Cra 15 # 76-53 Oficina 204</p>
                  <p className="text-muted-foreground text-sm">Bogotá, Colombia</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bebas mb-6">Envíanos un <span className="text-primary">Mensaje</span></h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
              <Input placeholder="Empresa" value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
              <Input placeholder="Teléfono" type="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
              <Textarea placeholder="¿Cómo podemos ayudarte?" rows={5} value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} />
              <Button disabled={loading} className="bg-primary text-primary-foreground hover:opacity-90 px-8 w-full">{loading ? 'Enviando...' : 'Enviar Mensaje'}</Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
