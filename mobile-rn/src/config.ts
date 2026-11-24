// Build-time configuration. This app is a PUBLIC OIDC client: it holds an
// issuer, an API origin, a client ID and a redirect URI, and nothing secret.
// Never add a client secret or backend credential here.
//
// Bare React Native has no .env loader, so these values are plain constants.
// Set CLIENT_ID to the registered PUBLIC mobile client before building. Sign-in
// stays disabled until it is set (see NOT_CONFIGURED_MESSAGE).

const trimSlash = (value: string) => value.trim().replace(/\/+$/, '');

const ISSUER = trimSlash('https://identity.ace-base.cc');

/** The registered public mobile client ID. Empty until the client is provisioned. */
const CLIENT_ID = '';

/** Custom URL scheme; must match `appAuthRedirectScheme` in android/app/build.gradle and Info.plist. */
const REDIRECT_SCHEME = 'app.tab.aid';

export const AUTH_CONFIG = {
  issuer: ISSUER,
  apiBaseUrl: trimSlash(ISSUER),
  clientId: CLIENT_ID.trim(),
  redirectScheme: REDIRECT_SCHEME,
  redirectUrl: `${REDIRECT_SCHEME}:/oauth2redirect`,
  scopes: ['openid', 'profile', 'email', 'offline_access'],
} as const;

export const APP_STORE_NAME = 'Ace ID';

/** Opens a hosted Ace ID page (security controls the app does not implement natively). */
export function webUrl(path: string): string {
  return `${AUTH_CONFIG.issuer}${path}`;
}

export const WEB = {
  security: '/account/security',
  devices: '/account/devices',
  danger: '/account/danger',
  register: '/register',
  privacy: '/privacy',
  terms: '/terms',
} as const;
