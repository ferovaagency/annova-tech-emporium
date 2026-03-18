import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/products';
import { generateSlug } from '@/lib/slug';
import { getParentCategory } from '@/lib/catalog';
import { FIXED_PARENT_CATEGORIES } from '@/lib/category-visuals';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import BulkProductImporter from '@/components/BulkProductImporter';
import { Loader2, Upload, X, Sparkles, Eye, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Search, ImageIcon } from 'lucide-react';

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  sku: string | null;
  category: string | null;
  brand: string | null;
  stock: number | null;
  short_description: string | null;
  description: string | null;
  specs: Record<string, string> | null;
  meta_title: string | null;
  meta_description: string | null;
  images: string[] | null;
  active: boolean | null;
  condition: string | null;
  warranty: string | null;
  reviews: Array<{ author: string; role: string; text: string; rating: number }> | null;
}

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  active: boolean;
  created_at: string;
  author: string | null;
}

const WARRANTY_OPTIONS = ['6 meses con fabricante', '12 meses con fabricante', '24 meses con fabricante', '6 meses con AnnovaSoft', '12 meses con AnnovaSoft', 'Sin garantía'];
const BLOG_TYPES: Record<string, string> = {
  '2000': 'Guía completa (2000+ palabras)',
  '1200': 'Artículo informativo (1200 palabras)',
  '800': 'Post rápido (800 palabras)',
};

function extractMeta(html: string, key: string) {
  const match = html.match(new RegExp(`<!--\\s*${key}:([\\s\\S]*?)-->`, 'i'));
  return match?.[1]?.trim() || '';
}

function extractH1(html: string) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
}

function ImagePreview({ url, label }: { url: string; label: string }) {
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-center">
          <ImageIcon className="h-8 w-8" />
          <span className="px-4 text-xs font-medium">{label}</span>
        </div>
      </div>
    );
  }

  return <img src={url} alt={label} className="h-full w-full object-cover object-center" />;
}

