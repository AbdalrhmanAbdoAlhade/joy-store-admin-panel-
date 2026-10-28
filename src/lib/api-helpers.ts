export function unwrapEnvelope(response: any): any {
  return response?.data?.data ?? response?.data ?? response;
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function ensureArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// Empty strings, null/undefined and the sentinel 'all' all mean "no filter".
// Sending them to the backend makes it filter by a value that does not exist.
export function cleanQueryParams(params?: Record<string, any> | null): Record<string, any> {
  const cleaned: Record<string, any> = {};
  if (!params) return cleaned;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === 'all') return;
      cleaned[key] = trimmed;
      return;
    }
    cleaned[key] = value;
  });

  return cleaned;
}

export function flattenTree<T extends Record<string, any>>(
  items: T[],
  childrenKey = 'children'
): T[] {
  const out: T[] = [];
  const walk = (nodes: any[], parentId: number | string | null = null) => {
    ensureArray(nodes).forEach((node) => {
      if (!node || typeof node !== 'object') return;
      const { [childrenKey]: children, ...rest } = node as Record<string, any>;
      out.push({ ...(rest as T), parent_id: (rest as any).parent_id ?? parentId });
      if (children) walk(children, (rest as any).id ?? null);
    });
  };
  walk(ensureArray(items));
  return out;
}

export function castByType(value: any, type?: string): any {
  switch (type) {
    case 'number':
    case 'integer':
      return toNumber(value);
    case 'boolean':
    case 'bool':
      return value === true || value === '1' || value === 1 || value === 'true';
    default:
      return value;
  }
}

export function localizedText(value: any, lang: 'ar' | 'en' = 'ar'): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return value[lang] ?? value.ar ?? value.en ?? '';
}

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v\d+\/?$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}/storage${clean.startsWith('/storage') ? clean.replace('/storage', '') : clean}`;
}
