import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('annovasoft_cookies')) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t shadow-lg p-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Usamos cookies y Google Analytics para mejorar tu experiencia. Al navegar o registrarte aceptas nuestra{" "}
          <Link to="/legal" className="text-primary underline font-medium">Política de Cookies y Datos</Link>
          {" "}y autorizas a AnnovaSoft para enviarte comunicaciones por email, SMS y WhatsApp.
        </p>
        <button
          onClick={() => { localStorage.setItem('annovasoft_cookies', '1'); setShow(false); }}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
