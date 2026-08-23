/**
 * Maps Zod validation issues to a flat field→message record.
 * Works with both Zod v3 (error.issues is an array) and Zod v4
 * (error.issues is a getter that returns an array).
 */
export function fieldErrorsFromZod(error: unknown): Record<string, string> {
  const map: Record<string, string> = {};

  if (!error || typeof error !== 'object') return map;

  // Extract issues — Zod v3: error.issues is an array, Zod v4: getter returning array
  let issues: Array<{ path?: unknown[]; message?: string }> = [];
  const err = error as Record<string, unknown>;

  if (Array.isArray(err.issues)) {
    issues = err.issues as Array<{ path?: unknown[]; message?: string }>;
  } else if (typeof err.issues === 'function') {
    try {
      const result = (err.issues as () => unknown)();
      if (Array.isArray(result)) {
        issues = result as Array<{ path?: unknown[]; message?: string }>;
      } else {
        issues = [];
      }
    } catch {
      issues = [];
    }
  }

  for (const issue of issues) {
    const path = issue.path;
    const key = Array.isArray(path) && path.length > 0 ? path.join('.') : '_form';
    if (key && !map[key]) {
      map[key] = issue.message ?? 'Validation failed';
    }
  }

  return map;
}
