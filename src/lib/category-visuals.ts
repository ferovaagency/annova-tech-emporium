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

const SERVER_KEYWORDS = [
  'server', 'servidor', 'rack', 'tower', 'xeon', 'datacenter', 'dl380', 'poweredge', 'proliant', 'nas', 'storage', 'raid', 'blade', 'switch', 'firewall', 'ups',
];
const LICENSE_KEYWORDS = [
  'licencia', 'licenciamiento', 'software', 'microsoft 365', 'office', 'windows', 'antivirus', 'subscription', 'suscripcion', 'adobe', 'autodesk', 'sql server',
];
const WORKSTATION_KEYWORDS = [
  'workstation', 'estacion de trabajo', 'estación de trabajo', 'cad', 'render', 'precision', 'thinkstation', 'zbook', 'quadro', 'nvidia rtx',
];

/** Keyword-based fallback to guess a parent category name when no DB match exists */
export function getParentCategory(input?: string | null, context = ''): string {
  const text = normalizeText(`${input || ''} ${context}`);
  if (text.includes('workstation') || WORKSTATION_KEYWORDS.some((k) => text.includes(k))) return 'Workstations';
  if (text.includes('licenciamiento') || LICENSE_KEYWORDS.some((k) => text.includes(k))) return 'Licenciamiento';
  if (text.includes('servidores') || SERVER_KEYWORDS.some((k) => text.includes(k))) return 'Servidores';
  return 'Computadores';
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
