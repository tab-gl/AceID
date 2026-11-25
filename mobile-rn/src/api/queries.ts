import type { AceIdApi } from './client';
import { activityLogs, firstText, objects, strings, type JsonObject } from './json';

// Typed views over the account API. The backend is authoritative; these only
// shape data for display. Field names match the Ace ID account API.

export interface Profile {
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string;
  emailVerified: boolean;
}

export interface Device {
  id: string;
  name: string;
  os: string;
  location: string;
  lastSeen: string;
}

export interface ActivityEntry {
  id: string;
  title: string;
  category: string;
  browser: string;
  createdAt: string;
}

export interface ConnectedApp {
  grantId: string;
  name: string;
  clientUri: string;
  clientId: string;
  scopes: string[];
}

export function toProfile(account: JsonObject | null | undefined, fallbackName = '', fallbackEmail = ''): Profile {
  return {
    displayName: firstText(account, ['display_name'], fallbackName || 'Ace ID member'),
    username: firstText(account, ['username']),
    email: firstText(account, ['email'], fallbackEmail),
    avatarUrl: firstText(account, ['avatar_url']),
    emailVerified: account ? account.email_verified !== false : true,
  };
}

export const fetchAccount = (api: AceIdApi) => api.request('/api/me');

export async function fetchSecurity(api: AceIdApi): Promise<{ devices: Device[]; activity: ActivityEntry[]; partialError: string | null }> {
  const [devices, logs] = await Promise.allSettled([api.request('/api/me/devices'), api.request('/api/me/logs')]);
  if (devices.status === 'rejected' && logs.status === 'rejected') throw devices.reason;
  return {
    devices: devices.status === 'fulfilled' ? objects(devices.value, 'devices').map(toDevice) : [],
    activity: logs.status === 'fulfilled' ? activityLogs(logs.value).map(toActivity) : [],
    partialError:
      devices.status === 'rejected'
        ? 'Could not load signed-in devices.'
        : logs.status === 'rejected'
          ? 'Could not load recent activity.'
          : null,
  };
}

export function toDevice(device: JsonObject, index: number): Device {
  return {
    id: firstText(device, ['id', 'session_id'], String(index)),
    name: firstText(device, ['device_name', 'browser', 'device_type'], 'Signed-in device'),
    os: firstText(device, ['os'], 'Device'),
    location: firstText(device, ['location'], 'Location unavailable'),
    lastSeen: firstText(device, ['last_seen_at', 'created_at']),
  };
}

export function toActivity(entry: JsonObject, index: number): ActivityEntry {
  return {
    id: firstText(entry, ['id'], String(index)),
    title: firstText(entry, ['name', 'event_type'], 'ID activity'),
    category: firstText(entry, ['category'], 'id'),
    browser: firstText(entry, ['browser'], 'Ace ID'),
    createdAt: firstText(entry, ['created_at']),
  };
}

export async function fetchConnectedApps(api: AceIdApi): Promise<ConnectedApp[]> {
  const response = await api.request('/api/me/connected-apps');
  return objects(response, 'connectedApps').map((app, index) => ({
    grantId: firstText(app, ['grantId']),
    name: firstText(app, ['clientName'], 'Connected app'),
    clientUri: firstText(app, ['clientUri']),
    clientId: firstText(app, ['clientId'], String(index)),
    scopes: strings(app, 'scopes'),
  }));
}

export function revokeConnectedApp(api: AceIdApi, grantId: string) {
  return api.request(`/api/me/connected-apps/${encodeURIComponent(grantId)}`, { method: 'DELETE' });
}

/** POSTs only the fields that actually changed. Username and email are never resent unnecessarily. */
export function saveProfile(api: AceIdApi, changes: JsonObject) {
  return api.request('/api/me', { method: 'POST', body: changes });
}
