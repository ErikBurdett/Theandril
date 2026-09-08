/** Resolve a public-file URL at the request boundary, never inside approved
 * catalog data. Vite supplies the same base for its CSS and worker assets. */
export function publicAssetUrl(path: string, base = import.meta.env.BASE_URL): string {
  // Explicit remote URLs and browser-created blob/data URLs are already resolved.
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${path.replace(/^\/?(?:\.\/)?/, '')}`;
}
