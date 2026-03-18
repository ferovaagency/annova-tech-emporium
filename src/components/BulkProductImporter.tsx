import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/slug';
import { getParentCategory, isExternalImageUrl } from '@/lib/catalog';
import { inferCategoryForBulkProduct, parseBulkProducts } from '@/lib/catalog-import';

interface BulkProductImporterProps {
  onCompleted: () => Promise<void> | void;
}

type ImportStatus = 'pending' | 'processing' | 'completed' | 'error';

interface ImportResult {
  rowNumber: number;
  name: string;
  category: string;
  status: ImportStatus;
  message: string;
}

const DEFAULT_WARRANTY = '12 meses con fabricante';
const DEFAULT_CONDITION = 'Nuevo';

async function uploadRemoteImage(url: string) {
  const { data, error } = await supabase.functions.invoke('media-tools', {
    body: {
      action: 'download_remote_image',
      url,
    },
  });

  if (error) throw error;
  if (!data?.publicUrl) throw new Error('No se recibió la URL final de la imagen');
  return data.publicUrl as string;
}

export default function BulkProductImporter({ onCompleted }: BulkProductImporterProps) {
  const { toast } = useToast();
  const [bulkInput, setBulkInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleProcessBulk = async () => {
    const rows = parseBulkProducts(bulkInput);

    if (rows.length === 0) {
      return toast({
        title: 'No hay productos para procesar',
        description: 'Usa una línea por producto: nombre, precio, marca, imagen, sku, descripción corta, notas',
        variant: 'destructive',
      });
    }

    setProcessing(true);
    setResults(rows.map((row) => ({
      rowNumber: row.rowNumber,
      name: row.name,
      category: inferCategoryForBulkProduct(row),
      status: 'pending',
      message: 'En cola',
    })));

    let completed = 0;
    let failed = 0;

    for (const row of rows) {
      setResults((prev) => prev.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: 'processing', message: 'Generando ficha y guardando...' } : item));

      try {
        const inferredCategory = inferCategoryForBulkProduct(row);
        const generated = await supabase.functions.invoke('generate-description', {
          body: {
            productName: row.name,
            price: row.price ?? null,
            condition: DEFAULT_CONDITION,
            warranty: DEFAULT_WARRANTY,
            additionalNotes: [row.brand, row.shortDescription, row.notes, `Categoría obligatoria: ${inferredCategory}`].filter(Boolean).join(' | '),
          },
        });

        if (generated.error) throw generated.error;

        const aiData = generated.data || {};
        const normalizedCategory = getParentCategory(aiData.category || inferredCategory, `${row.name} ${row.brand || ''} ${row.shortDescription || ''} ${row.notes || ''}`);

        let normalizedImages: string[] = [];
        if (row.imageUrl) {
          if (isExternalImageUrl(row.imageUrl)) {
            normalizedImages = [await uploadRemoteImage(row.imageUrl)];
          } else {
            normalizedImages = [row.imageUrl];
          }
        }

        const baseSlug = generateSlug(row.name);
        let finalSlug = baseSlug;
        let suffix = 1;
        while (true) {
          const candidate = suffix === 1 ? finalSlug : `${baseSlug}-${suffix}`;
          const { data: existing } = await supabase.from('products').select('id').eq('slug', candidate).maybeSingle();
          if (!existing) {
            finalSlug = candidate;
            break;
          }
          suffix += 1;
        }

        const payload = {
          name: row.name,
          slug: finalSlug,
          price: row.price ?? 0,
          sale_price: null,
          sku: row.sku || null,
          category: normalizedCategory,
          brand: row.brand || aiData.brand || null,
          condition: DEFAULT_CONDITION,
          warranty: DEFAULT_WARRANTY,
          short_description: row.shortDescription || aiData.short_description || null,
          description: aiData.description || row.notes || null,
          specs: aiData.specs || null,
          meta_title: aiData.meta_title || null,
          meta_description: aiData.meta_description || null,
          images: normalizedImages,
          reviews: Array.isArray(aiData.reviews) ? aiData.reviews : null,
          active: true,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;

        completed += 1;
        setResults((prev) => prev.map((item) => item.rowNumber === row.rowNumber ? { ...item, category: normalizedCategory, status: 'completed', message: 'Producto guardado en la base de datos' } : item));
      } catch (error: any) {
        failed += 1;
        setResults((prev) => prev.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: 'error', message: error?.message || 'No se pudo procesar' } : item));
      }
    }

    setProcessing(false);
    await onCompleted();
    toast({ title: 'Carga masiva finalizada', description: `${completed} completados · ${failed} con error` });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bebas">Carga masiva</h2>
          <p className="text-xs text-muted-foreground">Una línea por producto: nombre, precio, marca, imagen, sku, descripción corta, notas.</p>
        </div>
        <Badge variant="secondary">Categorías automáticas: Computadores · Licenciamiento · Servidores</Badge>
      </div>

      <Textarea
        value={bulkInput}
        onChange={(event) => setBulkInput(event.target.value)}
        placeholder="Laptop Dell Latitude 5440, 4200000, Dell, https://..., LAT-5440, Portátil empresarial de 14 pulgadas, Core i5 13th gen&#10;Windows 11 Pro Licencia, 980000, Microsoft, https://..., WIN11PRO, Licencia original, Para empresas"
        className="min-h-[180px]"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">El sistema genera la ficha completa por IA, clasifica automáticamente y guarda cada producto con su propio estado.</p>
        <Button onClick={handleProcessBulk} disabled={processing}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {processing ? 'Procesando carga masiva...' : 'Procesar y guardar'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-2 rounded-lg border bg-background p-4">
          {results.map((result) => (
            <div key={result.rowNumber} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">#{result.rowNumber} · {result.name}</p>
                <p className="text-xs text-muted-foreground">{result.category} · {result.message}</p>
              </div>
              <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'} className="gap-1">
                {result.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : result.status === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : <Loader2 className={`h-3.5 w-3.5 ${result.status === 'processing' ? 'animate-spin' : ''}`} />}
                {result.status === 'pending' ? 'Pendiente' : result.status === 'processing' ? 'Procesando' : result.status === 'completed' ? 'Completado' : 'Error'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
