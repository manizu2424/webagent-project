"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2 } from "lucide-react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const response = await fetch("/api/consultation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        preferredDate: form.preferredDate || undefined,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      setStatus("error");
      setError(result.error ?? "상담 신청에 실패했습니다.");
      return;
    }

    setStatus("success");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border bg-card p-6 shadow-sm">
      <Field label="진단 ID" value={form.diagnosisPublicId} onChange={(value) => setForm({ ...form, diagnosisPublicId: value })} placeholder="진단 결과에서 자동 입력됩니다." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="회사명" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} />
        <Field label="담당자 이름" value={form.contactName} onChange={(value) => setForm({ ...form, contactName: value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="이메일" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Field label="연락처" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="희망 일정" type="datetime-local" value={form.preferredDate} onChange={(value) => setForm({ ...form, preferredDate: value })} />
        <label className="grid gap-2 text-sm font-semibold">
          상담 방식
          <select
            className="h-12 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
            value={form.consultationType}
            onChange={(event) =>
              setForm({ ...form, consultationType: event.target.value })
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
          onChange={(event) => setForm({ ...form, message: event.target.value })}
        />
      </label>
      <label className="flex items-start gap-3 rounded-md border p-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.privacyConsent}
          onChange={(event) =>
            setForm({ ...form, privacyConsent: event.target.checked })
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
