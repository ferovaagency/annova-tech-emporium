// TODO: Add authentication/authorization for admin access
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/products';
import { generateSlug } from '@/lib/slug';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}

export default function ProductGenerator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [stock, setStock] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Data
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // CSV
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const slug = generateSlug(name);

  const fetchData = useCallback(async () => {
    const [catRes, brandRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    if (catRes.data) setCategories(catRes.data as any);
    if (brandRes.data) setBrands(brandRes.data as any);
    if (prodRes.data) setProducts(prodRes.data as unknown as DBProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const parseSpecs = (text: string): Record<string, string> => {
    const specs: Record<string, string> = {};
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        specs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    });
    return specs;
  };

  const resetForm = () => {
    setEditingId(null);
    setName(''); setSku(''); setPrice(''); setSalePrice('');
    setCategory(''); setNewCategory(''); setBrand(''); setNewBrand('');
    setStock(''); setShortDesc(''); setSpecsText('');
    setDescription(''); setMetaTitle(''); setMetaDesc('');
    setImageUrls([]);
  };

  const loadProduct = (p: DBProduct) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku || '');
    setPrice(String(p.price));
    setSalePrice(p.sale_price ? String(p.sale_price) : '');
    setCategory(p.category || '');
    setBrand(p.brand || '');
    setStock(p.stock != null ? String(p.stock) : '');
    setShortDesc(p.short_description || '');
    setSpecsText(p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '');
    setDescription(p.description || '');
    setMetaTitle(p.meta_title || '');
    setMetaDesc(p.meta_description || '');
    setImageUrls(p.images || []);
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

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageUrls(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const handleGenerateAI = async () => {
    if (!name) { toast({ title: 'Ingresa el nombre del producto primero', variant: 'destructive' }); return; }
    setGeneratingAI(true);
    try {
      const specs = parseSpecs(specsText);
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { productName: name, brand: brand || newBrand, category: category || newCategory, specs, shortDescription: shortDesc },
      });
      if (error) throw error;
      if (data.description) setDescription(data.description);
      if (data.meta_title) setMetaTitle(data.meta_title);
      if (data.meta_description) setMetaDesc(data.meta_description);
      toast({ title: 'Descripción generada con IA' });
    } catch (err: any) {
      toast({ title: 'Error al generar descripción', description: err.message, variant: 'destructive' });
    }
    setGeneratingAI(false);
  };

  const handleSave = async () => {
    if (!name || !price) { toast({ title: 'Nombre y precio son requeridos', variant: 'destructive' }); return; }
    if (imageUrls.length === 0) { toast({ title: 'Agrega al menos una imagen', variant: 'destructive' }); return; }
    setSaving(true);

    // Ensure category exists
    const finalCategory = newCategory || category;
    if (newCategory) {
      const catSlug = generateSlug(newCategory);
      await supabase.from('categories').upsert({ name: newCategory, slug: catSlug }, { onConflict: 'name' });
    }
    // Ensure brand exists
    const finalBrand = newBrand || brand;
    if (newBrand) {
      await supabase.from('brands').upsert({ name: newBrand }, { onConflict: 'name' });
    }

    const productData = {
      name,
      slug,
      price: Number(price),
      sale_price: salePrice ? Number(salePrice) : null,
      sku: sku || null,
      category: finalCategory || null,
      brand: finalBrand || null,
      stock: stock ? Number(stock) : 0,
      short_description: shortDesc || null,
      description: description || null,
      specs: Object.keys(parseSpecs(specsText)).length > 0 ? parseSpecs(specsText) : null,
      meta_title: metaTitle || null,
      meta_description: metaDesc || null,
      images: imageUrls,
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
        description: `Ver en /producto/${slug}`,
      });
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  // CSV Upload
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setCsvProgress(0);

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());

    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      header.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowSlug = generateSlug(row.nombre || row.name || '');
      if (!rowSlug) continue;

      // Ensure category
      if (row.categoria || row.category) {
        const catName = row.categoria || row.category;
        await supabase.from('categories').upsert({ name: catName, slug: generateSlug(catName) }, { onConflict: 'name' });
      }
      // Ensure brand
      if (row.marca || row.brand) {
        await supabase.from('brands').upsert({ name: row.marca || row.brand }, { onConflict: 'name' });
      }

      const imgUrl = row.imagen_url || row.image_url || '';
      // Upload image from URL to storage
      let finalImageUrl = imgUrl;
      if (imgUrl) {
        try {
          const resp = await fetch(imgUrl);
          const blob = await resp.blob();
          const ext = imgUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const path = `csv-${Date.now()}-${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, blob);
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
            finalImageUrl = urlData.publicUrl;
          }
        } catch { /* keep original URL */ }
      }

      await supabase.from('products').insert({
        name: row.nombre || row.name || '',
        slug: rowSlug,
        price: Number(row.precio || row.price || 0),
        sku: row.sku || null,
        category: row.categoria || row.category || null,
        brand: row.marca || row.brand || null,
        stock: Number(row.stock || 0),
        images: finalImageUrl ? [finalImageUrl] : [],
        active: true,
      });

      setCsvProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    toast({ title: `${rows.length} productos importados` });
    setCsvUploading(false);
    fetchData();
    if (csvFileRef.current) csvFileRef.current.value = '';
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

        {/* Form */}
        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bebas mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input placeholder="Nombre del producto *" value={name} onChange={e => setName(e.target.value)} />
                {name && <p className="text-xs text-muted-foreground mt-1">Slug: <code className="bg-muted px-1 rounded">{slug}</code></p>}
              </div>
              <Input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
              <Input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} />
              <Input placeholder="Precio COP *" type="number" value={price} onChange={e => setPrice(e.target.value)} />
              <Input placeholder="Precio oferta COP" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} />

              {/* Category */}
              <div>
                <Select value={category} onValueChange={val => { setCategory(val); setNewCategory(''); }}>
                  <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="O crear nueva categoría" value={newCategory} onChange={e => { setNewCategory(e.target.value); setCategory(''); }} className="mt-2" />
              </div>

              {/* Brand */}
              <div>
                <Select value={brand} onValueChange={val => { setBrand(val); setNewBrand(''); }}>
                  <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
                  <SelectContent>
                    {brands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="O crear nueva marca" value={newBrand} onChange={e => { setNewBrand(e.target.value); setBrand(''); }} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bebas mb-4">Contenido</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Descripción corta ({shortDesc.length}/160)</label>
                <Input
                  placeholder="Máx 160 caracteres"
                  value={shortDesc}
                  onChange={e => e.target.value.length <= 160 && setShortDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Especificaciones (una por línea, formato "Clave: Valor")</label>
                <Textarea
                  placeholder={"Procesador: Intel Core i7-13700\nRAM: 16 GB DDR5\nAlmacenamiento: 512 GB SSD"}
                  value={specsText}
                  onChange={e => setSpecsText(e.target.value)}
                  rows={5}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Descripción HTML (larga)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                  >
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generar descripción con IA
                  </Button>
                </div>
                <Textarea
                  placeholder="HTML de la descripción larga..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={10}
                />
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
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
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

          {/* SEO */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-bebas mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Meta título ({metaTitle.length}/60)</label>
                <Input value={metaTitle} onChange={e => e.target.value.length <= 60 && setMetaTitle(e.target.value)} placeholder="Keyword | Annova Tech" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Meta descripción ({metaDesc.length}/155)</label>
                <Textarea value={metaDesc} onChange={e => e.target.value.length <= 155 && setMetaDesc(e.target.value)} placeholder="155 caracteres exactos" rows={2} />
              </div>
            </div>
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

          {/* CSV Upload */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-bebas text-lg mb-2">Carga Masiva CSV</h3>
            <p className="text-xs text-muted-foreground mb-3">Columnas: nombre, precio, imagen_url, sku, categoria, marca, stock</p>
            <div className="flex gap-3 items-center">
              <Button variant="outline" onClick={() => csvFileRef.current?.click()} disabled={csvUploading}>
                {csvUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {csvUploading ? `Importando... ${csvProgress}%` : 'Seleccionar CSV'}
              </Button>
              <input ref={csvFileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </div>
            {csvUploading && (
              <div className="mt-2 bg-background rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${csvProgress}%` }} />
              </div>
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
