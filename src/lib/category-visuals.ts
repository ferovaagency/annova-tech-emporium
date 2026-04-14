import computadoresImage from '@/assets/category-computadores.jpg';
import licenciamientoImage from '@/assets/category-licenciamiento.jpg';
import servidoresImage from '@/assets/category-servidores.png';
import workstationsImage from '@/assets/category-workstations.jpg';

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normalizeCategorySlug(value: string) {
  return normalizeText(value).replace(/\s+/g, '-');
}

/** Returns a manual image based on slug keywords — fallback only */
export function getManualCategoryImage(input?: string | null) {
  const slug = normalizeCategorySlug(input || '');
  if (slug.includes('workstation')) return workstationsImage;
  if (slug.includes('licenciamiento')) return licenciamientoImage;
  if (slug.includes('servidores') || slug.includes('servidor')) return servidoresImage;
  if (slug.includes('computadores') || slug.includes('portatil') || slug.includes('escritorio') || slug.includes('todo-en-uno')) return computadoresImage;
  return '/placeholder.svg';
}
