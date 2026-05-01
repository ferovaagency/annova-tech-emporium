ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category_id IS NULL
  AND p.category IS NOT NULL
  AND lower(trim(c.name)) = lower(trim(p.category));

-- Also try slug match for any leftovers
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category_id IS NULL
  AND p.category IS NOT NULL
  AND lower(trim(c.slug)) = lower(trim(p.category));
