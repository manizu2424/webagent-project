"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import type { ApiResponse } from "@/lib/api/responses";
import { getClientErrorMessage, requestJson } from "@/lib/api/client";
import {
  DIAGNOSIS_MAX_POLL_DURATION_MS,
  DIAGNOSIS_POLL_INTERVAL_MS,
  getDiagnosisPollingDecision,
  getDiagnosisStatusMessage,
} from "@/lib/diagnosis/status";
import type { PublicDiagnosisData } from "@/types/diagnosis";
import { CompletedDiagnosisResult } from "./result-content";

type DiagnosisResponse = ApiResponse<PublicDiagnosisData>;

export function ResultPanel({ publicId }: { publicId: string }) {
  const [data, setData] = useState<DiagnosisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasWaitedTooLong, setHasWaitedTooLong] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const pollingStartedAt = useRef<number | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadResult() {
      try {
        const { data: result } = await requestJson<DiagnosisResponse>(
          `/api/diagnosis/${publicId}`,
          { signal: controller.signal },
          { timeoutMs: 8_000, retries: 1 },
        );

        if (!ignore) {
          setData(result);
          setLoadError("");
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(
            getClientErrorMessage(error, "진단 결과를 불러오지 못했습니다."),
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadResult();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [publicId, refreshIndex]);

  useEffect(() => {
    if (!data?.ok || !data.data) {
      return;
    }

    const status = data.data.diagnosis.status;

    if (status !== "PROCESSING") {
      pollingStartedAt.current = null;
      return;
    }

    pollingStartedAt.current ??= Date.now();
    const elapsedMs = Date.now() - pollingStartedAt.current;
    const decision = getDiagnosisPollingDecision(status, elapsedMs);

    if (decision === "long-wait") {
      const timer = window.setTimeout(() => setHasWaitedTooLong(true), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      const currentElapsedMs = Date.now() - (pollingStartedAt.current ?? Date.now());

      if (
        getDiagnosisPollingDecision(status, currentElapsedMs) === "long-wait"
      ) {
        setHasWaitedTooLong(true);
        return;
      }

      setRefreshIndex((current) => current + 1);
    }, Math.min(
      DIAGNOSIS_POLL_INTERVAL_MS,
      DIAGNOSIS_MAX_POLL_DURATION_MS - elapsedMs,
    ));

    return () => window.clearTimeout(timer);
  }, [data]);

  function retryLoad(restartPolling = false) {
    if (restartPolling) {
      pollingStartedAt.current = Date.now();
      setHasWaitedTooLong(false);
    }

    setLoadError("");
    setIsLoading(!data);
    setRefreshIndex((current) => current + 1);
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-4 font-semibold">진단 결과를 불러오고 있습니다.</p>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-bold">결과를 불러오지 못했습니다.</h1>
        <p className="mt-3 text-sm text-muted-foreground">{loadError}</p>
        <button
          type="button"
          onClick={() => retryLoad()}
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          다시 시도
        </button>
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
  const statusMessage = getDiagnosisStatusMessage(
    diagnosis.status,
    hasWaitedTooLong,
  );

  return (
    <div className="grid gap-6">
      {loadError && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => retryLoad()}
            className="mt-3 rounded-md border border-amber-300 px-3 py-2"
          >
            지금 다시 확인
          </button>
        </section>
      )}

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
          <h2 className="text-xl font-bold">{statusMessage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {statusMessage.description}
          </p>
        </section>
      ) : diagnosis.status === "PROCESSING" && hasWaitedTooLong ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold">{statusMessage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {statusMessage.description}
          </p>
          <button
            type="button"
            onClick={() => retryLoad(true)}
            className="mt-5 inline-flex rounded-md border px-4 py-3 text-sm font-semibold"
          >
            결과 다시 확인
          </button>
        </section>
      ) : diagnosis.status === "PROCESSING" ? (
        <section className="rounded-lg border bg-card p-6">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-bold">{statusMessage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {statusMessage.description}
          </p>
        </section>
      ) : diagnosis.status === "FAILED" ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold">{statusMessage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {statusMessage.description}
          </p>
        </section>
      ) : diagnosis.result ? (
        <CompletedDiagnosisResult result={diagnosis.result} />
      ) : (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold">분석 결과를 확인하고 있습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            완료 상태는 확인됐지만 결과 데이터가 아직 준비되지 않았습니다.
            잠시 후 다시 확인해 주세요.
          </p>
          <button
            type="button"
            onClick={() => retryLoad()}
            className="mt-5 inline-flex rounded-md border px-4 py-3 text-sm font-semibold"
          >
            다시 확인
          </button>
        </section>
      )}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-bold">입력한 반복 업무</h2>
        {diagnosis.repetitiveTasks.length > 0 ? (
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
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            입력한 반복 업무 정보가 없습니다.
          </p>
        )}
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
