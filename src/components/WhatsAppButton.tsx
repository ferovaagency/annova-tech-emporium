import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { GA } from '@/hooks/useAnalytics';

export default function WhatsAppButton() {
  const handleClick = () => {
    GA.whatsapp('rotativo', 'floating_button');
  };

  return (
    <a
      href={getWhatsAppUrl("Hola, quiero información sobre sus productos")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
