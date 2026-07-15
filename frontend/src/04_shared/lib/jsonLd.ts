/** Serialize JSON-LD for a Server Component script tag (XSS-safe for `<`). */
export function toJsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
