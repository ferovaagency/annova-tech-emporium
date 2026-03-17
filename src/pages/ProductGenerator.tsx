// TODO: Add authentication/authorization for admin access
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/products';
import { generateSlug } from '@/lib/slug';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Sparkles, Eye, Pencil, Plus } from 'lucide-react';

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

const WARRANTY_OPTIONS = [
  "6 meses con fabricante",
  "12 meses con fabricante",
  "24 meses con fabricante",
  "6 meses con Annova Soft",
  "12 meses con Annova Soft",
  "Sin garantía",
];

export default function ProductGenerator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state - simplified
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [sku, setSku] = useState('');
  const [condition, setCondition] = useState('Nuevo');
  const [warranty, setWarranty] = useState('12 meses con fabricante');

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // AI-generated fields (read-only after generation)
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [reviews, setReviews] = useState<Array<{ author: string; role: string; text: string; rating: number }>>([]);

  // Data
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const slug = generateSlug(name);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data as unknown as DBProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setEditingId(null);
    setName(''); setPrice(''); setSalePrice(''); setSku('');
    setCondition('Nuevo'); setWarranty('12 meses con fabricante');
    setShortDesc(''); setDescription(''); setSpecsText('');
    setCategory(''); setBrand('');
    setMetaTitle(''); setMetaDesc('');
    setImageUrls([]); setReviews([]);
  };

  const loadProduct = (p: DBProduct) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setSalePrice(p.sale_price ? String(p.sale_price) : '');
    setCondition(p.condition || 'Nuevo');
    setWarranty(p.warranty || '12 meses con fabricante');
    setShortDesc(p.short_description || '');
    setDescription(p.description || '');
    setSpecsText(p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '');
    setCategory(p.category || '');
    setBrand(p.brand || '');
    setMetaTitle(p.meta_title || '');
    setMetaDesc(p.meta_description || '');
    setImageUrls(p.images || []);
    setReviews(p.reviews || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadingImage(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        setImageUrls(prev => [...prev, urlData.publicUrl]);
      }
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadAndUploadImage = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(imageUrl)}`);
      if (!response.ok) throw new Error('No se pudo descargar la imagen');
      const blob = await response.blob();
      const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const ext = validExtensions.includes(extension.toLowerCase()) ? extension.toLowerCase() : 'jpg';
      const filename = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(filename, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error descargando imagen:', error);
      return imageUrl;
    }
  };

  const addImageUrl = async () => {
    if (imageUrlInput.trim()) {
      setUploadingImage(true);
      const uploaded = await downloadAndUploadImage(imageUrlInput.trim());
      setImageUrls(prev => [...prev, uploaded]);
      setImageUrlInput('');
      setUploadingImage(false);
    }
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const parseSpecs = (text: string): Record<string, string> => {
    const specs: Record<string, string> = {};
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) specs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    return specs;
  };

  const handleGenerateAI = async () => {
    if (!name) { toast({ title: 'Ingresa el nombre del producto primero', variant: 'destructive' }); return; }
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          productName: name,
          price: price ? Number(price) : null,
          condition,
          warranty,
        },
      });
      if (error) throw error;
      if (data.description) setDescription(data.description);
      if (data.meta_title) setMetaTitle(data.meta_title);
      if (data.meta_description) setMetaDesc(data.meta_description);
      if (data.short_description) setShortDesc(data.short_description);
      if (data.category) setCategory(data.category);
      if (data.brand) setBrand(data.brand);
      if (data.specs) {
        const specsObj = data.specs as Record<string, string>;
        setSpecsText(Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`).join('\n'));
      }
      if (data.reviews && Array.isArray(data.reviews)) setReviews(data.reviews);
      toast({ title: 'Contenido generado con IA exitosamente' });
    } catch (err: any) {
      toast({ title: 'Error al generar contenido', description: err.message, variant: 'destructive' });
    }
    setGeneratingAI(false);
  };

  const handleSave = async () => {
    if (!name || !price) { toast({ title: 'Nombre y precio son requeridos', variant: 'destructive' }); return; }
    if (imageUrls.length === 0) { toast({ title: 'Agrega al menos una imagen', variant: 'destructive' }); return; }
    setSaving(true);

    // Anti-duplicate slug check
    let finalSlug = slug;
    if (!editingId) {
      let suffix = 1;
      let slugExists = true;
      while (slugExists) {
        const checkSlug = suffix === 1 ? finalSlug : `${finalSlug}-${suffix}`;
        const { data } = await supabase.from('products').select('id').eq('slug', checkSlug).single();
        if (!data) {
          finalSlug = checkSlug;
          slugExists = false;
        } else {
          suffix++;
        }
      }
    }

    // Ensure category exists
    if (category) {
      await supabase.from('categories').upsert({ name: category, slug: generateSlug(category) }, { onConflict: 'name' });
    }
    if (brand) {
      await supabase.from('brands').upsert({ name: brand }, { onConflict: 'name' });
    }

    const productData = {
      name,
      slug: finalSlug,
      price: Number(price),
      sale_price: salePrice ? Number(salePrice) : null,
      category: category || null,
      brand: brand || null,
      condition,
      warranty,
      short_description: shortDesc || null,
      description: description || null,
      specs: Object.keys(parseSpecs(specsText)).length > 0 ? parseSpecs(specsText) : null,
      meta_title: metaTitle || null,
      meta_description: metaDesc || null,
      images: imageUrls,
      reviews: reviews.length > 0 ? reviews : null,
      active: true,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('products').update(productData).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('products').insert(productData));
    }

    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: editingId ? 'Producto actualizado' : 'Producto creado',
        description: (
          <a href={`/producto/${finalSlug}`} className="text-primary underline">
            Ver en /producto/{finalSlug}
          </a>
        ) as any,
      });
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bebas mb-8">Generador de <span className="text-primary">Fichas de Producto</span></h1>

        {/* Product selector */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <label className="text-sm font-medium mb-2 block">Editar producto existente</label>
          <Select value={editingId || ''} onValueChange={(val) => {
            if (val === '__new__') { resetForm(); return; }
            const p = products.find(pr => pr.id === val);
            if (p) loadProduct(p);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar producto o crear nuevo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__new__">+ Crear nuevo producto</SelectItem>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Simplified Form */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bebas mb-4">Información del Producto</h2>
            <div className="space-y-4">
              <div>
                <Input placeholder="Nombre del producto *" value={name} onChange={e => setName(e.target.value)} />
                {name && <p className="text-xs text-muted-foreground mt-1">Slug: <code className="bg-muted px-1 rounded">{slug}</code></p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Precio COP *" type="number" value={price} onChange={e => setPrice(e.target.value)} />
                <Input placeholder="Precio oferta COP (opcional)" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
              </div>

              {/* Condition */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Estado del producto</Label>
                <RadioGroup value={condition} onValueChange={setCondition} className="flex gap-4">
                  {['Nuevo', 'Usado', 'Reacondicionado'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`cond-${opt}`} />
                      <Label htmlFor={`cond-${opt}`} className="text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Warranty */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Garantía</Label>
                <Select value={warranty} onValueChange={setWarranty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WARRANTY_OPTIONS.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bebas mb-4">Imágenes (mín 1, máx 5)</h2>
            <div className="flex gap-3 flex-wrap mb-4">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {imageUrls.length < 5 && (
              <div className="flex gap-3 items-end">
                <div>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Subir archivo
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileUpload} />
                </div>
                <div className="flex gap-2 flex-1">
                  <Input placeholder="URL de imagen" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} />
                  <Button type="button" variant="outline" onClick={addImageUrl}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>

          {/* AI Generation */}
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bebas">Contenido Generado por IA</h2>
              <Button
                type="button"
                onClick={handleGenerateAI}
                disabled={generatingAI || !name}
                className="bg-primary text-primary-foreground"
              >
                {generatingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {generatingAI ? 'Generando...' : 'Generar todo con IA'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">La IA genera automáticamente: descripción corta, descripción larga HTML, specs, categoría, marca, meta tags y 3 reseñas.</p>

            {(category || brand) && (
              <div className="flex gap-3 mb-4">
                {category && <Badge variant="secondary">Categoría: {category}</Badge>}
                {brand && <Badge variant="secondary">Marca: {brand}</Badge>}
              </div>
            )}

            {shortDesc && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-muted-foreground">Descripción corta ({shortDesc.length}/160)</Label>
                <p className="text-sm bg-muted rounded p-2 mt-1">{shortDesc}</p>
              </div>
            )}

            {metaTitle && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-muted-foreground">Meta título ({metaTitle.length}/60)</Label>
                <p className="text-sm bg-muted rounded p-2 mt-1">{metaTitle}</p>
              </div>
            )}

            {metaDesc && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-muted-foreground">Meta descripción ({metaDesc.length}/160)</Label>
                <p className="text-sm bg-muted rounded p-2 mt-1">{metaDesc}</p>
              </div>
            )}

            {specsText && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-muted-foreground">Especificaciones</Label>
                <pre className="text-xs bg-muted rounded p-2 mt-1 whitespace-pre-wrap">{specsText}</pre>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-muted-foreground">Reseñas generadas ({reviews.length})</Label>
                <div className="space-y-2 mt-1">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-muted rounded p-2 text-xs">
                      <p className="font-medium">{r.author} — {r.role}</p>
                      <p className="text-muted-foreground">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <details className="mb-4">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer">Ver descripción HTML generada</summary>
                <div className="mt-2 prose prose-sm max-w-none product-description border rounded p-4" dangerouslySetInnerHTML={{ __html: description }} />
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-primary-foreground h-auto py-3 text-lg">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Cancelar edición</Button>
            )}
          </div>
        </div>

        {/* Products list */}
        <div className="mt-12">
          <h2 className="text-2xl font-bebas mb-4">Productos en <span className="text-primary">Base de Datos</span></h2>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay productos aún.</p>
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
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm">{p.category || '-'}</TableCell>
                      <TableCell className="text-sm">{p.brand || '-'}</TableCell>
                      <TableCell className="text-sm">{formatPrice(Number(p.price))}</TableCell>
                      <TableCell className="text-sm">{p.stock ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant={p.active ? 'default' : 'secondary'}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => loadProduct(p)}>
                            <Pencil className="w-3 h-3 mr-1" /> Editar
                          </Button>
                          <a href={`/producto/${p.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" /> Ver
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
