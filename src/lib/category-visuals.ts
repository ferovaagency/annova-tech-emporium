import type { Category } from '@/data/products';

const SERVER_KEYWORDS = [
  'server', 'servidor', 'rack', 'tower', 'xeon', 'datacenter', 'dl380', 'poweredge', 'proliant', 'nas', 'storage', 'raid', 'blade', 'switch', 'firewall', 'ups',
];
const LICENSE_KEYWORDS = [
  'licencia', 'licenciamiento', 'software', 'microsoft 365', 'office', 'windows', 'antivirus', 'subscription', 'suscripcion', 'adobe', 'autodesk', 'sql server', 'visual studio', 'project', 'visio',
];

const PARENT_META = {
  computadores: {
    name: 'Computadores',
    icon: '💻',
    description: 'Portátiles, desktops y estaciones de trabajo empresariales',
    tones: ['hsl(206 56% 97%)', 'hsl(206 62% 90%)', 'hsl(206 52% 54%)'],
  },
  licenciamiento: {
    name: 'Licenciamiento',
    icon: '💿',
    description: 'Licencias, suscripciones y software corporativo',
    tones: ['hsl(140 40% 97%)', 'hsl(140 44% 90%)', 'hsl(149 55% 38%)'],
  },
  servidores: {
    name: 'Servidores',
    icon: '🖥️',
    description: 'Servidores, datacenter e infraestructura empresarial',
    tones: ['hsl(8 60% 97%)', 'hsl(8 68% 90%)', 'hsl(0 74% 45%)'],
  },
} as const;

function encodeSvg(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
  if (text.includes('licenciamiento')) return 'Licenciamiento';
  if (text.includes('servidores')) return 'Servidores';
  if (text.includes('computadores')) return 'Computadores';
  if (SERVER_KEYWORDS.some((keyword) => text.includes(keyword))) return 'Servidores';
  if (LICENSE_KEYWORDS.some((keyword) => text.includes(keyword))) return 'Licenciamiento';
  return 'Computadores';
}

export function getParentCategorySlug(input?: string | null, context = '') {
  return normalizeCategorySlug(getParentCategory(input, context));
}

function buildCategoryImage(name: string, parentSlug: keyof typeof PARENT_META) {
  const palette = PARENT_META[parentSlug];
  const label = name.toUpperCase();
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" fill="none">
    <rect width="1200" height="720" rx="36" fill="${palette.tones[0]}"/>
    <rect x="56" y="56" width="1088" height="608" rx="28" fill="${palette.tones[1]}"/>
    <circle cx="1010" cy="162" r="124" fill="${palette.tones[0]}"/>
    <circle cx="944" cy="548" r="168" fill="${palette.tones[0]}"/>
    <rect x="116" y="140" width="190" height="44" rx="22" fill="white" fill-opacity="0.92"/>
    <text x="211" y="168" text-anchor="middle" fill="${palette.tones[2]}" font-size="22" font-family="Arial, sans-serif" font-weight="700">ANNOVASOFT</text>
    <text x="116" y="292" fill="${palette.tones[2]}" font-size="64" font-family="Arial, sans-serif" font-weight="800">${label}</text>
    <text x="116" y="346" fill="hsl(215 20% 24%)" font-size="28" font-family="Arial, sans-serif" font-weight="500">Soluciones tecnológicas empresariales</text>
    <rect x="116" y="412" width="312" height="132" rx="26" fill="white" fill-opacity="0.78"/>
    <text x="156" y="474" fill="hsl(215 20% 24%)" font-size="28" font-family="Arial, sans-serif" font-weight="700">${palette.name}</text>
    <text x="156" y="518" fill="hsl(215 16% 38%)" font-size="22" font-family="Arial, sans-serif">Catálogo corporativo</text>
  </svg>`;

  return encodeSvg(svg);
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
    image: buildCategoryImage(safeName, parentSlug),
  };
}

export const FIXED_PARENT_CATEGORIES: Category[] = ['Computadores', 'Licenciamiento', 'Servidores'].map(buildCategoryRecord);

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
