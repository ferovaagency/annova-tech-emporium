
-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  city text,
  last_order_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update customers" ON public.customers FOR UPDATE USING (true);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS condition text DEFAULT 'Nuevo';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text;

-- Add order_id index for faster lookups
CREATE INDEX IF NOT EXISTS idx_availability_requests_order_id ON public.availability_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
