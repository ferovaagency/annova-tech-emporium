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

export const blogPosts: Array<{
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  content: string;
}> = [];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}