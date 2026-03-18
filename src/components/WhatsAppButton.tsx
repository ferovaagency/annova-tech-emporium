import { MessageCircle } from 'lucide-react';
import { GA } from '@/hooks/useAnalytics';
import { getAdvisorWhatsAppUrl } from '@/lib/whatsapp-context';

export default function WhatsAppButton() {
  const handleClick = () => {
    GA.whatsapp('rotativo', 'floating_button');
  };

  return (
    <a
      href={getAdvisorWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
      aria-label="Hablar con un asesor por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
