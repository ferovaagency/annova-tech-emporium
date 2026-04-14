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
