import { toActivity, toDevice, toProfile } from '@/api/queries';

describe('account read models', () => {
  it('falls back to the session profile when the account is empty', () => {
    expect(toProfile(null, 'Ada', 'a@x.io')).toMatchObject({ displayName: 'Ada', email: 'a@x.io', emailVerified: true });
    expect(toProfile({}, '', '')).toMatchObject({ displayName: 'Ace ID member', username: '' });
  });

  it('treats an explicit email_verified: false as unverified', () => {
    expect(toProfile({ display_name: 'Ada', email_verified: false }).emailVerified).toBe(false);
  });

  it('maps devices and activity using the server field names', () => {
    expect(toDevice({ session_id: 's1', browser: 'Safari', os: 'iOS', location: 'Gorakhpur' }, 0)).toMatchObject({
      id: 's1',
      name: 'Safari',
      os: 'iOS',
      location: 'Gorakhpur',
    });
    expect(toActivity({ event_type: 'login', category: 'auth' }, 3)).toMatchObject({ id: '3', title: 'login', category: 'auth', browser: 'Ace ID' });
  });
});
