import * as Keychain from 'react-native-keychain';

// Tokens live in the platform secure store: the iOS Keychain and the Android
// Keystore-backed storage that react-native-keychain provides. Nothing is ever
// written to AsyncStorage, which is not encrypted.

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  /** Epoch milliseconds when the access token expires. */
  expiresAt: number;
}

const SERVICE = 'app.tab.aid.session';
const USERNAME = 'session';

export async function saveSession(session: StoredSession): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, JSON.stringify(session), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  });
}

export async function loadSession(): Promise<StoredSession | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  if (!credentials) return null;
  try {
    const parsed = JSON.parse(credentials.password) as StoredSession;
    return parsed && typeof parsed.expiresAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE }).catch(() => false);
}
