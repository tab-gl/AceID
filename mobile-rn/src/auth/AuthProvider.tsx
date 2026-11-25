import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AceIdApi, clearApiCache } from '@/api/client';
import { ApiError, API_MESSAGES, AuthError } from '@/api/errors';
import { endProviderSession, isRefreshRejected, refreshWithToken, revokeToken, signInWithBrowser, type TokenSet } from './oidc';
import { idTokenClaimProblem, profileFromIdToken, type IdentityProfile } from './jwt';
import { AUTH_CONFIG } from '@/config';
import { clearSession, loadSession, saveSession, type StoredSession } from './tokenStore';

/** Refresh this long before expiry so a request never races the clock. */
const EXPIRY_SKEW_MS = 60_000;

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: SessionStatus;
  profile: IdentityProfile | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** A valid access token, refreshed first when near expiry. Null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** The account API, bound to this session's tokens. */
  api: AceIdApi;
}

const AuthContext = createContext<AuthValue | null>(null);

function toStored(tokens: TokenSet): StoredSession {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    idToken: tokens.idToken,
    expiresAt: tokens.expiresAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  // Tokens stay in a ref: they must not drive renders or leak through state.
  const session = useRef<StoredSession | null>(null);
  // Serialises refreshes so a rotated refresh token is never spent twice.
  const refreshing = useRef<Promise<string | null> | null>(null);

  const endSession = useCallback(async () => {
    session.current = null;
    setProfile(null);
    setStatus('signedOut');
    await clearSession();
    await clearApiCache();
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const current = session.current;
    if (!current?.refreshToken) return null;
    try {
      const tokens = await refreshWithToken(current.refreshToken);
      const next = toStored(tokens);
      session.current = next;
      await saveSession(next);
      return next.accessToken;
    } catch (error) {
      // Only a provider rejection ends the session. Offline, timeouts and 5xx
      // must not sign the person out.
      if (isRefreshRejected(error)) {
        await endSession();
        return null;
      }
      throw new ApiError(API_MESSAGES.UNREACHABLE);
    }
  }, [endSession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = session.current;
    if (current?.accessToken && current.expiresAt > Date.now() + EXPIRY_SKEW_MS) {
      return current.accessToken;
    }
    if (!refreshing.current) {
      refreshing.current = refreshAccessToken().finally(() => {
        refreshing.current = null;
      });
    }
    return refreshing.current;
  }, [refreshAccessToken]);

  // Restore a still-valid session on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      const restored = stored ? profileFromIdToken(stored.idToken, stored.expiresAt) : null;
      if (!stored || !restored) {
        await clearSession();
        if (!cancelled) setStatus('signedOut');
        return;
      }
      session.current = stored;
      if (!cancelled) {
        setProfile(restored);
        setStatus('signedIn');
      }
      try {
        const token = await getAccessToken();
        if (!token && !cancelled) setStatus('signedOut');
      } catch {
        // Offline or the provider is down: keep the session and cached data.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  const signIn = useCallback(async () => {
    const tokens = await signInWithBrowser();
    const next = toStored(tokens);
    const problem = idTokenClaimProblem(next.idToken, {
      issuer: AUTH_CONFIG.issuer,
      clientId: AUTH_CONFIG.clientId,
      now: Date.now(),
    });
    if (problem) {
      throw new AuthError('The identity provider returned an ID token that failed validation. Check the issuer and OIDC client configuration.');
    }
    const identity = profileFromIdToken(next.idToken, next.expiresAt);
    if (!identity) {
      throw new AuthError('The identity provider returned an invalid ID token. Check the issuer and OIDC client configuration.');
    }
    session.current = next;
    await saveSession(next);
    setProfile(identity);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const current = session.current;
    // Revoke first so a copy of either token stops working now. Best effort.
    if (current?.refreshToken) await revokeToken(current.refreshToken).catch(() => undefined);
    if (current?.accessToken) await revokeToken(current.accessToken).catch(() => undefined);
    if (current?.idToken) {
      // Not awaited: the browser stays open until the person closes it.
      endProviderSession(current.idToken).catch(() => undefined);
    }
    await endSession();
  }, [endSession]);

  // The API client reads tokens through a stable indirection, so the client
  // identity (and every screen that holds it) does not change per render.
  const tokenSource = useRef(getAccessToken);
  useEffect(() => {
    tokenSource.current = getAccessToken;
  }, [getAccessToken]);
  // The arrow only runs later, from an event or request, never during render.
  const accountApi = useMemo(() => new AceIdApi(() => tokenSource.current()), []);

  const value = useMemo<AuthValue>(
    () => ({ status, profile, signIn, signOut, getAccessToken, api: accountApi }),
    [status, profile, signIn, signOut, getAccessToken, accountApi],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
