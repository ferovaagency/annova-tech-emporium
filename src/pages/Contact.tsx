import { useState } from 'react';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getAdvisorWhatsAppUrl } from '@/lib/whatsapp-context';

const asesores = [
  { name: 'Sergio Muñoz', phoneLabel: '+57 320 257 9393' },
  { name: 'Isabella Garzón', phoneLabel: '+57 350 750 1878' },
  { name: 'AnnovaSoft Unilago', phoneLabel: '+57 305 795 0550' },
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
    await supabase.functions.invoke('send-notification', { body: { type: 'quote', payload } });

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
        <h1 className="mb-4 text-center text-4xl font-bebas md:text-5xl"><span className="text-primary">Contáctanos</span></h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">AnnovaSoft y Annova Software y Accesorios SAS están listos para ayudarte con tecnología empresarial.</p>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bebas">Información de <span className="text-primary">Contacto</span></h2>
            <div className="mb-8 space-y-4">
              {asesores.map((asesor) => (
                <div key={asesor.name} className="rounded-lg border bg-card p-4">
                  <p className="text-sm font-semibold">{asesor.name}</p>
                  <p className="mb-3 text-sm text-muted-foreground">{asesor.phoneLabel}</p>
                  <a
                    href={getAdvisorWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" /> Hablar con un asesor
                  </a>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Correos</h3>
                  <p className="text-sm text-muted-foreground">administrativo@annovasoft.com</p>
                  <p className="text-sm text-muted-foreground">Comercial1@annovasoft.com</p>
                  <p className="text-sm text-muted-foreground">Gerencia@annovasoft.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Dirección</h3>
                  <p className="text-sm text-muted-foreground">Cra 15 # 76-53 Oficina 204</p>
                  <p className="text-sm text-muted-foreground">Bogotá, Colombia</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-bebas">Envíanos un <span className="text-primary">Mensaje</span></h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
              <Input placeholder="Empresa" value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
              <Input placeholder="Teléfono" type="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
              <Textarea placeholder="¿Cómo podemos ayudarte?" rows={5} value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} />
              <Button disabled={loading} className="w-full bg-primary px-8 text-primary-foreground hover:opacity-90">{loading ? 'Enviando...' : 'Enviar Mensaje'}</Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}