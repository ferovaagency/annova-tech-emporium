// src/components/UrgencyBadge.tsx
import { useState, useEffect } from "react";
import { Flame, Clock, Truck } from "lucide-react";

interface UrgencyBadgeProps {
  stock?: number;
  showTimer?: boolean;
}

export default function UrgencyBadge({ stock, showTimer = true }: UrgencyBadgeProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!showTimer) return;

    function calcTime() {
      const now = new Date();
      // Cuenta regresiva hasta las 5pm hora Colombia
      const cutoff = new Date();
      cutoff.setHours(17, 0, 0, 0);
      if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
      const diff = Math.max(0, cutoff.getTime() - now.getTime());
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [showTimer]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="space-y-2">
      {/* Stock bajo */}
      {stock !== undefined && stock <= 5 && stock > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">
            ¡Solo quedan <span className="font-bold">{stock} unidades</span> en inventario!
          </p>
        </div>
      )}

      {/* Envío hoy */}
      {showTimer && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">
            Pide en{" "}
            <span className="font-bold text-green-800">
              {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
            </span>{" "}
            y lo despachamos hoy
          </p>
        </div>
      )}

      {/* Indicador de personas viendo */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-300" />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{Math.floor(Math.random() * 8) + 3} personas</span> están viendo esto ahora
        </p>
      </div>
    </div>
  );
}
