
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id);

CREATE POLICY "Anyone can update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categories" ON public.categories FOR DELETE USING (true);
