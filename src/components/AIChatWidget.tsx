// src/components/AIChatWidget.tsx
// Chat deshabilitado temporalmente — activar con Supabase Edge Function
export default function AIChatWidget() {
  return null;
}
```

Commit: **"fix: disable AI chat temporarily"**

Esto hace que el sitio vuelva en ~1 minuto sin romper nada más.

---

## ✅ Después del fix — cómo funciona el chat con IA nativa de Lovable

Lovable usa **Supabase Edge Functions** para llamadas a IA. El flujo es:
```
Usuario escribe → Frontend → Supabase Edge Function → IA → Respuesta
