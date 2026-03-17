import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, ShoppingCart, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { GA } from '@/hooks/useAnalytics';

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
  category: string | null;
  stock: number | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Eres Nova, asesora experta y proactiva de AnnovaSoft (Annova Software y Accesorios SAS). Tecnología empresarial en Colombia. Local: Av. Cra 15 #79-65 Bogotá (Unilago) Lun-Sáb 8am-6pm Dom 10am-4pm. Envíos 2-5 días Bogotá, 5-10 días Colombia. Devoluciones 15 días hábiles. Garantía 12 meses fabricante. Pagos: tarjeta/PSE/Nequi via Wompi. Proceso: carrito→checkout→asesor confirma en 3min→pago. Respuestas: máx 3 párrafos, directa y proactiva. Si recomiendas productos escribe: [PRODUCTOS: id1,id2]. Si quiere asesor humano: [WHATSAPP: motivo]. Si consulta pedido: [PEDIDO: email,referencia].`;

const QUICK_REPLIES = [
  "Quiero un servidor",
  "Busco laptops",
  "¿Cómo compro?",
  "Consultar pedido",
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef<number>(0);
  const { addToCart } = useCart();

  useEffect(() => {
    if (open && catalog.length === 0) {
      supabase.from('products').select('id,name,slug,price,sale_price,images,category,stock').eq('active', true).limit(100)
        .then(({ data }) => { if (data) setCatalog(data as CatalogProduct[]); });
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleOpen = () => {
    if (!open) {
      openedAtRef.current = Date.now();
      GA.nova('opened');
    } else {
      const secs = Math.round((Date.now() - openedAtRef.current) / 1000);
      GA.nova('closed', secs);
    }
    setOpen(!open);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    GA.nova('message_sent');

    const catalogStr = catalog.length > 0
      ? '\n\nCATÁLOGO DISPONIBLE:\n' + catalog.map(p => `- ID:${p.id} | ${p.name} | ${formatPrice(p.sale_price || p.price)} | Cat:${p.category || 'N/A'} | Stock:${p.stock ?? '?'}`).join('\n')
      : '';

    try {
      const { data, error } = await supabase.functions.invoke('nova-chat', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          system: SYSTEM_PROMPT + catalogStr,
        },
      });

      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error técnico. Contáctanos por WhatsApp: +57 305 7950550' }]);
    }
    setLoading(false);
  };

  const parseMessage = (content: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = content;

    // Parse [PRODUCTOS: id1,id2]
    const prodMatch = remaining.match(/\[PRODUCTOS:\s*([^\]]+)\]/);
    if (prodMatch) {
      const before = remaining.substring(0, prodMatch.index);
      remaining = remaining.substring((prodMatch.index || 0) + prodMatch[0].length);
      if (before.trim()) parts.push(<p key="b" className="mb-2 whitespace-pre-wrap">{before.trim()}</p>);

      const ids = prodMatch[1].split(',').map(s => s.trim());
      const matchedProducts = ids.map(id => catalog.find(p => p.id === id)).filter(Boolean) as CatalogProduct[];

      if (matchedProducts.length > 0) {
        parts.push(
          <div key="prods" className="space-y-2 my-2">
            {matchedProducts.map(p => (
              <div key={p.id} className="bg-background border rounded-lg p-2 flex items-center gap-2">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                  <p className="text-xs font-bold text-primary">{formatPrice(p.sale_price || p.price)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      addToCart({
                        id: p.id, name: p.name, slug: p.slug,
                        price: p.sale_price || p.price,
                        oldPrice: p.sale_price ? p.price : undefined,
                        image: p.images?.[0] || '', images: p.images || [],
                        category: p.category || '', categorySlug: '', brand: '',
                        condition: 'Nuevo' as any, shortDescription: '', description: '',
                        specs: {}, rating: 5, reviews: 0,
                      });
                      GA.addToCart(p.id, p.name, p.sale_price || p.price, 1);
                    }}
                    className="p-1.5 bg-primary text-primary-foreground rounded text-xs"
                    title="Agregar al carrito"
                  >
                    <ShoppingCart className="w-3 h-3" />
                  </button>
                  <Link to={`/producto/${p.slug}`} className="p-1.5 bg-muted rounded text-xs" title="Ver producto">
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        );
      }
    }

    // Parse [WHATSAPP: motivo]
    const waMatch = remaining.match(/\[WHATSAPP:\s*([^\]]+)\]/);
    if (waMatch) {
      const before = remaining.substring(0, waMatch.index);
      remaining = remaining.substring((waMatch.index || 0) + waMatch[0].length);
      if (before.trim()) parts.push(<p key="wb" className="mb-2 whitespace-pre-wrap">{before.trim()}</p>);
      parts.push(
        <a key="wa" href={getWhatsAppUrl(waMatch[1])} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-90 my-1">
          <MessageCircle className="w-3 h-3" /> Hablar con asesor
        </a>
      );
    }

    // Parse [PEDIDO: email,ref]
    const orderMatch = remaining.match(/\[PEDIDO:\s*([^\]]+)\]/);
    if (orderMatch) {
      const before = remaining.substring(0, orderMatch.index);
      remaining = remaining.substring((orderMatch.index || 0) + orderMatch[0].length);
      if (before.trim()) parts.push(<p key="ob" className="mb-2 whitespace-pre-wrap">{before.trim()}</p>);
      parts.push(
        <Link key="order" to="/mi-cuenta" className="inline-flex items-center gap-1 text-xs text-primary font-medium underline my-1">
          Consultar mi pedido →
        </Link>
      );
    }

    if (remaining.trim()) parts.push(<p key="rest" className="whitespace-pre-wrap">{remaining.trim()}</p>);
    return parts.length > 0 ? parts : <p className="whitespace-pre-wrap">{content}</p>;
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-24 right-6 z-50 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-110 transition-transform font-bebas text-2xl"
        aria-label="Abrir Nova, asesora IA"
      >
        {open ? <X className="w-6 h-6" /> : 'N'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-[7rem] right-6 z-50 w-[360px] h-[520px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bebas text-lg">N</div>
            <div className="flex-1">
              <p className="font-bebas text-lg leading-tight">Nova</p>
              <p className="text-[10px] opacity-80">Asesora AnnovaSoft · En línea</p>
            </div>
            <button onClick={toggleOpen} className="p-1 hover:bg-primary-foreground/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="font-medium mb-1">¡Hola! Soy Nova 👋</p>
                <p className="text-xs text-muted-foreground mb-4">Tu asesora de tecnología empresarial. ¿En qué te ayudo?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_REPLIES.map(q => (
                    <button key={q} onClick={() => sendMessage(q)} className="text-xs bg-muted px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                  {m.role === 'assistant' ? parseMessage(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()} className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center hover:opacity-90 disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
