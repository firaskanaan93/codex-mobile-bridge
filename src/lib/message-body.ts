export function validateMessageBody(body: unknown): string {
  if (typeof body !== "string") {
    throw new Error("Message body must be a string.");
  }

  const trimmed = body.trim();

  if (!trimmed) {
    throw new Error("Message body is required.");
  }

  if (trimmed.length > 10_000) {
    throw new Error("Message body is too long.");
  }

  return trimmed;
}
