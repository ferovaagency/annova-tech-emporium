import { Flame, MessageCircle } from 'lucide-react';

interface UrgencyBadgeProps {
  stock?: number;
  showTimer?: boolean;
}

export default function UrgencyBadge({ stock }: UrgencyBadgeProps) {
  const viewers = Math.floor(Math.random() * 8) + 3;

  return (
    <div className="space-y-2">
      {stock !== undefined && stock <= 5 && stock > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <Flame className="h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Solo quedan <span className="font-bold text-primary">{stock} unidades</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2">
        <MessageCircle className="h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-sm text-foreground">Confirmamos disponibilidad en máximo <span className="font-semibold text-primary">48h</span>.</p>
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{viewers} personas</span> están viendo esto ahora
      </p>
    </div>
  );
}
