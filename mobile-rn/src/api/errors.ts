// User-facing error copy. Mirrors mobile/.../data/ApiException.kt and
// auth/AuthRepository.kt so both clients explain the same failures the same way.

export class ApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const API_MESSAGES = {
  SESSION_EXPIRED: 'Your session expired. Sign in again.',
  UNREACHABLE: 'Could not reach Ace ID. Check your connection and try again.',
  INVALID_ORIGIN: 'The configured API origin is invalid.',
} as const;

export function apiMessageFor(code: string | undefined, description: string | undefined, status: number): string {
  switch (code) {
    case 'not_authenticated':
    case 'authentication_required':
    case 'invalid_token':
      return API_MESSAGES.SESSION_EXPIRED;
    case 'username_change_cooldown':
      return 'Your username cannot be changed yet.';
    case 'invalid_redirect_uri':
    case 'invalid_origin':
      return 'This request was rejected for security reasons. Try again from the app.';
    default:
      if (description && description.trim()) return description;
      if (code) return code.replace(/_/g, ' ');
      return `Request failed (${status}).`;
  }
}

export const NOT_CONFIGURED_MESSAGE =
  'Native sign-in needs a registered Ace ID public mobile client ID. Contact the app administrator to configure native sign-in.';

export function authMessageFor(code: string, details?: string): string {
  const normalized = code.toLowerCase();
  if (normalized.includes('cancel')) return 'Sign-in was cancelled. Tap Continue with Ace ID to try again.';
  if (normalized.includes('network') || normalized.includes('connection') || normalized.includes('fetch')) {
    return 'Could not reach the identity provider. Check your connection and try again.';
  }
  if (normalized.includes('redirect') || normalized.includes('callback')) {
    return 'The sign-in callback was rejected. Check the registered mobile redirect URI.';
  }
  if (normalized.includes('client') || normalized.includes('authorize') || normalized.includes('token')) {
    return `The identity provider rejected the mobile sign-in (${code}). Verify the registered mobile client ID and redirect URI.`;
  }
  const safe = (details ?? '').replace(/[\r\n]+/g, ' ').trim();
  if (!safe) return `Sign-in failed (${code}). Verify the mobile OAuth client configuration.`;
  return `Sign-in failed (${code}): ${safe.slice(0, 180)}`;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
