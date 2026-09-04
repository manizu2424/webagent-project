"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import type { ApiResponse } from "@/lib/api/responses";
import { shouldPollDiagnosis } from "@/lib/diagnosis/status";
import type { PublicDiagnosisData } from "@/types/diagnosis";

type DiagnosisResponse = ApiResponse<PublicDiagnosisData>;

export function ResultPanel({ publicId }: { publicId: string }) {
  const [data, setData] = useState<DiagnosisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadResult() {
      const response = await fetch(`/api/diagnosis/${publicId}`);
      const result = await response.json();

      if (!ignore) {
        setData(result);
        setIsLoading(false);
      }
    }

    void loadResult();

    return () => {
      ignore = true;
    };
  }, [publicId, refreshIndex]);

  useEffect(() => {
    if (!data?.ok) {
      return;
    }

    const status = data.data?.diagnosis.status;

    if (!status || !shouldPollDiagnosis(status)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRefreshIndex((current) => current + 1);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-4 font-semibold">진단 결과를 불러오고 있습니다.</p>
      </div>
    );
  }

  if (!data?.ok || !data.data) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-bold">결과를 찾을 수 없습니다.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          링크가 올바른지 확인하거나 다시 진단을 제출해 주세요.
        </p>
        <Link
          href="/diagnosis"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          다시 진단하기
        </Link>
      </div>
    );
  }

  const diagnosis = data.data.diagnosis;
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">
          {diagnosis.lead.companyName}
        </p>
        <h1 className="mt-2 text-3xl font-bold">자동화 진단 결과</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          진단 ID: {diagnosis.publicId}
        </p>
      </section>

      {diagnosis.status === "SUBMITTED" ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold">진단이 접수되었습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            자동 분석 연결이 설정되지 않아 담당자가 제출 내용을 확인한 뒤
            안내드릴 예정입니다.
          </p>
        </section>
      ) : diagnosis.status === "PROCESSING" ? (
        <section className="rounded-lg border bg-card p-6">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-bold">AI 분석을 기다리고 있습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            n8n과 AI 분석 결과가 들어오면 이 화면이 자동으로 갱신됩니다.
          </p>
        </section>
      ) : diagnosis.status === "FAILED" ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold">분석에 실패했습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            담당자가 제출 내용을 확인한 뒤 다시 연락드릴 수 있습니다.
          </p>
        </section>
      ) : (
        <section className="rounded-lg border bg-card p-6">
          <p className="text-sm font-semibold text-muted-foreground">
            자동화 가능 점수
          </p>
          <p className="mt-2 text-5xl font-bold text-primary">
            {diagnosis.result?.automationScore ?? 0}
          </p>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {diagnosis.result?.aiSummary ?? "요약 결과가 아직 없습니다."}
          </p>
        </section>
      )}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-bold">입력한 반복 업무</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {diagnosis.repetitiveTasks.map((task) => (
            <span
              key={task}
              className="rounded-full border px-3 py-1 text-sm font-semibold"
            >
              {task}
            </span>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/consultation?diagnosis=${diagnosis.publicId}`}
          className="inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          상담 신청하기
        </Link>
        <Link
          href="/diagnosis"
          className="inline-flex rounded-md border px-5 py-3 text-sm font-semibold"
        >
          새 진단 시작
        </Link>
      </div>
    </div>
  );
}
