/**
 * Converts a FormData instance into a plain object.
 * Handles the case where multiple values for the same key are ignored
 * (only the first/last value per key is kept — use .getAll() for multi-value fields).
 */
export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      obj[key] = value;
    }
  }
  return obj;
}

/**
 * Extracts the first error message from a Zod SafeParseError result.
 * Returns a generic fallback when issues are empty.
 */
export function zodErrorMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Invalid input";
}
