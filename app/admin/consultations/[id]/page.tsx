import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { consultations } from "@/db/schema";
import { getAdminSession } from "@/lib/auth/admin";
import { consultationStatusValues } from "@/lib/constants/status";
import {
  updateConsultationMemo,
  updateConsultationStatus,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const consultation = await getDb().query.consultations.findFirst({
    where: eq(consultations.id, id),
    with: {
      lead: true,
      diagnosis: true,
    },
  });

  if (!consultation) {
    notFound();
  }

  return (
    <AdminShell title={`${consultation.lead.companyName} 상담`}>
      <div className="mb-4">
        <Link
          href="/admin/consultations"
          className="text-sm font-semibold text-primary"
        >
          ← 상담 목록
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">상담 정보</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {consultation.diagnosis
                  ? "연결된 진단의 기존 연락처를 사용합니다."
                  : "독립 상담 신청에 입력된 연락처입니다."}
              </p>
            </div>
            <form action={updateConsultationStatus} className="flex gap-2">
              <input
                type="hidden"
                name="consultationId"
                value={consultation.id}
              />
              <select
                name="status"
                defaultValue={consultation.status}
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {consultationStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                상태 저장
              </button>
            </form>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <Row label="상태" value={consultation.status} />
            <Row label="회사" value={consultation.lead.companyName} />
            <Row label="담당자" value={consultation.lead.contactName} />
            <Row
              label="이메일"
              value={
                <a
                  href={`mailto:${consultation.lead.email}`}
                  className="text-primary"
                >
                  {consultation.lead.email}
                </a>
              }
            />
            <Row label="연락처" value={consultation.lead.phone ?? "-"} />
            <Row label="상담 방식" value={consultation.consultationType ?? "-"} />
            <Row
              label="희망 일정"
              value={consultation.preferredDate?.toLocaleString("ko-KR") ?? "-"}
            />
            <Row
              label="신청일"
              value={consultation.createdAt.toLocaleString("ko-KR")}
            />
            <Row
              label="연결 진단"
              value={
                consultation.diagnosis ? (
                  <Link
                    href={`/admin/diagnoses/${consultation.diagnosis.publicId}`}
                    className="text-primary"
                  >
                    {consultation.diagnosis.publicId}
                  </Link>
                ) : (
                  "독립 상담"
                )
              }
            />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-bold">관리자 메모</h2>
          <form action={updateConsultationMemo} className="mt-4 grid gap-3">
            <input
              type="hidden"
              name="consultationId"
              value={consultation.id}
            />
            <textarea
              name="memo"
              defaultValue={consultation.memo ?? ""}
              maxLength={5_000}
              className="min-h-56 rounded-md border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              placeholder="연락 결과, 일정, 후속 조치 등을 기록하세요."
            />
            <button
              type="submit"
              className="justify-self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              메모 저장
            </button>
          </form>
        </section>
      </div>

      <section className="mt-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-bold">요청 내용</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {consultation.message ?? "입력된 요청 내용이 없습니다."}
        </p>
      </section>
    </AdminShell>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
