const INTERNAL_SECRET_HEADER = "x-internal-api-secret";

export function verifyInternalApiSecret(request: Request) {
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    return {
      ok: false,
      status: 503,
      error: "Internal API secret is not configured.",
    } as const;
  }

  const headerSecret = request.headers.get(INTERNAL_SECRET_HEADER);
  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (headerSecret !== expectedSecret && bearerToken !== expectedSecret) {
    return {
      ok: false,
      status: 401,
      error: "Invalid internal API secret.",
    } as const;
  }

  return { ok: true } as const;
}