export default function ProductGenerator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState('productos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [sku, setSku] = useState('');
  const [condition, setCondition] = useState('Nuevo');
  const [warranty, setWarranty] = useState('12 meses con fabricante');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [reviews, setReviews] = useState<Array<{ author: string; role: string; text: string; rating: number }>>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [blogTopic, setBlogTopic] = useState('');
  const [blogKeywords, setBlogKeywords] = useState('');
  const [blogIndustry, setBlogIndustry] = useState('General');
  const [blogNotes, setBlogNotes] = useState('');
  const [blogType, setBlogType] = useState('1200');
  const [blogHtml, setBlogHtml] = useState('');
  const [blogMetaTitle, setBlogMetaTitle] = useState('');
  const [blogMetaDescription, setBlogMetaDescription] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogCoverPrompt, setBlogCoverPrompt] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPostRow[]>([]);
  const [editingBlog, setEditingBlog] = useState<BlogPostRow | null>(null);
  const [blogSearch, setBlogSearch] = useState('');

  const slug = generateSlug(name);

  const fetchData = useCallback(async () => {
    const [productsRes, postsRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('blog_posts').select('*').order('created_at', { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data as unknown as DBProduct[]);
    if (postsRes.data) setBlogPosts(postsRes.data as BlogPostRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setSalePrice('');
    setSku('');
    setCondition('Nuevo');
    setWarranty('12 meses con fabricante');
    setShortDesc('');
    setDescription('');
    setSpecsText('');
    setCategory('');
    setBrand('');
    setMetaTitle('');
    setMetaDesc('');
    setImageUrls([]);
    setReviews([]);
    setAiNotes('');
  };

  const resetBlogForm = () => {
    setEditingBlog(null);
    setBlogTopic('');
    setBlogKeywords('');
    setBlogIndustry('General');
    setBlogNotes('');
    setBlogType('1200');
    setBlogHtml('');
    setBlogMetaTitle('');
    setBlogMetaDescription('');
    setBlogSlug('');
    setBlogExcerpt('');
    setBlogCoverPrompt('');
    setBlogCoverImage('');
  };

  const loadProduct = (product: DBProduct) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.price));
    setSalePrice(product.sale_price ? String(product.sale_price) : '');
    setSku(product.sku || '');
    setCondition(product.condition || 'Nuevo');
    setWarranty(product.warranty || '12 meses con fabricante');
    setShortDesc(product.short_description || '');
    setDescription(product.description || '');
    setSpecsText(product.specs ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '');
    setCategory(product.category || '');
    setBrand(product.brand || '');
    setMetaTitle(product.meta_title || '');
    setMetaDesc(product.meta_description || '');
    setImageUrls((product.images || []).filter((img): img is string => typeof img === 'string' && img.trim().length > 0));
    setReviews(product.reviews || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTab('productos');
  };

  const loadBlogPost = (post: BlogPostRow) => {
    setEditingBlog(post);
    setBlogHtml(post.content || '');
    setBlogMetaTitle(post.meta_title || '');
    setBlogMetaDescription(post.meta_description || '');
    setBlogSlug(post.slug || '');
    setBlogExcerpt(post.excerpt || '');
    setBlogCoverImage(post.cover_image || '');
    setBlogTopic(post.title || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const parseSpecs = (text: string): Record<string, string> => {
    const parsed: Record<string, string> = {};
    text.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) parsed[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    return parsed;
  };

  const uploadRemoteImage = async () => {
    throw new Error('La importación remota de imágenes está desactivada');
  };

  const generateBlogCover = async () => {
    return '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        setImageUrls((prev) => [...prev, data.publicUrl]);
      }
    } catch (err: any) {
      toast({ title: 'No se pudo subir la imagen', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addImageUrl = async () => {
    const input = imageUrlInput.trim();
    if (!input) return;

    if (!isExternalImageUrl(input)) {
      setImageUrls((prev) => [...prev, input]);
      setImageUrlInput('');
      return;
    }

    setProcessingRemoteImage(true);
    try {
      const uploadedUrl = await uploadRemoteImage(input);
      setImageUrls((prev) => [...prev, uploadedUrl]);
      setImageUrlInput('');
      toast({ title: 'Imagen importada al almacenamiento del sitio' });
    } catch (err: any) {
      toast({ title: 'No se pudo importar la imagen', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingRemoteImage(false);
    }
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const handleGenerateAI = async () => {
    if (!name) {
      return toast({ title: 'Ingresa el nombre del producto primero', variant: 'destructive' });
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          productName: name,
          price: price ? Number(price) : null,
          condition,
          warranty,
          additionalNotes: aiNotes || null,
        },
      });

      if (error) throw error;
      if (data.description) setDescription(data.description);
      if (data.meta_title) setMetaTitle(data.meta_title);
      if (data.meta_description) setMetaDesc(data.meta_description);
      if (data.short_description) setShortDesc(data.short_description);
      if (data.category) setCategory(data.category);
      if (data.brand) setBrand(data.brand);
      if (data.specs) setSpecsText(Object.entries(data.specs as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join('\n'));
      if (data.reviews && Array.isArray(data.reviews)) setReviews(data.reviews);
      toast({ title: 'Contenido generado con IA exitosamente' });
    } catch (err: any) {
      toast({ title: 'Error al generar contenido', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingAI(false);
    }
  };

  const resolveProductImages = async () => {
    const normalized = await Promise.all(
      imageUrls.map(async (url) => {
        if (typeof url !== 'string' || !url.trim()) return '';
        if (!isExternalImageUrl(url)) return url.trim();
        return uploadRemoteImage(url.trim());
      }),
    );

    return normalized.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  };

  const handleSave = async () => {
    if (!name || !price) {
      return toast({ title: 'Nombre y precio son requeridos', variant: 'destructive' });
    }

    if (imageUrls.length === 0) {
      return toast({ title: 'Agrega al menos una imagen', variant: 'destructive' });
    }

    setSaving(true);
    try {
      let finalSlug = slug;
      if (!editingId) {
        let suffix = 1;
        let slugExists = true;
        while (slugExists) {
          const checkSlug = suffix === 1 ? finalSlug : `${finalSlug}-${suffix}`;
          const { data } = await supabase.from('products').select('id').eq('slug', checkSlug).maybeSingle();
          if (!data) {
            finalSlug = checkSlug;
            slugExists = false;
          } else {
            suffix += 1;
          }
        }
      }

      const normalizedImages = await resolveProductImages();
      if (normalizedImages.length === 0) {
        throw new Error('No se pudo obtener una URL válida para las imágenes');
      }

      const resolvedCategory = category || getParentCategory('', `${name} ${brand} ${shortDesc} ${description} ${specsText}`);

      const productData = {
        name,
        slug: finalSlug,
        price: Number(price),
        sale_price: salePrice ? Number(salePrice) : null,
        sku: sku || null,
        category: category || null,
        brand: brand || null,
        condition,
        warranty,
        short_description: shortDesc || null,
        description: description || null,
        specs: Object.keys(parseSpecs(specsText)).length > 0 ? parseSpecs(specsText) : null,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
        images: normalizedImages,
        reviews: reviews.length > 0 ? reviews : null,
        active: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = editingId
        ? await supabase.from('products').update(productData).eq('id', editingId)
        : await supabase.from('products').insert(productData);

      if (error) throw error;
      toast({ title: editingId ? 'Producto actualizado' : 'Producto creado' });
      resetForm();
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: DBProduct) => {
    await supabase.from('products').update({ active: !product.active, updated_at: new Date().toISOString() }).eq('id', product.id);
    fetchData();
  };

  const handleDeleteProduct = async (product: DBProduct) => {
    if (!confirm(`¿Eliminar '${product.name}'? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Producto eliminado' });
      fetchData();
    }
  };

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, productSearch]);

  const filteredBlogPosts = useMemo(() => {
    const query = blogSearch.trim().toLowerCase();
    if (!query) return blogPosts;
    return blogPosts.filter((post) => `${post.title} ${post.slug}`.toLowerCase().includes(query));
  }, [blogPosts, blogSearch]);

  const generateBlog = async () => {
    if (!blogTopic || !blogKeywords) {
      return toast({ title: 'Tema y keywords son requeridos', variant: 'destructive' });
    }

    setGeneratingBlog(true);
    try {
      const catalog = products.slice(0, 30).map((product) => `- ${product.name} | slug:${product.slug} | categoria:${product.category || 'General'}`).join('\n');
      const prompt = `Tema: ${blogTopic}\nPalabras clave SEO: ${blogKeywords}\nIndustria/público objetivo: ${blogIndustry}\nNotas adicionales: ${blogNotes || 'Ninguna'}\nTipo de artículo: ${BLOG_TYPES[blogType]}\nLongitud esperada: ${blogType} palabras o más.`;
      const system = `Eres un redactor SEO experto de AnnovaSoft siguiendo la Guía Editorial Ferova Agency. Genera un artículo de blog completo en HTML optimizado para SEO y GEO (para ser recomendado por IAs como ChatGPT, Perplexity y Google SGE).\n\nREGLAS OBLIGATORIAS DE LA GUÍA FEROVA:\n\n1. ANTES DE ESCRIBIR: El artículo debe responder: ¿Qué aprende el lector? ¿Qué decisión lo ayuda a tomar? ¿Ayuda a tomar mejores decisiones digitales?\n\n2. ESTRUCTURA OBLIGATORIA:\n- H1 único: [Keyword principal] + [Promesa de valor] | AnnovaSoft (máx 65 chars)\n- Primera oración: afirmación contundente con Sujeto+Verbo+Predicado técnico, NO pregunta\n- Párrafo introductorio: qué aprenderá, contexto, promesa de valor práctica\n- Desarrollo con H2 y H3\n- NUNCA saltar niveles jerárquicos\n- Cierre estratégico: conclusión + resumen práctico + reflexión + CTA sutil\n\n3. SEO: keyword en H1, primer párrafo y al menos un H2. Densidad máx 2-3%.\n4. TONO: conversado pero profesional. Técnico con contexto. Educación antes que venta.\n5. EXTENSIÓN según tipo solicitado.\n\nENLACES INTERNOS PSICOLÓGICOS:\n- Incluir 2-4 menciones naturales de productos de AnnovaSoft donde sea relevante\n- Formato: <a href='/producto/[slug-del-producto]' class='blog-product-link'>[nombre del producto]</a>\n\nENLACE A WHATSAPP:\n- Si es natural, incluir <a href='https://wa.me/573057950550' target='_blank' class='blog-whatsapp-link'>hablar con un asesor</a> máximo 1-2 veces\n\nSCHEMAS JSON-LD al final del HTML:\n- Article schema\n- FAQPage si aplica\n- HowTo si aplica\n\nMETA TAGS como comentarios al inicio:\n<!-- META_TITLE: [máx 60 chars] -->\n<!-- META_DESCRIPTION: [150-160 chars] -->\n<!-- SLUG: [solo-keywords-relevantes-sin-articulos-sin-tildes-max-40-chars] -->\n<!-- EXCERPT: [resumen de 2 oraciones] -->\n<!-- COVER_IMAGE_PROMPT: [descripción en inglés para una portada horizontal editorial y corporativa] -->\n\nCATÁLOGO DE PRODUCTOS DISPONIBLES:\n${catalog}`;

      const { data, error } = await supabase.functions.invoke('nova-chat', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          system,
          maxTokens: 3200,
        },
      });

      if (error) throw error;

      const html = data?.reply || '';
      const metaTitleValue = extractMeta(html, 'META_TITLE');
      const metaDescriptionValue = extractMeta(html, 'META_DESCRIPTION');
      const slugValue = extractMeta(html, 'SLUG');
      const excerptValue = extractMeta(html, 'EXCERPT');
      const coverPromptValue = extractMeta(html, 'COVER_IMAGE_PROMPT');
      const articleTitle = extractH1(html) || blogTopic;
      const coverImageUrl = await generateBlogCover(articleTitle, excerptValue || blogTopic);

      setBlogHtml(html);
      setBlogMetaTitle(metaTitleValue);
      setBlogMetaDescription(metaDescriptionValue);
      setBlogSlug(slugValue);
      setBlogExcerpt(excerptValue);
      setBlogCoverPrompt(coverPromptValue);
      setBlogCoverImage(coverImageUrl);
      toast({ title: 'Artículo y portada generados' });
    } catch (err: any) {
      toast({ title: 'No se pudo generar el artículo', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingBlog(false);
    }
  };

  const saveBlog = async (publish: boolean) => {
    const title = extractH1(blogHtml) || blogTopic;
    if (!title || !blogSlug || !blogHtml) {
      return toast({ title: 'Faltan datos del artículo', variant: 'destructive' });
    }

    setSavingBlog(true);
    try {
      const coverImage = blogCoverImage || (await generateBlogCover(title, blogExcerpt || blogTopic));
      const basePayload = {
        title,
        slug: generateSlug(blogSlug).slice(0, 40),
        content: blogHtml,
        excerpt: blogExcerpt || null,
        meta_title: blogMetaTitle || null,
        meta_description: blogMetaDescription || null,
        cover_image: coverImage || null,
        status: publish ? 'published' : 'draft',
        author: 'AnnovaSoft',
        active: publish,
        updated_at: new Date().toISOString(),
      };

      const result = editingBlog
        ? await (supabase as any).from('blog_posts').update(basePayload).eq('id', editingBlog.id)
        : await (supabase as any).from('blog_posts').insert({ ...basePayload, created_at: new Date().toISOString() });

      if (result.error) throw result.error;

      setBlogCoverImage(coverImage || '');
      toast({ title: publish ? 'Artículo publicado en el blog' : 'Artículo guardado como borrador' });
      fetchData();
      if (!editingBlog) resetBlogForm();
    } catch (err: any) {
      toast({ title: 'Error al guardar artículo', description: err.message, variant: 'destructive' });
    } finally {
      setSavingBlog(false);
    }
  };

  if (loading) {
    return (
      <main className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <h1 className="mb-8 text-3xl font-bebas">
          Generador <span className="text-primary">AnnovaSoft</span>
        </h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          <TabsContent value="productos">
            <div className="mb-6 space-y-6">
              <div className="rounded-lg border bg-card p-4">
                <label className="mb-2 block text-sm font-medium">Editar producto existente</label>
                <Select
                  value={editingId || ''}
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      resetForm();
                      return;
                    }
                    const selected = products.find((product) => product.id === value);
                    if (selected) loadProduct(selected);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto o crear nuevo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">+ Crear nuevo producto</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <BulkProductImporter onCompleted={fetchData} />
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-bebas">Información del Producto</h2>
                <div className="space-y-4">
                  <div>
                    <Input placeholder="Nombre del producto *" value={name} onChange={(e) => setName(e.target.value)} />
                    {name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Slug: <code className="rounded bg-muted px-1">{slug}</code>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input placeholder="Precio COP *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                    <Input placeholder="Precio oferta COP (opcional)" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input placeholder="SKU / Referencia (opcional)" value={sku} onChange={(e) => setSku(e.target.value)} />
                    <Select value={category || '__auto__'} onValueChange={(value) => setCategory(value === '__auto__' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Categoría opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__auto__">Asignación automática</SelectItem>
                        {FIXED_PARENT_CATEGORIES.map((option) => (
                          <SelectItem key={option.slug} value={option.name}>{option.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Estado del producto</Label>
                    <RadioGroup value={condition} onValueChange={setCondition} className="flex gap-4">
                      {['Nuevo', 'Usado', 'Reacondicionado'].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`cond-${option}`} />
                          <Label htmlFor={`cond-${option}`} className="text-sm">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Garantía</Label>
                    <Select value={warranty} onValueChange={setWarranty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WARRANTY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-bebas">Imágenes (mín 1, máx 5)</h2>
                <div className="mb-4 flex flex-wrap gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      <ImagePreview url={url} label={`Imagen ${index + 1} ${name || 'producto'} | AnnovaSoft`} />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {imageUrls.length < 5 && (
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div>
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage || processingRemoteImage}>
                        {uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Subir archivo
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple className="hidden" onChange={handleFileUpload} />
                    </div>
                    <div className="flex flex-1 gap-2">
                      <Input placeholder="URL de imagen" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} />
                      <Button type="button" variant="outline" onClick={addImageUrl} disabled={processingRemoteImage || uploadingImage}>
                        {processingRemoteImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">Las URLs externas se descargan y se guardan automáticamente con URL propia del almacenamiento del sitio.</p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bebas">Contenido Generado por IA</h2>
                    <p className="text-xs text-muted-foreground">La IA genera descripción, SEO, specs, categoría, marca y reseñas.</p>
                  </div>
                  <Button type="button" onClick={handleGenerateAI} disabled={generatingAI || !name}>
                    {generatingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {generatingAI ? 'Generando...' : 'Generar todo con IA'}
                  </Button>
                </div>

                <div className="mb-4">
                  <Label className="mb-2 block text-sm font-medium">Información adicional para la IA (opcional)</Label>
                  <Textarea value={aiNotes} onChange={(e) => setAiNotes(e.target.value)} placeholder="Pega specs del fabricante, características especiales, casos de uso..." />
                </div>

                <div className="mb-4 flex flex-wrap gap-3">
                  <Badge variant="secondary">Categoría: {category || 'Automática'}</Badge>
                  {brand && <Badge variant="secondary">Marca: {brand}</Badge>}
                </div>

                {shortDesc && (
                  <div className="mb-4">
                    <Label className="text-xs font-medium text-muted-foreground">Descripción corta</Label>
                    <p className="mt-1 rounded bg-muted p-2 text-sm">{shortDesc}</p>
                  </div>
                )}

                {metaTitle && (
                  <div className="mb-4">
                    <Label className="text-xs font-medium text-muted-foreground">Meta título</Label>
                    <p className="mt-1 rounded bg-muted p-2 text-sm">{metaTitle}</p>
                  </div>
                )}

                {metaDesc && (
                  <div className="mb-4">
                    <Label className="text-xs font-medium text-muted-foreground">Meta descripción</Label>
                    <p className="mt-1 rounded bg-muted p-2 text-sm">{metaDesc}</p>
                  </div>
                )}

                {specsText && (
                  <div className="mb-4">
                    <Label className="text-xs font-medium text-muted-foreground">Especificaciones</Label>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-2 text-xs">{specsText}</pre>
                  </div>
                )}

                {description && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Ver descripción HTML generada</summary>
                    <div className="product-description prose prose-sm mt-2 max-w-none rounded border p-4" dangerouslySetInnerHTML={{ __html: description }} />
                  </details>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving} className="flex-1 py-3 text-lg">
                  {saving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar edición
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-12">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bebas">
                  Productos en <span className="text-primary">Base de Datos</span>
                </h2>
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar por nombre..." className="pl-9" />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No hay productos aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-sm font-medium">{product.name}</TableCell>
                          <TableCell className="text-sm">{product.category || '-'}</TableCell>
                          <TableCell className="text-sm">{product.brand || '-'}</TableCell>
                          <TableCell className="text-sm">{formatPrice(Number(product.price))}</TableCell>
                          <TableCell className="text-sm">{product.stock ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant={product.active ? 'default' : 'secondary'}>{product.active ? 'Activo' : 'Inactivo'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleToggleActive(product)} title={product.active ? 'Desactivar' : 'Activar'}>
                                {product.active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => loadProduct(product)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <a href={`/producto/${product.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="ghost" title="Ver producto">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </a>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(product)} title="Eliminar" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blog">
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <div className="space-y-4 rounded-lg border bg-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bebas">Generador de Artículos</h2>
                  <Button variant="ghost" onClick={resetBlogForm}>
                    Nuevo
                  </Button>
                </div>
                <Input placeholder="Tema del artículo" value={blogTopic} onChange={(e) => setBlogTopic(e.target.value)} />
                <Input placeholder="Palabras clave SEO" value={blogKeywords} onChange={(e) => setBlogKeywords(e.target.value)} />
                <Select value={blogIndustry} onValueChange={setBlogIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Industria/público" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Tecnología empresarial', 'E-commerce', 'Salud', 'Educación', 'Construcción', 'Retail', 'General'].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Notas adicionales" value={blogNotes} onChange={(e) => setBlogNotes(e.target.value)} />
                <Select value={blogType} onValueChange={setBlogType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BLOG_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={generateBlog} disabled={generatingBlog} className="w-full">
                  {generatingBlog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {generatingBlog ? 'Generando...' : 'Generar artículo con IA'}
                </Button>

                <div className="border-t pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-medium">Posts guardados</h3>
                    <div className="relative w-full max-w-[180px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={blogSearch} onChange={(e) => setBlogSearch(e.target.value)} placeholder="Buscar..." className="h-9 pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredBlogPosts.slice(0, 8).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => loadBlogPost(post)}
                        className="block w-full rounded border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        type="button"
                      >
                        <div className="font-medium">{post.title}</div>
                        <div className="text-xs text-muted-foreground">{post.active ? 'Publicado' : 'Borrador'} · {post.slug}</div>
                      </button>
                    ))}
                    {filteredBlogPosts.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay posts propios guardados.</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={blogMetaTitle} onChange={(e) => setBlogMetaTitle(e.target.value)} placeholder="Meta title" />
                  <Input value={blogMetaDescription} onChange={(e) => setBlogMetaDescription(e.target.value)} placeholder="Meta description" />
                  <Input value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} placeholder="Slug" />
                </div>
                <div className="mt-3 space-y-3">
                  <Textarea value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} placeholder="Excerpt" />
                  {blogCoverPrompt && <p className="text-xs text-muted-foreground">Prompt de portada: {blogCoverPrompt}</p>}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <div className="aspect-[16/9] w-full">
                      <ImagePreview url={blogCoverImage} label="Portada del artículo" />
                    </div>
                  </div>
                  <div className="min-h-[320px] rounded-lg border bg-background p-4">
                    {blogHtml ? (
                      <div className="blog-content" dangerouslySetInnerHTML={{ __html: blogHtml }} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Aquí verás el preview del artículo generado.</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => saveBlog(false)} disabled={savingBlog || !blogHtml}>
                    {savingBlog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Guardar como borrador
                  </Button>
                  <Button onClick={() => saveBlog(true)} disabled={savingBlog || !blogHtml}>
                    {savingBlog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Publicar en el blog
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(editingBlog)} onOpenChange={(open) => !open && setEditingBlog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artículo cargado para edición</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Puedes modificar meta, slug, contenido y volver a guardar o publicar.</p>
        </DialogContent>
      </Dialog>
    </main>
  );
}