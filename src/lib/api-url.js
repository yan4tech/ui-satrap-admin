/**
 * Normalize same-origin API paths for Next.js rewrites (trailingSlash strips `/` on proxy).
 * Collection endpoints must be requested without a trailing slash before `?`.
 */
export function normalizeApiPath(url) {
  const raw = String(url ?? '');
  if (!raw.startsWith('/api/')) {
    return raw;
  }

  const qIndex = raw.indexOf('?');
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const query = qIndex === -1 ? '' : raw.slice(qIndex);
  const normalizedPath = path.replace(/\/+$/, '') || path;

  return `${normalizedPath}${query}`;
}

/** Join optional origin/base with a path and normalize `/api/*` URLs. */
export function buildApiUrl(base, path) {
  const pathPart = String(path ?? '');
  if (pathPart.startsWith('http://') || pathPart.startsWith('https://')) {
    return normalizeApiPath(pathPart);
  }

  const basePart = String(base ?? '').replace(/\/+$/, '');
  const joined = `${basePart}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`;
  return normalizeApiPath(joined);
}
