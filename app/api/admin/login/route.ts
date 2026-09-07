import { z } from "zod";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import {
  isAdminAuthConfigured,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth/admin";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminLoginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(256),
});

const ADMIN_LOGIN_BUCKET = "admin-login";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, ADMIN_LOGIN_BUCKET, {
    limit: 5,
    windowMs: 15 * 60_000,
  });

  if (!rateLimit.ok) {
    const response = apiError("Too many login attempts. Try again later.", 429);
    response.headers.set("retry-after", rateLimit.retryAfterSeconds.toString());

    return response;
  }

  if (!isAdminAuthConfigured()) {
    return apiError("Admin auth is not configured.", 503);
  }

  const body = await parseJsonBody(request);
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid admin login payload.", 422);
  }

  if (!(await verifyAdminCredentials(parsed.data.email, parsed.data.password))) {
    return apiError("Invalid admin credentials.", 401);
  }

  await setAdminSession(parsed.data.email);
  resetRateLimit(request, ADMIN_LOGIN_BUCKET);

  return apiOk({ authenticated: true });
}
