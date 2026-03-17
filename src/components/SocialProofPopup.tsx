// src/components/SocialProofPopup.tsx
import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PopupData {
  name: string;
  city: string;
  product: string;
  minutesAgo: number;
}

const FAKE_NAMES = ["Carlos M.", "Andrés R.", "Laura G.", "Diego P.", "María F.", "Sebastián T.", "Valentina C.", "Juan D.", "Camila H.", "Felipe O."];
const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Pereira", "Manizales", "Cartagena", "Cúcuta", "Ibagué"];

export default function SocialProofPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    // Primera aparición: entre 8 y 15 segundos
    const firstTimer = setTimeout(showPopup, 8000 + Math.random() * 7000);

    // Repetición cada 30-45 segundos
    const interval = setInterval(showPopup, 30000 + Math.random() * 15000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [products]);

  async function loadProducts() {
    try {
      const { data } = await supabase
        .from("products")
        .select("name")
        .eq("active", true)
        .limit(20);
      if (data && data.length > 0) {
        setProducts(data.map((p) => p.name));
      } else {
        // Fallback si no hay productos en Supabase aún
        setProducts(["Servidor HP ProLiant", "Laptop Lenovo ThinkPad", "Switch Cisco Catalyst", "UPS APC Smart", "Firewall Fortinet"]);
      }
    } catch {
      setProducts(["Servidor HP ProLiant", "Laptop Lenovo ThinkPad", "Switch Cisco Catalyst"]);
    }
  }

  function showPopup() {
    const data: PopupData = {
      name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
      city: CITIES[Math.floor(Math.random() * CITIES.length)],
      product: products[Math.floor(Math.random() * products.length)],
      minutesAgo: Math.floor(Math.random() * 25) + 2,
    };
    setPopup(data);
    setVisible(true);

    // Se oculta automáticamente a los 6 segundos
    setTimeout(() => setVisible(false), 6000);
  }

  if (!popup) return null;

  return (
    <div
      className={`fixed bottom-32 left-4 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 max-w-[280px]">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#CC0000" }}>
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {popup.name} · {popup.city}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Compró <span className="font-medium text-gray-700">{popup.product}</span>
          </p>
          <p className="text-xs text-green-600 font-medium">hace {popup.minutesAgo} minutos ✓</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
