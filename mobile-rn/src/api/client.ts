import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLoopbackOrHttps } from '@/auth/oidc';
import { AUTH_CONFIG } from '@/auth/config';
import { ApiError, API_MESSAGES, apiMessageFor } from './errors';
import { isObject, type JsonObject } from './json';

// Account API client. Reads are cached for offline use (ETag/304, 7-day
// expiry); mutations always hit the server and clear the cache. Bearer tokens
// are only ever sent to an HTTPS (or loopback) origin.

const CACHE_PREFIX = 'aceid.cache:';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 20_000;

interface CacheEntry {
  data: JsonObject;
  etag: string | null;
  savedAt: number;
}

/** Resolves an API path against the configured origin. Rejects unsafe origins. */
export function resolveApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  if (!isLoopbackOrHttps(base)) throw new ApiError(API_MESSAGES.INVALID_ORIGIN);
  // Origin only: no userinfo, query, fragment or path component.
  const withoutScheme = base.replace(/^https?:\/\//i, '');
  if (withoutScheme.includes('@') || /[/?#]/.test(withoutScheme)) {
    throw new ApiError(API_MESSAGES.INVALID_ORIGIN);
  }
  return base + path;
}

async function readCache(path: string): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + path);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!isObject(entry.data) || Date.now() - entry.savedAt > CACHE_MAX_AGE_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(path: string, data: JsonObject, etag: string | null) {
  const entry: CacheEntry = { data, etag, savedAt: Date.now() };
  await AsyncStorage.setItem(CACHE_PREFIX + path, JSON.stringify(entry)).catch(() => undefined);
}

export async function clearApiCache() {
  const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
  const own = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  if (own.length > 0) await AsyncStorage.multiRemove(own).catch(() => undefined);
}

function parseObject(payload: string): { value: JsonObject; isObject: boolean } {
  if (payload.trim() === '') return { value: {}, isObject: true };
  try {
    const parsed: unknown = JSON.parse(payload);
    return isObject(parsed) ? { value: parsed, isObject: true } : { value: {}, isObject: false };
  } catch {
    return { value: {}, isObject: false };
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: JsonObject;
}

/** The access-token source is injected so the client stays testable. */
export type TokenSource = () => Promise<string | null>;

export class AceIdApi {
  constructor(
    private readonly tokens: TokenSource,
    private readonly baseUrl: string = AUTH_CONFIG.apiBaseUrl,
  ) {}

  async request(path: string, options: RequestOptions = {}): Promise<JsonObject> {
    const method = options.method ?? 'GET';
    const isRead = method === 'GET';
    const cached = isRead ? await readCache(path) : null;

    let token: string | null;
    try {
      token = await this.tokens();
    } catch (error) {
      // Could not refresh (offline or provider down): fall back to the snapshot.
      if (cached) return cached.data;
      throw error;
    }
    if (!token) throw new ApiError(API_MESSAGES.SESSION_EXPIRED, 401, 'not_authenticated');

    const url = resolveApiUrl(this.baseUrl, path);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Cache-Control': isRead ? 'no-cache' : 'no-store',
    };
    if (isRead && cached?.etag) headers['If-None-Match'] = cached.etag;
    if (options.body) headers['Content-Type'] = 'application/json';

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller?.signal,
      });
    } catch {
      // Offline or a transient failure only; auth failures are never masked.
      if (cached) return cached.data;
      throw new ApiError(API_MESSAGES.UNREACHABLE);
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (isRead && response.status === 304 && cached) {
      await writeCache(path, cached.data, response.headers.get('ETag') ?? cached.etag);
      return cached.data;
    }

    const payload = await response.text().catch(() => '');
    const parsed = parseObject(payload);

    if (!response.ok) {
      const code = typeof parsed.value.error === 'string' && parsed.value.error ? parsed.value.error : undefined;
      const description =
        typeof parsed.value.error_description === 'string' ? parsed.value.error_description : undefined;
      // A server fault is exactly when a verified snapshot is still useful.
      if (cached && response.status >= 500) return cached.data;
      throw new ApiError(apiMessageFor(code, description, response.status), response.status, code);
    }

    if (isRead) {
      // Never overwrite a good snapshot with an empty or malformed 200 body.
      if (parsed.isObject && payload.trim() !== '') {
        await writeCache(path, parsed.value, response.headers.get('ETag'));
      } else if (cached) {
        return cached.data;
      }
    } else {
      await clearApiCache();
    }
    return parsed.value;
  }
}
