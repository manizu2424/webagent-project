"use client";

import { FormEvent, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { ApiResponse } from "@/lib/api/responses";
import { getClientErrorMessage, requestJson } from "@/lib/api/client";

export function ConsultationForm({
  initialDiagnosisPublicId,
}: {
  initialDiagnosisPublicId?: string;
}) {
  const [form, setForm] = useState({
    diagnosisPublicId: initialDiagnosisPublicId ?? "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    preferredDate: "",
    consultationType: "online",
    message: "",
    privacyConsent: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const idempotencyKey = useRef<string | null>(null);
  const usesDiagnosisContact = Boolean(form.diagnosisPublicId.trim());

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    idempotencyKey.current = null;
    setForm((current) => ({ ...current, [key]: value }));
    setError("");

    if (status === "error") {
      setStatus("idle");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const diagnosisPublicId = form.diagnosisPublicId.trim();
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const { response, data: result } = await requestJson<
        ApiResponse<{ consultationId: string }>
      >(
        "/api/consultation",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": idempotencyKey.current,
          },
          body: JSON.stringify({
            diagnosisPublicId: diagnosisPublicId || undefined,
            ...(diagnosisPublicId
              ? {}
              : {
                  companyName: form.companyName,
                  contactName: form.contactName,
                  email: form.email,
                  phone: form.phone,
                }),
            preferredDate: form.preferredDate || undefined,
            consultationType: form.consultationType,
            message: form.message,
            privacyConsent: form.privacyConsent,
          }),
        },
        { timeoutMs: 12_000, retries: 1 },
      );

      if (!response.ok || !result.ok) {
        setStatus("error");
        setError(result.ok ? "상담 신청에 실패했습니다." : result.error);
        return;
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setError(getClientErrorMessage(error, "상담 신청에 실패했습니다."));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border bg-card p-6 shadow-sm">
      <Field label="진단 ID" value={form.diagnosisPublicId} onChange={(value) => updateField("diagnosisPublicId", value)} placeholder="진단 결과에서 자동 입력됩니다." />
      {usesDiagnosisContact ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          이 상담은 진단에 저장된 회사·담당자·이메일·연락처를 사용합니다.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="회사명" value={form.companyName} onChange={(value) => updateField("companyName", value)} />
            <Field label="담당자 이름" value={form.contactName} onChange={(value) => updateField("contactName", value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="이메일" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
            <Field label="연락처" value={form.phone} onChange={(value) => updateField("phone", value)} />
          </div>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="희망 일정" type="datetime-local" value={form.preferredDate} onChange={(value) => updateField("preferredDate", value)} />
        <label className="grid gap-2 text-sm font-semibold">
          상담 방식
          <select
            className="h-12 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
            value={form.consultationType}
            onChange={(event) =>
              updateField("consultationType", event.target.value)
            }
          >
            <option value="online">온라인 미팅</option>
            <option value="phone">전화 상담</option>
            <option value="email">이메일 상담</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        요청 내용
        <textarea
          className="min-h-32 rounded-md border bg-background px-3 py-3 text-sm font-normal outline-none focus:border-primary"
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
        />
      </label>
      <label className="flex items-start gap-3 rounded-md border p-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.privacyConsent}
          onChange={(event) =>
            updateField("privacyConsent", event.target.checked)
          }
          className="mt-1 h-4 w-4 accent-[var(--primary)]"
        />
        개인정보 수집 및 이용에 동의합니다.
      </label>

      {status === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {status === "success" && (
        <p className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check className="h-4 w-4" />
          상담 신청이 접수되었습니다.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        상담 신청
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        className="h-12 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
