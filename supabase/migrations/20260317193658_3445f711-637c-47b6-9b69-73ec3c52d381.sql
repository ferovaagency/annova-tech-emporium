-- Allow deleting products (admin functionality)
CREATE POLICY "Anyone can delete products"
ON public.products
FOR DELETE
USING (true);
