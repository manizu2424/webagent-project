import { z } from "zod";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import {
  isAdminAuthConfigured,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return apiError("Admin auth is not configured.", 503);
  }

  const body = await parseJsonBody(request);
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid admin login payload.", 422);
  }

  if (!verifyAdminCredentials(parsed.data.email, parsed.data.password)) {
    return apiError("Invalid admin credentials.", 401);
  }

  await setAdminSession(parsed.data.email);

  return apiOk({ authenticated: true });
}
