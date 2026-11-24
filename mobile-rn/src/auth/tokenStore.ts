import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Tokens live in the platform secure store (Keychain / Android Keystore).
// SecureStore caps each value at ~2 KB and ID tokens can exceed that, so the
// session is split into chunks. Web has no secure store; the browser preview
// falls back to AsyncStorage and is not a supported place for real tokens.

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number;
}

const CHUNK = 1800;
const COUNT_KEY = 'aceid.session.chunks';
const PREFIX = 'aceid.session.';

const isNative = Platform.OS !== 'web';

async function setItem(key: string, value: string) {
  if (isNative) return SecureStore.setItemAsync(key, value);
  return AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isNative) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string) {
  if (isNative) return SecureStore.deleteItemAsync(key);
  return AsyncStorage.removeItem(key);
}

export async function saveSession(session: StoredSession): Promise<void> {
  const json = JSON.stringify(session);
  const chunks = Math.max(1, Math.ceil(json.length / CHUNK));
  for (let i = 0; i < chunks; i++) {
    await setItem(`${PREFIX}${i}`, json.slice(i * CHUNK, (i + 1) * CHUNK));
  }
  await setItem(COUNT_KEY, String(chunks));
}

export async function loadSession(): Promise<StoredSession | null> {
  const countRaw = await getItem(COUNT_KEY);
  const count = Number(countRaw);
  if (!countRaw || !Number.isInteger(count) || count < 1) return null;
  let json = '';
  for (let i = 0; i < count; i++) {
    const part = await getItem(`${PREFIX}${i}`);
    if (part === null) return null;
    json += part;
  }
  try {
    const parsed = JSON.parse(json) as StoredSession;
    return parsed && typeof parsed.expiresAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const countRaw = await getItem(COUNT_KEY);
  const count = Number(countRaw);
  if (Number.isInteger(count)) {
    for (let i = 0; i < count; i++) await deleteItem(`${PREFIX}${i}`);
  }
  await deleteItem(COUNT_KEY);
}
