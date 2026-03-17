// src/components/AIChatWidget.tsx
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ShoppingCart, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Eres el asesor de ventas experto de Annova Tech, especialista en tecnología empresarial para Colombia. Tu objetivo es ayudar a los clientes a encontrar el producto ideal y llevarlos a comprar.

SOBRE ANNOVA TECH:
- Vende servidores, software, infraestructura y equipos de cómputo para empresas
- Cobertura: todo Colombia
- Pagos: tarjeta de crédito, PSE, Nequi (procesado por Wompi)
- Garantía en todos los productos
- Soporte técnico dedicado post-venta

TU FORMA DE RESPONDER:
- Siempre en español, tono profesional pero cercano
- Respuestas cortas y directas (máx 3 párrafos)
- Siempre termina con una pregunta o una CTA clara
- Si preguntan por precio, dales el precio exacto del producto
- Si no sabes algo específico, ofrece conectarlos con un asesor por WhatsApp
- Menciona beneficios concretos: garantía, soporte, entrega rápida
- Cuando recomiendas un producto, incluye el nombre exacto para que puedan buscarlo

REGLAS:
- Nunca inventes precios o especificaciones
- Si el producto no está en el catálogo, dilo claramente
- Siempre ofrece WhatsApp como alternativa para cotizaciones complejas
- No hagas preguntas múltiples, una a la vez`;

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el asesor de Annova Tech 👋 ¿Qué tipo de tecnología necesitas para tu empresa? Puedo ayudarte a encontrar el equipo ideal o resolver cualquier duda.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carga resumen del catálogo al abrir el chat
  useEffect(() => {
    if (open && !products) {
      loadProductCatalog();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function loadProductCatalog() {
    try {
      const { data } = await supabase
        .from("products")
        .select("name, short_description, price, sale_price, sku, slug")
        .eq("active", true)
        .limit(50);

      if (data && data.length > 0) {
        const catalog = data
          .map((p) => `- ${p.name}${p.sku ? ` (SKU: ${p.sku})` : ""}: $${(p.sale_price || p.price || 0).toLocaleString("es-CO")} COP. ${p.short_description || ""}`)
          .join("\n");
        setProducts(`\n\nCATÁLOGO DISPONIBLE:\n${catalog}`);
      }
    } catch {
      // Si falla, el asesor funciona igual sin catálogo
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: SYSTEM_PROMPT + products,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      const reply = data?.content?.[0]?.text || "Disculpa, hubo un error. Escríbenos por WhatsApp para ayudarte de inmediato.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Tuve un problema técnico. Escríbenos por WhatsApp al +57 305 7950550 y te atendemos de inmediato 💬" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${open ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        style={{ backgroundColor: "#CC0000" }}
        aria-label="Abrir asesor de IA"
      >
        <Bot className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {/* Ventana del chat */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${
          open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ height: "480px", border: "1px solid #e5e7eb" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-t-2xl text-white" style={{ backgroundColor: "#0A0A0A" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#CC0000" }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Asesor Annova Tech</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <p className="text-xs text-gray-300">En línea ahora</p>
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1" style={{ backgroundColor: "#CC0000" }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                }`}
                style={msg.role === "user" ? { backgroundColor: "#CC0000" } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0" style={{ backgroundColor: "#CC0000" }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias rápidas (solo al inicio) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap bg-gray-50">
            {["Quiero un servidor", "Necesito cotización", "¿Qué marcas manejan?"].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-red-400 hover:text-red-600 transition-colors text-gray-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-400 bg-gray-50"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
              style={{ backgroundColor: "#CC0000" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            ¿Prefieres hablar con una persona?{" "}
            <a href="https://wa.me/573057950550" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
