-- Fix permissive RLS policies created for orders and quote_requests, and add delete support/realtime
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

CREATE POLICY "Public can view orders"
ON public.orders
FOR SELECT
TO public
USING ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

CREATE POLICY "Public can update orders"
ON public.orders
FOR UPDATE
TO public
USING ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

DROP POLICY IF EXISTS "Anyone can create quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can update quote requests" ON public.quote_requests;

CREATE POLICY "Public can create quote requests"
ON public.quote_requests
FOR INSERT
TO public
WITH CHECK ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

CREATE POLICY "Public can update quote requests"
ON public.quote_requests
FOR UPDATE
TO public
USING ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

CREATE POLICY "Public can view quote requests"
ON public.quote_requests
FOR SELECT
TO public
USING ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

CREATE POLICY "Anyone can delete availability requests"
ON public.availability_requests
FOR DELETE
TO public
USING ((auth.role() = 'anon') OR (auth.role() = 'authenticated'));

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;