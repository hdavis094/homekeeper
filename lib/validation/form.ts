import type { z } from "zod";

export type FormResult<T> =
  | { success: true; data: T }
  | { success: false; fieldErrors: Record<string, string>; formError?: string };

/**
 * Validates FormData (or a plain object) for a server action. Returns the first message per field,
 * keyed by top-level field name; errors without a field go in `formError`.
 */
export function parseForm<S extends z.ZodType>(
  schema: S,
  input: FormData | Record<string, unknown>,
): FormResult<z.output<S>> {
  const values = input instanceof FormData ? Object.fromEntries(input) : input;
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  let formError: string | undefined;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === undefined) formError ??= issue.message;
    else fieldErrors[String(field)] ??= issue.message;
  }
  return formError === undefined
    ? { success: false, fieldErrors }
    : { success: false, fieldErrors, formError };
}
