// Small JSON helpers to better match Swift Codable behavior.
// In Swift, any `nil` optional field is omitted from the encoded JSON.
// In JS/TS, `JSON.stringify` omits `undefined` values but keeps `null`.

export function deepOmitUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepOmitUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(record)) {
      if (item === undefined || item === null) {
        continue;
      }
      cleaned[key] = deepOmitUndefined(item);
    }

    return cleaned as T;
  }

  return value;
}

export function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
