import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { consultations } from "@/db/schema";
import { getAdminSession } from "@/lib/auth/admin";
import { consultationStatusValues } from "@/lib/constants/status";
import { updateConsultationStatus } from "../actions";
import { AdminPagination } from "@/components/admin/pagination";
import { ADMIN_PAGE_SIZE, getTotalPages, parsePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const requestedPage = parsePage((await searchParams).page);
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(consultations);
  const totalPages = getTotalPages(total);
  const currentPage = Math.min(requestedPage, totalPages);
  const rows = await db.query.consultations.findMany({
    with: {
      lead: true,
      diagnosis: true,
    },
    orderBy: [desc(consultations.createdAt)],
    limit: ADMIN_PAGE_SIZE,
    offset: (currentPage - 1) * ADMIN_PAGE_SIZE,
  });

  return (
    <AdminShell title="상담 목록">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">회사</th>
              <th className="px-4 py-3 font-semibold">담당자</th>
              <th className="px-4 py-3 font-semibold">연락처</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">방식</th>
              <th className="px-4 py-3 font-semibold">신청일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/admin/consultations/${row.id}`}
                    className="text-primary"
                  >
                    {row.lead.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.lead.contactName}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${row.lead.email}`} className="text-primary">
                    {row.lead.email}
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.lead.phone ?? "전화번호 없음"}
                  </p>
                </td>
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
      <AdminPagination
        basePath="/admin/consultations"
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </AdminShell>
  );
}
