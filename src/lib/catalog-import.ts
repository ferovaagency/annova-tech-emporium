import * as XLSX from 'xlsx';
import { getParentCategory } from '@/lib/catalog';

export interface BulkProductInput {
  name: string;
  price?: number;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  shortDescription?: string;
  notes?: string;
}

export interface BulkImportRow extends BulkProductInput {
  rowNumber: number;
}

function normalizeHeader(value: string) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function toNumber(value: unknown) {
  const normalized = String(value ?? '').replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pickValue(record: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const entry = Object.entries(record).find(([key]) => normalizedAliases.includes(normalizeHeader(key)));
  return entry?.[1];
}

function mapBulkRecord(record: Record<string, unknown>, rowNumber: number): BulkImportRow | null {
  const name = String(pickValue(record, ['name', 'nombre', 'producto', 'titulo']) || '').trim();
  if (!name) return null;

  const description = String(pickValue(record, ['description', 'descripcion', 'detalle']) || '').trim();
  const shortDescription = String(pickValue(record, ['short_description', 'descripcion_corta', 'descripcioncorta', 'resumen']) || description).trim();

  return {
    rowNumber,
    name,
    description,
    shortDescription,
    price: toNumber(pickValue(record, ['price', 'precio', 'valor'])),
    brand: String(pickValue(record, ['brand', 'marca', 'fabricante']) || '').trim() || undefined,
    category: String(pickValue(record, ['category', 'categoria']) || '').trim() || undefined,
    imageUrl: String(pickValue(record, ['image', 'imagen', 'image_url', 'imageurl', 'url_imagen', 'urlimagen']) || '').trim() || undefined,
    sku: String(pickValue(record, ['sku', 'referencia', 'codigo', 'code']) || '').trim() || undefined,
    notes: String(pickValue(record, ['notes', 'notas', 'observaciones']) || '').trim() || undefined,
  };
}

export async function parseBulkImportFile(file: File): Promise<BulkImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], {
    defval: '',
    raw: false,
  });

  return rows
    .map((row, index) => mapBulkRecord(row, index + 2))
    .filter((row): row is BulkImportRow => Boolean(row));
}

export function inferCategoryForBulkProduct(row: BulkProductInput) {
  return getParentCategory(row.category || '', `${row.name} ${row.brand || ''} ${row.shortDescription || row.description || ''} ${row.notes || ''}`);
}
