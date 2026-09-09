import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { diagnoses } from "@/db/schema";
import { getAdminSession } from "@/lib/auth/admin";
import { AdminPagination } from "@/components/admin/pagination";
import { ADMIN_PAGE_SIZE, getTotalPages, parsePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminDiagnosesPage({
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
  const [{ total }] = await db.select({ total: count() }).from(diagnoses);
  const totalPages = getTotalPages(total);
  const currentPage = Math.min(requestedPage, totalPages);
  const rows = await db.query.diagnoses.findMany({
    with: {
      lead: true,
      result: true,
    },
    orderBy: [desc(diagnoses.createdAt)],
    limit: ADMIN_PAGE_SIZE,
    offset: (currentPage - 1) * ADMIN_PAGE_SIZE,
  });

  return (
    <AdminShell title="진단 목록">
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">회사</th>
              <th className="px-4 py-3 font-semibold">담당자</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">점수</th>
              <th className="px-4 py-3 font-semibold">제출일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/diagnoses/${row.publicId}`}
                    className="font-semibold text-primary"
                  >
                    {row.lead.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.lead.contactName}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  {row.result?.automationScore ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {row.createdAt.toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination
        basePath="/admin/diagnoses"
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </AdminShell>
  );
}
