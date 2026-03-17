// src/components/SocialProofPopup.tsx
import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";

interface PopupData {
  name: string;
  city: string;
  product: string;
  minutesAgo: number;
}

const FAKE_NAMES = [
  "Carlos M.", "Andrés R.", "Laura G.", "Diego P.", "María F.",
  "Sebastián T.", "Valentina C.", "Juan D.", "Camila H.", "Felipe O.",
];

const CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga",
  "Pereira", "Manizales", "Cartagena", "Cúcuta", "Ibagué",
];

const FALLBACK_PRODUCTS = [
  "Servidor HP ProLiant", "Laptop Lenovo ThinkPad", "Switch Cisco Catalyst",
  "UPS APC Smart", "Firewall Fortinet", "Laptop Dell Latitude",
  "Monitor LG UltraWide", "Teclado Logitech MX", "Router Mikrotik",
];

export default function SocialProofPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState<string[]>(FALLBACK_PRODUCTS);

  // Intenta cargar productos reales de Supabase de forma segura
  useEffect(() => {
    async function loadProducts() {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) return;

        const client = createClient(supabaseUrl, supabaseKey);
        const { data } = await client
          .from("products")
          .select("name")
          .eq("active", true)
          .limit(30);

        if (data && data.length > 0) {
          setProducts(data.map((p: { name: string }) => p.name));
        }
      } catch {
        // Si falla, usa los productos fallback — nunca rompe el build
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const firstTimer = setTimeout(showPopup, 10000 + Math.random() * 5000);
    const interval = setInterval(showPopup, 35000 + Math.random() * 15000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [products]);

  function showPopup() {
    const data: PopupData = {
      name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
      city: CITIES[Math.floor(Math.random() * CITIES.length)],
      product: products[Math.floor(Math.random() * products.length)],
      minutesAgo: Math.floor(Math.random() * 25) + 2,
    };
    setPopup(data);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  }

  if (!popup) return null;

  return (
    <div
      className={`fixed bottom-32 left-4 z-50 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 max-w-[280px]">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#CC0000" }}
        >
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {popup.name} · {popup.city}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Compró{" "}
            <span className="font-medium text-gray-700">{popup.product}</span>
          </p>
          <p className="text-xs text-green-600 font-medium">
            hace {popup.minutesAgo} minutos ✓
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-300 hover:text-gray-500 flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
