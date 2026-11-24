import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AUTH_CONFIG } from './config';
import { AuthError, NOT_CONFIGURED_MESSAGE, authMessageFor } from '@/api/errors';

// OIDC authorization-code flow with PKCE (S256), via expo-auth-session.
// Discovery is pinned to the configured issuer; tokens are never logged.

type Discovery = AuthSession.DiscoveryDocument;

let discoveryCache: Discovery | null = null;

const normalizeIssuer = (value: string | undefined) => (value ?? '').replace(/\/+$/, '');

export async function loadDiscovery(): Promise<Discovery> {
  if (discoveryCache) return discoveryCache;
  let doc: Discovery;
  try {
    doc = await AuthSession.fetchDiscoveryAsync(AUTH_CONFIG.issuer);
  } catch (error) {
    throw new AuthError(authMessageFor(errorCode(error, 'discovery_failed'), errorDescription(error)));
  }
  const issuer = (doc as { issuer?: string }).issuer;
  if (issuer !== undefined && normalizeIssuer(issuer) !== normalizeIssuer(AUTH_CONFIG.issuer)) {
    throw new AuthError('The identity provider returned an unexpected issuer. Check the Ace ID issuer configuration.');
  }
  discoveryCache = doc;
  return doc;
}

export function isLoopbackOrHttps(url: string): boolean {
  if (/^https:\/\//i.test(url)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(url);
}

export async function signInWithBrowser(): Promise<AuthSession.TokenResponse> {
  if (!AUTH_CONFIG.clientId) throw new AuthError(NOT_CONFIGURED_MESSAGE);
  const discovery = await loadDiscovery();
  const request = new AuthSession.AuthRequest({
    clientId: AUTH_CONFIG.clientId,
    redirectUri: AUTH_CONFIG.redirectUri,
    scopes: [...AUTH_CONFIG.scopes],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new AuthError(authMessageFor('cancelled'));
  }
  if (result.type !== 'success') {
    const params = (result as { params?: Record<string, string> }).params ?? {};
    throw new AuthError(authMessageFor(params.error ?? 'oauth_response_missing', params.error_description));
  }

  const code = result.params.code;
  if (!code) throw new AuthError(authMessageFor('oauth_response_missing'));

  try {
    const tokens = await AuthSession.exchangeCodeAsync(
      {
        clientId: AUTH_CONFIG.clientId,
        code,
        redirectUri: AUTH_CONFIG.redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      discovery,
    );
    if (!tokens.accessToken) {
      throw new AuthError('The identity provider returned no access token. Check the OAuth client and authorization-code exchange.');
    }
    if (!tokens.idToken) {
      throw new AuthError('The identity provider returned no ID token. Ensure the mobile client requests the openid scope.');
    }
    return tokens;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(authMessageFor(errorCode(error, 'oauth_token_error'), errorDescription(error)));
  }
}

const REJECTED_REFRESH_ERRORS = new Set(['invalid_grant', 'invalid_client', 'unauthorized_client']);

/** True only when the provider itself rejected the refresh token. */
export function isRefreshRejected(error: unknown): boolean {
  return REJECTED_REFRESH_ERRORS.has(errorCode(error, '').toLowerCase());
}

export async function refreshWithToken(refreshToken: string): Promise<AuthSession.TokenResponse> {
  const discovery = await loadDiscovery();
  return AuthSession.refreshAsync(
    { clientId: AUTH_CONFIG.clientId, refreshToken, scopes: [...AUTH_CONFIG.scopes] },
    discovery,
  );
}

/** RFC 7009 revocation for a public client. Best effort; callers ignore failures. */
export async function revokeToken(token: string, hint: 'access_token' | 'refresh_token'): Promise<void> {
  const discovery = await loadDiscovery();
  const endpoint = discovery.revocationEndpoint;
  if (!endpoint || !isLoopbackOrHttps(endpoint)) return;
  await AuthSession.revokeAsync(
    { clientId: AUTH_CONFIG.clientId, token, tokenTypeHint: hint as AuthSession.TokenTypeHint },
    discovery,
  );
}

/**
 * RP-initiated logout in the system browser. No post_logout_redirect_uri is
 * sent: the mobile client has none registered. Not awaited by callers, since
 * the person closes the browser themselves.
 */
export async function endProviderSession(idToken: string): Promise<void> {
  const discovery = await loadDiscovery();
  const endpoint = discovery.endSessionEndpoint;
  if (!endpoint || !isLoopbackOrHttps(endpoint)) return;
  const url = `${endpoint}?id_token_hint=${encodeURIComponent(idToken)}`;
  await WebBrowser.openBrowserAsync(url);
}

function errorCode(error: unknown, fallback: string): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : fallback;
}

function errorDescription(error: unknown): string | undefined {
  const description = (error as { description?: unknown; message?: unknown } | null);
  if (typeof description?.description === 'string') return description.description;
  if (typeof description?.message === 'string') return description.message;
  return undefined;
}
