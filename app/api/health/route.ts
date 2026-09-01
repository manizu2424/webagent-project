import { checkDatabaseConnection } from "@/db";
import { apiError, apiOk } from "@/lib/api/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkDatabaseConnection();

    return apiOk({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed", error);

    return apiError("Health check failed.", 503);
  }
}
