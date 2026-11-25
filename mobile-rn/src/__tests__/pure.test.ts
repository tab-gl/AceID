import { activityLogs, firstText, objects, shortDate, strings } from '@/api/json';
import { apiMessageFor, authMessageFor } from '@/api/errors';
import { decodeBase64Url, idTokenClaimProblem, profileFromIdToken } from '@/auth/jwt';
import { isRefreshRejected } from '@/auth/oidc';
import { isLoopbackOrHttps } from '@/auth/url';
import { springFor } from '@/design-system/tokens';
import { M3E_SPRINGS } from '@/design-system/tokens/m3e-motion.generated';

const b64url = (value: string) =>
  Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');

describe('json readers', () => {
  it('firstText skips blank and "null" values', () => {
    expect(firstText({ a: '  ', b: 'null', c: 'ok' }, ['a', 'b', 'c'], 'x')).toBe('ok');
    expect(firstText({}, ['a'], 'fallback')).toBe('fallback');
  });

  it('activityLogs prefers `log` and falls back to `logs`', () => {
    expect(activityLogs({ log: [{ id: 1 }], logs: [{ id: 2 }] })).toEqual([{ id: 1 }]);
    expect(activityLogs({ logs: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(activityLogs({})).toEqual([]);
  });

  it('objects and strings tolerate malformed input', () => {
    expect(objects({ x: [{ a: 1 }, 'bad', null] }, 'x')).toEqual([{ a: 1 }]);
    expect(strings({ s: ['openid', '', 3] }, 's')).toEqual(['openid', '3']);
  });

  it('shortDate formats d MMM yyyy and passes through unparseable values', () => {
    const iso = new Date(2026, 10, 24, 12).toISOString();
    expect(shortDate(iso)).toBe('24 Nov 2026');
    expect(shortDate('not a date')).toBe('not a date');
    expect(shortDate('null')).toBeNull();
  });
});

describe('jwt', () => {
  it('decodes base64url UTF-8', () => {
    expect(decodeBase64Url(b64url('{"name":"Åda ✓"}'))).toBe('{"name":"Åda ✓"}');
  });

  it('builds a display profile from an ID token and rejects tokens without sub', () => {
    const token = ['h', b64url(JSON.stringify({ sub: 'u1', name: 'Ada', email: 'a@x.io' })), 's'].join('.');
    expect(profileFromIdToken(token, 5)).toEqual({ subject: 'u1', name: 'Ada', email: 'a@x.io', expiresAt: 5 });
    const noSub = ['h', b64url('{"name":"x"}'), 's'].join('.');
    expect(profileFromIdToken(noSub, 5)).toBeNull();
    expect(profileFromIdToken('garbage', 5)).toBeNull();
  });
});

describe('oidc helpers', () => {
  it('only treats provider rejections as ending the session', () => {
    expect(isRefreshRejected({ code: 'invalid_grant' })).toBe(true);
    expect(isRefreshRejected({ code: 'invalid_client' })).toBe(true);
    expect(isRefreshRejected({ code: 'server_error' })).toBe(false);
    expect(isRefreshRejected(new TypeError('Network request failed'))).toBe(false);
  });

  it('requires https or loopback http', () => {
    expect(isLoopbackOrHttps('https://identity.ace-base.cc/x')).toBe(true);
    expect(isLoopbackOrHttps('http://127.0.0.1:9000/x')).toBe(true);
    expect(isLoopbackOrHttps('http://identity.ace-base.cc')).toBe(false);
  });
});

describe('error copy', () => {
  it('maps codes the way the Android client does', () => {
    expect(apiMessageFor('invalid_origin', undefined, 400)).toMatch(/security reasons/);
    expect(apiMessageFor('some_code', undefined, 500)).toBe('some code');
    expect(apiMessageFor(undefined, undefined, 502)).toBe('Request failed (502).');
    expect(authMessageFor('access_denied', 'cancelled by user')).toMatch(/cannot|rejected|failed/);
    expect(authMessageFor('user_cancelled')).toMatch(/cancelled/);
  });
});

describe('motion tokens', () => {
  it('converts m3e damping ratio to reanimated damping coefficient', () => {
    const s = M3E_SPRINGS.expressive['default-spatial'];
    const config = springFor('default-spatial');
    expect(config.stiffness).toBe(s.stiffness);
    expect(config.damping).toBeCloseTo(2 * s.damping * Math.sqrt(s.stiffness), 6);
    expect(config.mass).toBe(1);
  });

  it('publishes the six expressive springs from @m3e/web', () => {
    expect(Object.keys(M3E_SPRINGS.expressive).sort()).toEqual(
      ['default-effects', 'default-spatial', 'fast-effects', 'fast-spatial', 'slow-effects', 'slow-spatial'],
    );
  });
});

describe('idTokenClaimProblem', () => {
  const enc = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
  const now = 1_800_000_000_000;
  const base = { sub: 'u1', iss: 'https://identity.ace-base.cc', aud: 'client-1', exp: now / 1000 + 600 };
  const token = (claims: object) => `h.${enc(claims)}.s`;
  const expect_ = { issuer: 'https://identity.ace-base.cc', clientId: 'client-1', now };

  it('accepts a matching token', () => {
    expect(idTokenClaimProblem(token(base), expect_)).toBeNull();
  });
  it('accepts an audience array that contains the client', () => {
    expect(idTokenClaimProblem(token({ ...base, aud: ['other', 'client-1'], azp: 'client-1' }), expect_)).toBeNull();
  });
  it('rejects a wrong issuer, audience, expiry or missing subject', () => {
    expect(idTokenClaimProblem(token({ ...base, iss: 'https://evil.example' }), expect_)).toBe('issuer mismatch');
    expect(idTokenClaimProblem(token({ ...base, aud: 'someone-else' }), expect_)).toBe('audience mismatch');
    expect(idTokenClaimProblem(token({ ...base, exp: now / 1000 - 1 }), expect_)).toBe('expired');
    expect(idTokenClaimProblem(token({ ...base, sub: undefined }), expect_)).toBe('missing sub');
  });
  it('rejects every token while no client ID is configured', () => {
    expect(idTokenClaimProblem(token(base), { ...expect_, clientId: '' })).toBe('audience mismatch');
  });
});
