// Tolerant readers for the account API. The backend is authoritative; these
// helpers only shape data for display and never trust it for authorization.

export type JsonObject = Record<string, unknown>;

export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function text(obj: JsonObject | null | undefined, key: string): string {
  const value = obj?.[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** First non-blank value among keys, or the fallback. */
export function firstText(obj: JsonObject | null | undefined, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = text(obj, key).trim();
    if (value && value !== 'null') return value;
  }
  return fallback;
}

export function objects(obj: JsonObject | null | undefined, key: string): JsonObject[] {
  const value = obj?.[key];
  return Array.isArray(value) ? value.filter(isObject) : [];
}

export function strings(obj: JsonObject | null | undefined, key: string): string[] {
  const value = obj?.[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim() !== '');
}

/** The server serializes activity under `log`; `logs` is a compatibility alias. */
export function activityLogs(response: JsonObject | null | undefined): JsonObject[] {
  const log = objects(response, 'log');
  return log.length > 0 ? log : objects(response, 'logs');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "d MMM yyyy" in the device's local time zone, or the raw value if unparseable. */
export function shortDate(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || value === 'null') return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const date = new Date(time);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
