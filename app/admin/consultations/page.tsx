import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { consultations } from "@/db/schema";
import { getAdminSession } from "@/lib/auth/admin";
import { consultationStatusValues } from "@/lib/constants/status";
import { updateConsultationStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminConsultationsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const rows = await getDb().query.consultations.findMany({
    with: {
      lead: true,
      diagnosis: true,
    },
    orderBy: [desc(consultations.createdAt)],
    limit: 50,
  });

  return (
    <AdminShell title="상담 목록">
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">회사</th>
              <th className="px-4 py-3 font-semibold">담당자</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">방식</th>
              <th className="px-4 py-3 font-semibold">신청일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 font-semibold">
                  {row.lead.companyName}
                </td>
                <td className="px-4 py-3">{row.lead.contactName}</td>
                <td className="px-4 py-3">
                  <form action={updateConsultationStatus} className="flex gap-2">
                    <input type="hidden" name="consultationId" value={row.id} />
                    <select
                      name="status"
                      defaultValue={row.status}
                      className="h-9 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
                    >
                      {consultationStatusValues.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border px-3 py-1 text-xs font-semibold"
                    >
                      저장
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">{row.consultationType ?? "-"}</td>
                <td className="px-4 py-3">
                  {row.createdAt.toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
