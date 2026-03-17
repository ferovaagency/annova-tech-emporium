CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  author TEXT NOT NULL DEFAULT 'AnnovaSoft',
  status TEXT NOT NULL DEFAULT 'draft',
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can delete blog posts" ON public.blog_posts;

CREATE POLICY "Anyone can view blog posts"
ON public.blog_posts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert blog posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update blog posts"
ON public.blog_posts
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete blog posts"
ON public.blog_posts
FOR DELETE
USING (true);

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();