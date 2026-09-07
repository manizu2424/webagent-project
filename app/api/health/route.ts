import { checkDatabaseConnection } from "@/db";
import { apiOk } from "@/lib/api/responses";
import { serverErrorResponse } from "@/lib/api/server-error";

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
    return serverErrorResponse(
      "Health check failed.",
      503,
      "health.database_check_failed",
      error,
    );
  }
}
