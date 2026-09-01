export function object(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name}格式无效`);
  return value as Record<string, unknown>;
}

export function array(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${name}格式无效`);
  return value;
}

export function string(value: unknown, name: string): string {
  if (typeof value !== "string") throw new Error(`${name}格式无效`);
  return value;
}

export function optionalString(value: unknown, name: string): string | null | undefined {
  if (value === undefined || value === null) return value;
  return string(value, name);
}

export function number(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${name}格式无效`);
  return value;
}

export function optionalNumber(value: unknown, name: string): number | null | undefined {
  if (value === undefined || value === null) return value;
  return number(value, name);
}

export function boolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${name}格式无效`);
  return value;
}

export function hasOnly(value: Record<string, unknown>, allowed: readonly string[], name: string): void {
  const known = new Set(allowed);
  if (Object.keys(value).some((key) => !known.has(key))) throw new Error(`${name}包含未知字段`);
}
