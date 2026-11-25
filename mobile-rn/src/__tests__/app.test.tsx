import React from 'react';
import * as Keychain from 'react-native-keychain';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../../App';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

/** All rendered text, one entry per host Text node. */
function texts(renderer: ReactTestRenderer): string[] {
  const out: string[] = [];
  const collect = (node: unknown): string => {
    if (typeof node === 'string') return node;
    if (!node || typeof node !== 'object') return '';
    const children = (node as { children?: unknown[] }).children ?? [];
    return children.map(collect).join('');
  };
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const element = node as { type?: unknown; children?: unknown[] };
    if (element.type === 'Text') out.push(collect(node));
    (element.children ?? []).forEach(walk);
  };
  walk(renderer.toJSON());
  return out;
}

const b64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('App', () => {
  afterEach(() => {
    (global as { fetch?: unknown }).fetch = undefined;
  });

  it('shows the sign-in screen when no session is stored', async () => {
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<App />);
    });
    await flush();
    const copy = texts(renderer).join(' | ');
    expect(copy).toContain('Fast by design.');
    expect(copy).toContain('Continue with Ace ID');
    await act(async () => renderer.unmount());
  });

  it('restores a stored session and renders Home from the account API', async () => {
    const idToken = `h.${b64url({ sub: 'u1', name: 'Ada Lovelace', email: 'ada@x.io' })}.s`;
    jest.mocked(Keychain.getGenericPassword).mockResolvedValueOnce({
      username: 'session',
      service: 'app.tab.aid.session',
      storage: 'mock',
      password: JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken, expiresAt: Date.now() + 3_600_000 }),
    } as never);

    const routes: Record<string, unknown> = {
      '/api/me': { display_name: 'Ada Lovelace', username: 'ada', email: 'ada@x.io', email_verified: true },
      '/api/me/devices': { devices: [{ id: 'd1', device_name: 'Chrome', os: 'macOS', location: 'Gorakhpur' }] },
      '/api/me/logs': { log: [{ id: 'l1', name: 'Signed in', category: 'auth', browser: 'Chrome' }] },
      '/api/me/connected-apps': { connectedApps: [] },
    };
    const fetchMock = jest.fn(async (url: string) => {
      const path = new URL(url).pathname;
      return jsonResponse(routes[path] ?? {});
    });
    (global as { fetch?: unknown }).fetch = fetchMock;

    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(<App />);
    });
    await flush();
    await flush();

    const copy = texts(renderer).join(' | ');
    expect(copy).toContain('Good to have you, Ada.');
    expect(copy).toContain('Email verified');
    expect(copy).toContain('@ada');
    const requested = fetchMock.mock.calls.map((call) => new URL(call[0] as string).pathname);
    expect(requested).toEqual(expect.arrayContaining(['/api/me', '/api/me/devices', '/api/me/logs']));
    const authHeader = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(authHeader.Authorization).toBe('Bearer at');
    await act(async () => renderer.unmount());
  });
});
