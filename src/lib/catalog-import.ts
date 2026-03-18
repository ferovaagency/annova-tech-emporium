import { getParentCategory } from '@/lib/catalog';

export interface BulkProductInput {
  name: string;
  price?: number;
  brand?: string;
  imageUrl?: string;
  sku?: string;
  shortDescription?: string;
  notes?: string;
}

export interface BulkImportRow extends BulkProductInput {
  rowNumber: number;
}

export function parseBulkProducts(input: string): BulkImportRow[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.includes(';') ? line.split(';') : line.split(',');
      const [name = '', price = '', brand = '', imageUrl = '', sku = '', shortDescription = '', notes = ''] = parts.map((part) => part.trim());
      return {
        rowNumber: index + 1,
        name,
        price: price ? Number(String(price).replace(/[^\d.]/g, '')) : undefined,
        brand,
        imageUrl,
        sku,
        shortDescription,
        notes,
      } satisfies BulkImportRow;
    })
    .filter((row) => row.name);
}

export function inferCategoryForBulkProduct(row: BulkProductInput) {
  return getParentCategory('', `${row.name} ${row.brand || ''} ${row.shortDescription || ''} ${row.notes || ''}`);
}
