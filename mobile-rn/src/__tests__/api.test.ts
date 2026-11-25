import AsyncStorage from '@react-native-async-storage/async-storage';
import { AceIdApi, resolveApiUrl } from '@/api/client';
import { ApiError } from '@/api/errors';

const okJson = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...headers } });

describe('resolveApiUrl', () => {
  it('accepts https and loopback http origins', () => {
    expect(resolveApiUrl('https://identity.ace-base.cc/', '/api/account')).toBe('https://identity.ace-base.cc/api/account');
    expect(resolveApiUrl('http://localhost:3000', '/api/account')).toBe('http://localhost:3000/api/account');
  });

  it('refuses plain http, userinfo, paths and queries', () => {
    for (const origin of ['http://identity.ace-base.cc', 'https://user:pw@id.example', 'https://id.example/path', 'https://id.example?x=1']) {
      expect(() => resolveApiUrl(origin, '/api/account')).toThrow(ApiError);
    }
  });
});

describe('AceIdApi', () => {
  const realFetch = global.fetch;
  beforeEach(async () => {
    await AsyncStorage.clear();
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('sends a bearer token and parses the body', async () => {
    const fetchMock = jest.fn(async () => okJson({ display_name: 'Ada' }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const api = new AceIdApi(async () => 'tok', 'https://identity.ace-base.cc');
    const result = await api.request('/api/account');
    expect(result).toEqual({ display_name: 'Ada' });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('refuses to call the API without a token', async () => {
    const api = new AceIdApi(async () => null, 'https://identity.ace-base.cc');
    await expect(api.request('/api/account')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('answers 304 from the cached snapshot and sends If-None-Match', async () => {
    const calls: Record<string, string>[] = [];
    global.fetch = jest.fn(async (_url: string, init: RequestInit) => {
      calls.push(init.headers as Record<string, string>);
      return calls.length === 1
        ? okJson({ email: 'a@b.c' }, { etag: '"v1"' })
        : new Response(null, { status: 304, headers: { etag: '"v1"' } });
    }) as unknown as typeof fetch;
    const api = new AceIdApi(async () => 'tok', 'https://identity.ace-base.cc');
    await api.request('/api/account');
    expect(await api.request('/api/account')).toEqual({ email: 'a@b.c' });
    expect(calls[1]['If-None-Match']).toBe('"v1"');
  });

  it('falls back to the snapshot when offline, but never masks a 401', async () => {
    let online = true;
    global.fetch = jest.fn(async () => {
      if (!online) throw new TypeError('Network request failed');
      return okJson({ username: 'ada' });
    }) as unknown as typeof fetch;
    const api = new AceIdApi(async () => 'tok', 'https://identity.ace-base.cc');
    await api.request('/api/account');
    online = false;
    expect(await api.request('/api/account')).toEqual({ username: 'ada' });

    await AsyncStorage.clear();
    await expect(api.request('/api/account')).rejects.toThrow('Could not reach Ace ID');
  });

  it('maps server error codes to user copy', async () => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ error: 'username_change_cooldown' }), { status: 409 }),
    ) as unknown as typeof fetch;
    const api = new AceIdApi(async () => 'tok', 'https://identity.ace-base.cc');
    await expect(api.request('/api/account', { method: 'POST', body: { username: 'x' } })).rejects.toThrow(
      'Your username cannot be changed yet.',
    );
  });

  it('encodes nothing but the grant id in DELETE paths and clears the cache on mutation', async () => {
    const fetchMock = jest.fn(async () => okJson({}));
    global.fetch = fetchMock as unknown as typeof fetch;
    await AsyncStorage.setItem('aceid.cache:/api/account', JSON.stringify({ data: {}, etag: null, savedAt: Date.now() }));
    const api = new AceIdApi(async () => 'tok', 'https://identity.ace-base.cc');
    await api.request('/api/account/connected-apps/' + encodeURIComponent('g/1'), { method: 'DELETE' });
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe('https://identity.ace-base.cc/api/account/connected-apps/g%2F1');
    expect(await AsyncStorage.getItem('aceid.cache:/api/account')).toBeNull();
  });
});
