/**
 * Normalizes API bodies where the payload is either `T` or `{ data: T }`
 * (common with `ApiResponse.data`).
 */
export function unwrapApiPayload<T>(body: unknown): T | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }
  if (typeof body === "object" && body !== null && "data" in body) {
    const nested = (body as { data: unknown }).data;
    if (nested !== undefined && nested !== null) {
      return nested as T;
    }
  }
  return body as T;
}
