import { isObject, type JsonObject } from '@/api/json';

export interface IdentityProfile {
  subject: string;
  name: string;
  email: string;
  expiresAt: number;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** base64url -> UTF-8 string, without depending on atob being present. */
export function decodeBase64Url(input: string): string {
  const value = input.replace(/-/g, '+').replace(/_/g, '/');
  let bits = 0;
  let bitCount = 0;
  const bytes: number[] = [];
  for (const char of value) {
    if (char === '=') break;
    const index = B64.indexOf(char);
    if (index < 0) throw new Error('invalid base64');
    bits = (bits * 64 + index) % 1048576;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push(Math.floor(bits / 2 ** bitCount) % 256);
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += '%' + bytes[i].toString(16).padStart(2, '0');
  }
  try {
    return decodeURIComponent(out);
  } catch {
    return '';
  }
}

/** Reads claims from an ID token for display only. Returns {} if malformed. */
export function idTokenClaims(token: string | null | undefined): JsonObject {
  const parts = token?.split('.');
  if (!parts || parts.length !== 3) return {};
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(parts[1]));
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function claim(claims: JsonObject, key: string): string | undefined {
  const value = claims[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function profileFromIdToken(token: string | null | undefined, expiresAt: number): IdentityProfile | null {
  const claims = idTokenClaims(token);
  const subject = claim(claims, 'sub');
  if (!subject) return null;
  return {
    subject,
    name: claim(claims, 'name') ?? claim(claims, 'preferred_username') ?? 'Ace ID member',
    email: claim(claims, 'email') ?? '',
    expiresAt,
  };
}

export interface IdTokenExpectation {
  issuer: string;
  clientId: string;
  now: number;
}

/**
 * Checks the OIDC ID-token claims the client must enforce on a token it has
 * just received from the token endpoint (OIDC Core 3.1.3.7): issuer, audience,
 * expiry and subject. Returns a reason string on failure, or null when valid.
 * Signature verification against the JWKS is not performed here (see README).
 */
export function idTokenClaimProblem(token: string | null | undefined, expect: IdTokenExpectation): string | null {
  const parts = token?.split('.');
  if (!parts || parts.length !== 3) return 'malformed';
  const claims = idTokenClaims(token);
  if (claim(claims, 'sub') === undefined) return 'missing sub';
  const normalize = (value: string) => value.replace(/\/+$/, '');
  if (claim(claims, 'iss') === undefined || normalize(claims.iss as string) !== normalize(expect.issuer)) return 'issuer mismatch';
  const aud = claims.aud;
  const audiences = typeof aud === 'string' ? [aud] : Array.isArray(aud) ? aud.filter((v): v is string => typeof v === 'string') : [];
  if (!expect.clientId || !audiences.includes(expect.clientId)) return 'audience mismatch';
  if (Array.isArray(aud) && aud.length > 1 && claims.azp !== expect.clientId) return 'azp mismatch';
  const exp = claims.exp;
  if (typeof exp !== 'number' || exp * 1000 <= expect.now) return 'expired';
  return null;
}
