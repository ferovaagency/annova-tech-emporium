export type ProductCondition = "Nuevo" | "Reacondicionado";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  brand: string;
  condition: ProductCondition;
  badge?: "Oferta" | "Nuevo" | "Reacondicionado" | "Más vendido";
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  featured?: boolean;
  bestSeller?: boolean;
  rating: number;
  reviews: number;
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
}

export const categories: Category[] = [
  { name: "Software y Licencias", slug: "software-licencias", icon: "💿", description: "Licencias corporativas, Windows, Microsoft 365, antivirus y más", image: "https://images.unsplash.com/photo-1607799279861-4dd421887fc9?w=400&h=300&fit=crop" },
  { name: "Servidores", slug: "servidores", icon: "🖥️", description: "Servidores empresariales y soluciones para datacenter", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop" },
  { name: "UPS y Energía", slug: "ups-energia", icon: "🔋", description: "UPS empresariales y soluciones de respaldo energético", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&h=300&fit=crop" },
  { name: "Computadores", slug: "computadores", icon: "💻", description: "Portátiles, equipos de escritorio nuevos y reacondicionados", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop" },
];

export const products: Product[] = [];

export const blogPosts = [
  {
    id: "1", slug: "guia-licencias-microsoft-empresas", title: "Guía Completa: Licencias Microsoft para Empresas en 2025", excerpt: "Descubre cómo elegir el plan de licenciamiento Microsoft ideal para tu empresa. Comparamos Microsoft 365, Windows y Server.", image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&h=400&fit=crop", date: "2025-02-10", author: "Equipo Annova", content: "El licenciamiento corporativo de Microsoft puede parecer complejo, pero elegir el plan correcto es fundamental para la productividad de tu empresa."
  },
  {
    id: "2", slug: "ventajas-equipos-reacondicionados", title: "5 Ventajas de Comprar Equipos Reacondicionados para tu Empresa", excerpt: "Los equipos reacondicionados ofrecen una excelente relación costo-beneficio sin sacrificar rendimiento.", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=400&fit=crop", date: "2025-01-28", author: "Equipo Annova", content: "Los equipos de cómputo reacondicionados se han convertido en una opción inteligente para empresas que buscan optimizar su presupuesto tecnológico."
  },
  {
    id: "3", slug: "importancia-ups-empresarial", title: "¿Por qué tu Empresa Necesita un UPS? Guía de Protección Eléctrica", excerpt: "Protege tus equipos y datos críticos con la solución de UPS adecuada.", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&h=400&fit=crop", date: "2025-01-15", author: "Equipo Annova", content: "Los cortes de energía y las fluctuaciones eléctricas pueden causar pérdida de datos y daño a equipos."
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}
