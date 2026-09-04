import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { diagnoses } from "@/db/schema";
import { diagnosisStatusValues } from "@/lib/constants/status";
import { getAdminSession } from "@/lib/auth/admin";
import { updateDiagnosisStatus } from "../../actions";

export const dynamic = "force-dynamic";

type AdminDiagnosisDetailPageProps = {
  params: Promise<{
    publicId: string;
  }>;
};

export default async function AdminDiagnosisDetailPage({
  params,
}: AdminDiagnosisDetailPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { publicId } = await params;
  const diagnosis = await getDb().query.diagnoses.findFirst({
    where: eq(diagnoses.publicId, publicId),
    with: {
      lead: true,
      result: true,
      consultations: true,
      automationLogs: true,
    },
  });

  if (!diagnosis) {
    notFound();
  }

  return (
    <AdminShell title={diagnosis.lead.companyName}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-bold">진단 정보</h2>
          <form action={updateDiagnosisStatus} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="publicId" value={diagnosis.publicId} />
            <select
              name="status"
              defaultValue={diagnosis.status}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {diagnosisStatusValues.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              상태 변경
            </button>
          </form>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="상태" value={diagnosis.status} />
            <Row label="담당자" value={diagnosis.lead.contactName} />
            <Row label="이메일" value={diagnosis.lead.email} />
            <Row label="연락처" value={diagnosis.lead.phone ?? "-"} />
            <Row label="반복 업무" value={diagnosis.repetitiveTasks.join(", ") || "-"} />
            <Row label="문제점" value={diagnosis.painPoint ?? "-"} />
          </dl>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-bold">AI 결과</h2>
          {diagnosis.result ? (
            <dl className="mt-4 grid gap-3 text-sm">
              <Row label="점수" value={`${diagnosis.result.automationScore}`} />
              <Row label="난이도" value={diagnosis.result.difficulty ?? "-"} />
              <Row
                label="요약"
                value={diagnosis.result.aiSummary ?? "-"}
              />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              아직 저장된 AI 결과가 없습니다.
            </p>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">원본 응답</h2>
        <pre className="mt-4 overflow-auto rounded-md bg-foreground p-4 text-xs leading-5 text-background">
          {JSON.stringify(diagnosis.rawAnswers, null, 2)}
        </pre>
      </section>

      <section className="mt-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">자동화 실행 로그</h2>
        {diagnosis.automationLogs.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {diagnosis.automationLogs.map((log) => (
              <div key={log.id} className="rounded-md border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {log.workflowName} · {log.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.createdAt.toLocaleString("ko-KR")}
                  </p>
                </div>
                {log.errorMessage && (
                  <p className="mt-2 text-sm text-red-700">
                    {log.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            저장된 자동화 실행 로그가 없습니다.
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          MVP에서는 실패 원인을 확인한 뒤 사용자에게 새 진단 제출을 안내합니다.
        </p>
      </section>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
