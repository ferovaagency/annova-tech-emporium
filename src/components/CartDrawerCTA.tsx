// src/components/CartDrawerCTA.tsx
import { useCart } from "@/context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export default function CartDrawerCTA() {
  const { totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // No mostrar en carrito ni en checkout
  if (totalItems === 0) return null;
  if (["/carrito", "/checkout", "/pago-resultado"].includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <button
        onClick={() => navigate("/carrito")}
        className="w-full flex items-center justify-between text-white rounded-2xl px-4 py-3.5 shadow-2xl"
        style={{ backgroundColor: "#CC0000" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-red-600 rounded-full text-xs font-bold flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span className="font-semibold text-sm">Ver carrito</span>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm">${totalPrice.toLocaleString("es-CO")} COP</p>
          <p className="text-xs text-red-200">Ir a pagar →</p>
        </div>
      </button>
    </div>
  );
}
