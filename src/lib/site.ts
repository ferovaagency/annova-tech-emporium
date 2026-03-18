export const SITE_URL = 'https://annovasoft.com';

export function buildSiteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
