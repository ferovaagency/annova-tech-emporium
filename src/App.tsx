// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIChatWidget from "@/components/AIChatWidget";
import SocialProofPopup from "@/components/SocialProofPopup";
import CartDrawerCTA from "@/components/CartDrawerCTA";
import Index from "./pages/Index";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminPanel from "./pages/AdminPanel";
import ProductGenerator from "./pages/ProductGenerator";
import MyAccount from "./pages/MyAccount";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Log SQL instructions once for missing tables
console.log(`
=== ANNOVA TECH — TABLAS SUPABASE REQUERIDAS ===
Si hay errores, ejecuta este SQL en Supabase:

create table if not exists availability_requests (
  id uuid default gen_random_uuid() primary key,
  customer_name text, customer_email text, customer_phone text,
  items jsonb not null, total numeric, status text default 'pending',
  admin_notes text, suggested_products jsonb,
  created_at timestamp default now(), updated_at timestamp default now()
);

create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null, name text, phone text, city text,
  last_order_at timestamp, created_at timestamp default now(), updated_at timestamp default now()
);

alter table products add column if not exists reviews jsonb;
alter table products add column if not exists condition text default 'Nuevo';
alter table products add column if not exists warranty text;
`);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tienda" element={<Store />} />
                <Route path="/producto/:slug" element={<ProductDetail />} />
                <Route path="/carrito" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/generador" element={<ProductGenerator />} />
                <Route path="/mi-cuenta" element={<MyAccount />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
            <WhatsAppButton />
            <AIChatWidget />
            <SocialProofPopup />
            <CartDrawerCTA />
          </div>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
