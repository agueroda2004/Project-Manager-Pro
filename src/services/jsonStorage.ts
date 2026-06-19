const NAMESPACE = "pmp";
const SEED_FLAG_KEY = `${NAMESPACE}:seed-disabled`;

function key(entity: string): string {
  return `${NAMESPACE}:${entity}`;
}

function isSeedDisabled(): boolean {
  try {
    return localStorage.getItem(SEED_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export async function readJson<T>(entity: string, fallbackUrl: string): Promise<T[]> {
  const k = key(entity);
  try {
    const cached = localStorage.getItem(k);
    if (cached !== null) {
      return JSON.parse(cached) as T[];
    }
  } catch (e) {
    console.warn(`[storage] read localStorage failed for ${entity}`, e);
  }

  if (isSeedDisabled()) {
    try {
      localStorage.setItem(k, JSON.stringify([]));
    } catch {}
    return [];
  }

  try {
    const res = await fetch(fallbackUrl);
    if (!res.ok) throw new Error(`fetch ${fallbackUrl} -> ${res.status}`);
    const data = (await res.json()) as T[];
    localStorage.setItem(k, JSON.stringify(data));
    return data;
  } catch (e) {
    console.warn(`[storage] fetch failed for ${entity}, returning []`, e);
    return [];
  }
}

export function writeJson<T>(entity: string, data: T[]): void {
  try {
    localStorage.setItem(key(entity), JSON.stringify(data));
  } catch (e) {
    console.error(`[storage] write failed for ${entity}`, e);
  }
}

export function clearAll(): void {
  const prefix = `${NAMESPACE}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

export function setSeedDisabled(disabled: boolean): void {
  try {
    if (disabled) localStorage.setItem(SEED_FLAG_KEY, "1");
    else localStorage.removeItem(SEED_FLAG_KEY);
  } catch (e) {
    console.error(`[storage] setSeedDisabled failed`, e);
  }
}

export function isSeedDisabledFlag(): boolean {
  return isSeedDisabled();
}
