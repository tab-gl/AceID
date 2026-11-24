/** True for https URLs, and for plain http only on loopback (local development). */
export function isLoopbackOrHttps(url: string): boolean {
  if (/^https:\/\//i.test(url)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(url);
}

export const normalizeIssuer = (value: string | undefined) => (value ?? '').replace(/\/+$/, '');
