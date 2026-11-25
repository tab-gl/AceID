import { Linking } from 'react-native';
import * as AppAuth from 'react-native-app-auth';
import { AUTH_CONFIG } from '@/config';
import { AuthError, NOT_CONFIGURED_MESSAGE, authMessageFor } from '@/api/errors';
import { isLoopbackOrHttps, normalizeIssuer } from './url';

// OIDC authorization-code flow with PKCE (S256) via AppAuth. Discovery is
// fetched once and pinned to the configured issuer. Tokens are never logged.

export interface ServiceConfig {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  endSessionEndpoint?: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  idToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

let discoveryCache: ServiceConfig | null = null;

export async function loadDiscovery(): Promise<ServiceConfig> {
  if (discoveryCache) return discoveryCache;
  let doc: Record<string, unknown>;
  try {
    const response = await fetch(`${AUTH_CONFIG.issuer}/.well-known/openid-configuration`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`discovery ${response.status}`);
    doc = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new AuthError(authMessageFor('discovery_failed'));
  }
  const issuer = typeof doc.issuer === 'string' ? doc.issuer : '';
  if (normalizeIssuer(issuer) !== normalizeIssuer(AUTH_CONFIG.issuer)) {
    throw new AuthError('The identity provider returned an unexpected issuer. Check the Ace ID issuer configuration.');
  }
  const config: ServiceConfig = {
    issuer,
    authorizationEndpoint: String(doc.authorization_endpoint ?? ''),
    tokenEndpoint: String(doc.token_endpoint ?? ''),
    revocationEndpoint: typeof doc.revocation_endpoint === 'string' ? doc.revocation_endpoint : undefined,
    endSessionEndpoint: typeof doc.end_session_endpoint === 'string' ? doc.end_session_endpoint : undefined,
  };
  if (!isLoopbackOrHttps(config.authorizationEndpoint) || !isLoopbackOrHttps(config.tokenEndpoint)) {
    throw new AuthError('The identity provider returned an insecure endpoint. Refusing to sign in.');
  }
  discoveryCache = config;
  return config;
}

function appAuthConfig(service: ServiceConfig) {
  return {
    clientId: AUTH_CONFIG.clientId,
    redirectUrl: AUTH_CONFIG.redirectUrl,
    scopes: [...AUTH_CONFIG.scopes],
    usePKCE: true,
    serviceConfiguration: {
      authorizationEndpoint: service.authorizationEndpoint,
      tokenEndpoint: service.tokenEndpoint,
      revocationEndpoint: service.revocationEndpoint,
      endSessionEndpoint: service.endSessionEndpoint,
    },
  };
}

function toTokenSet(result: {
  accessToken: string;
  accessTokenExpirationDate: string;
  idToken: string;
  refreshToken: string | null;
}): TokenSet {
  const expiresAt = Date.parse(result.accessTokenExpirationDate);
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken || null,
    idToken: result.idToken,
    expiresAt: Number.isNaN(expiresAt) ? Date.now() + 5 * 60_000 : expiresAt,
  };
}

export async function signInWithBrowser(): Promise<TokenSet> {
  if (!AUTH_CONFIG.clientId) throw new AuthError(NOT_CONFIGURED_MESSAGE);
  const service = await loadDiscovery();
  let result: AppAuth.AuthorizeResult;
  try {
    result = await AppAuth.authorize(appAuthConfig(service));
  } catch (error) {
    throw new AuthError(messageFromAppAuth(error));
  }
  if (!result.accessToken) {
    throw new AuthError('The identity provider returned no access token. Check the OAuth client and authorization-code exchange.');
  }
  if (!result.idToken) {
    throw new AuthError('The identity provider returned no ID token. Ensure the mobile client requests the openid scope.');
  }
  return toTokenSet(result);
}

const REJECTED_REFRESH_ERRORS = new Set(['invalid_grant', 'invalid_client', 'unauthorized_client']);

/** True only when the provider itself rejected the refresh token. */
export function isRefreshRejected(error: unknown): boolean {
  return REJECTED_REFRESH_ERRORS.has(errorCode(error, '').toLowerCase());
}

export async function refreshWithToken(refreshToken: string): Promise<TokenSet> {
  const service = await loadDiscovery();
  const result = await AppAuth.refresh(appAuthConfig(service), { refreshToken });
  return toTokenSet({
    accessToken: result.accessToken,
    accessTokenExpirationDate: result.accessTokenExpirationDate,
    idToken: result.idToken || '',
    refreshToken: result.refreshToken ?? refreshToken,
  });
}

/** RFC 7009 revocation for a public client. Best effort; callers ignore failures. */
export async function revokeToken(token: string): Promise<void> {
  const service = await loadDiscovery();
  if (!service.revocationEndpoint || !isLoopbackOrHttps(service.revocationEndpoint)) return;
  await AppAuth.revoke(appAuthConfig(service), {
    tokenToRevoke: token,
    sendClientId: true,
    includeBasicAuth: false,
  }).catch(() => undefined);
}

/**
 * RP-initiated logout in the system browser. No post_logout_redirect_uri is
 * sent because the mobile client registers none. The person closes the browser.
 */
export async function endProviderSession(idToken: string): Promise<void> {
  const service = await loadDiscovery();
  const endpoint = service.endSessionEndpoint;
  if (!endpoint || !isLoopbackOrHttps(endpoint)) return;
  await Linking.openURL(`${endpoint}?id_token_hint=${encodeURIComponent(idToken)}`).catch(() => undefined);
}

function errorCode(error: unknown, fallback: string): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : fallback;
}

function messageFromAppAuth(error: unknown): string {
  const code = errorCode(error, 'oauth_response_missing');
  const description = (error as { message?: unknown } | null)?.message;
  return authMessageFor(code, typeof description === 'string' ? description : undefined);
}
