import type { Category } from '@/data/products';
import computadoresImage from '@/assets/category-computadores.jpg';
import licenciamientoImage from '@/assets/category-licenciamiento.jpg';
import servidoresImage from '@/assets/category-servidores.png';
import workstationsImage from '@/assets/category-workstations.jpg';

const SERVER_KEYWORDS = [
  'server', 'servidor', 'rack', 'tower', 'xeon', 'datacenter', 'dl380', 'poweredge', 'proliant', 'nas', 'storage', 'raid', 'blade', 'switch', 'firewall', 'ups',
];
const LICENSE_KEYWORDS = [
  'licencia', 'licenciamiento', 'software', 'microsoft 365', 'office', 'windows', 'antivirus', 'subscription', 'suscripcion', 'adobe', 'autodesk', 'sql server', 'visual studio', 'project', 'visio',
];
const WORKSTATION_KEYWORDS = [
  'workstation', 'estacion de trabajo', 'estación de trabajo', 'cad', 'render', 'precision', 'thinkstation', 'zbook', 'z workstation', 'quadro', 'nvidia rtx', 'a2000', 'a4000', 'a5000',
];

const PARENT_META = {
  computadores: {
    name: 'Computadores',
    icon: '💻',
    description: 'Portátiles, desktops y estaciones de trabajo empresariales',
    image: computadoresImage,
  },
  licenciamiento: {
    name: 'Licenciamiento',
    icon: '💿',
    description: 'Licencias, suscripciones y software corporativo',
    image: licenciamientoImage,
  },
  servidores: {
    name: 'Servidores',
    icon: '🖥️',
    description: 'Servidores, datacenter e infraestructura empresarial',
    image: servidoresImage,
  },
  workstations: {
    name: 'Workstations',
    icon: '🖥️',
    description: 'Estaciones de trabajo de alto rendimiento para diseño, ingeniería y renderizado',
    image: workstationsImage,
  },
} as const;

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

export function getParentCategory(input?: string | null, context = ''): string {
  const text = normalizeText(`${input || ''} ${context}`);
  if (text.includes('workstation') || text.includes('workstations')) return 'Workstations';
  if (text.includes('licenciamiento')) return 'Licenciamiento';
  if (text.includes('servidores')) return 'Servidores';
  if (text.includes('computadores')) return 'Computadores';
  if (WORKSTATION_KEYWORDS.some((keyword) => text.includes(keyword))) return 'Workstations';
  if (SERVER_KEYWORDS.some((keyword) => text.includes(keyword))) return 'Servidores';
  if (LICENSE_KEYWORDS.some((keyword) => text.includes(keyword))) return 'Licenciamiento';
  return 'Computadores';
}

export function getParentCategorySlug(input?: string | null, context = '') {
  return normalizeCategorySlug(getParentCategory(input, context));
}

export function getManualCategoryImage(input?: string | null) {
  const slug = normalizeCategorySlug(input || '');
  if (slug.includes('workstation')) return workstationsImage;
  if (slug.includes('licenciamiento')) return licenciamientoImage;
  if (slug.includes('servidores')) return servidoresImage;
  if (slug.includes('computadores')) return computadoresImage;
  return '/placeholder.svg';
}

export function buildCategoryRecord(name: string): Category {
  const safeName = name.trim();
  const parentSlug = getParentCategorySlug(safeName) as keyof typeof PARENT_META;
  const parentMeta = PARENT_META[parentSlug];
  const isParent = normalizeCategorySlug(safeName) === parentSlug;

  return {
    name: safeName,
    slug: normalizeCategorySlug(safeName),
    icon: isParent ? parentMeta.icon : '📁',
    description: isParent ? parentMeta.description : `${safeName} dentro de ${parentMeta.name.toLowerCase()} para entornos empresariales.`,
    image: getManualCategoryImage(safeName),
  };
}

export const FIXED_PARENT_CATEGORIES: Category[] = ['Computadores', 'Licenciamiento', 'Servidores', 'Workstations'].map(buildCategoryRecord);

export const SUBCATEGORIES: Record<string, Category[]> = {
  servidores: [
    {
      name: 'Partes para servidores',
      slug: 'partes-para-servidores',
      icon: '🔧',
      description: 'Discos, RAM, fuentes y componentes para servidores',
      image: servidoresImage,
    },
  ],
};

export function buildDynamicCategories(names: string[]): Category[] {
  const uniqueNames = Array.from(new Set([
    ...FIXED_PARENT_CATEGORIES.map((category) => category.name),
    ...names.map((name) => name.trim()).filter(Boolean),
  ]));

  return uniqueNames
    .map(buildCategoryRecord)
    .sort((a, b) => {
      const aIsParent = FIXED_PARENT_CATEGORIES.some((category) => category.slug === a.slug);
      const bIsParent = FIXED_PARENT_CATEGORIES.some((category) => category.slug === b.slug);
      if (aIsParent && !bIsParent) return -1;
      if (!aIsParent && bIsParent) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
}
