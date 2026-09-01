import { apiOk } from "@/lib/api/responses";
import { clearAdminSession } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminSession();

  return apiOk({ authenticated: false });
}
