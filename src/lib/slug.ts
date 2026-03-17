const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'para', 'por', 'con', 'en', 'y', 'o', 'a', 'al']);

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w))
    .join('-')
    .slice(0, 30)
    .replace(/-+$/, ''); // trim trailing hyphens
}
