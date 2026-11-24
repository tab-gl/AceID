// Build-time configuration. This app is a PUBLIC OIDC client: it holds an
// issuer, an API origin, a client ID and a redirect URI, and nothing secret.
// Never add a client secret or backend credential here.
//
// Set in .env (untracked) or the environment before `expo start` / `expo export`:
//   EXPO_PUBLIC_ACEID_ISSUER          default https://identity.ace-base.cc
//   EXPO_PUBLIC_ACEID_API_BASE_URL    default: the issuer
//   EXPO_PUBLIC_ACEID_CLIENT_ID       the registered PUBLIC client ID (required to sign in)

const trimSlash = (value: string) => value.trim().replace(/\/+$/, '');

const issuer = trimSlash(process.env.EXPO_PUBLIC_ACEID_ISSUER || 'https://identity.ace-base.cc');

export const AUTH_CONFIG = {
  issuer,
  apiBaseUrl: trimSlash(process.env.EXPO_PUBLIC_ACEID_API_BASE_URL || issuer),
  clientId: (process.env.EXPO_PUBLIC_ACEID_CLIENT_ID || '').trim(),
  // Must match the registered mobile redirect URI (see app.json scheme).
  redirectUri: 'app.tab.aid:/oauth2redirect',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
} as const;

/** Opens a hosted page (legal, or a security control the app does not implement natively). */
export function webUrl(path: string): string {
  return `${AUTH_CONFIG.issuer}${path}`;
}
