/**
 * Tiny classname utility — drop-in replacement for clsx.
 *
 * Joins string args, ignores falsy (false, null, undefined, '', 0).
 * Supports nested objects { 'class-name': boolean } for conditional.
 *
 * Usage:
 *   cn('btn', isActive && 'btn-active', { 'btn-disabled': disabled })
 */

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: boolean | null | undefined }
  | ClassValue[];

export function cn(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg && arg !== 0) continue;
    if (typeof arg === 'string' || typeof arg === 'number') {
      out.push(String(arg));
    } else if (Array.isArray(arg)) {
      const sub = cn(...arg);
      if (sub) out.push(sub);
    } else if (typeof arg === 'object') {
      for (const k in arg) {
        if (arg[k]) out.push(k);
      }
    }
  }
  return out.join(' ');
}
