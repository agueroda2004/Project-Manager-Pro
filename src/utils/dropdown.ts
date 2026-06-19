export function singleValue<V extends string>(v: V | V[] | null): V | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}
