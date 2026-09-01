"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

const steps = [
  "회사 정보",
  "업무 환경",
  "반복 업무",
  "자동화 범위",
  "연락처",
];

type FormState = {
  companyName: string;
  industry: string;
  employeeCount: string;
  websiteStatus: string;
  currentTools: string[];
  repetitiveTasks: string[];
  dailyHours: string;
  monthlyVolume: string;
  painPoint: string;
  budgetRange: string;
  contactName: string;
  email: string;
  phone: string;
  consultingMethod: string;
  privacyConsent: boolean;
};

const initialForm: FormState = {
  companyName: "",
  industry: "",
  employeeCount: "",
  websiteStatus: "",
  currentTools: [],
  repetitiveTasks: [],
  dailyHours: "",
  monthlyVolume: "",
  painPoint: "",
  budgetRange: "",
  contactName: "",
  email: "",
  phone: "",
  consultingMethod: "online",
  privacyConsent: false,
};

const toolOptions = ["Google Sheets", "Excel", "Notion", "Slack", "카카오톡", "기타"];
const taskOptions = ["문의 응대", "견적 작성", "보고서 정리", "데이터 입력", "일정 조율", "고객 알림"];

export function DiagnosisWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function toggleArrayField(key: "currentTools" | "repetitiveTasks", value: string) {
    const values = form[key];
    updateField(
      key,
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  }

  function validateCurrentStep() {
    if (step === 0 && !form.companyName.trim()) {
      return "회사명을 입력해 주세요.";
    }

    if (step === 2 && form.repetitiveTasks.length === 0) {
      return "자동화하고 싶은 반복 업무를 하나 이상 선택해 주세요.";
    }

    if (step === 4) {
      if (!form.contactName.trim()) {
        return "담당자 이름을 입력해 주세요.";
      }

      if (!form.email.includes("@")) {
        return "이메일 주소를 확인해 주세요.";
      }

      if (!form.privacyConsent) {
        return "개인정보 수집 및 이용에 동의해 주세요.";
      }
    }

    return "";
  }

  function goNext() {
    const validationError = validateCurrentStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateCurrentStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const payload = {
      ...form,
      employeeCount: form.employeeCount ? Number(form.employeeCount) : undefined,
      dailyHours: form.dailyHours ? Number(form.dailyHours) : undefined,
      monthlyVolume: form.monthlyVolume ? Number(form.monthlyVolume) : undefined,
    };

    const response = await fetch("/api/diagnosis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      setIsSubmitting(false);
      setError(result.error ?? "진단 제출에 실패했습니다.");
      return;
    }

    router.push(`/diagnosis/result/${result.data.publicId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">
            {step + 1} / {steps.length}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{steps[step]}</h1>
        </div>
        <div className="h-2 w-full rounded-full bg-muted sm:w-56">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 min-h-[360px]">
        {step === 0 && (
          <div className="grid gap-4">
            <Field label="회사명" value={form.companyName} onChange={(value) => updateField("companyName", value)} required />
            <Field label="업종" value={form.industry} onChange={(value) => updateField("industry", value)} placeholder="예: 제조, 교육, 병원, 쇼핑몰" />
            <Field label="직원 수" type="number" value={form.employeeCount} onChange={(value) => updateField("employeeCount", value)} />
            <SelectField label="홈페이지 상태" value={form.websiteStatus} onChange={(value) => updateField("websiteStatus", value)} options={["없음", "운영 중", "리뉴얼 필요", "제작 예정"]} />
          </div>
        )}

        {step === 1 && (
          <CheckboxGrid
            label="현재 업무에 사용하는 도구"
            options={toolOptions}
            values={form.currentTools}
            onToggle={(value) => toggleArrayField("currentTools", value)}
          />
        )}

        {step === 2 && (
          <CheckboxGrid
            label="자동화하고 싶은 반복 업무"
            options={taskOptions}
            values={form.repetitiveTasks}
            onToggle={(value) => toggleArrayField("repetitiveTasks", value)}
          />
        )}

        {step === 3 && (
          <div className="grid gap-4">
            <Field label="하루 반복 업무 시간" type="number" value={form.dailyHours} onChange={(value) => updateField("dailyHours", value)} placeholder="예: 2" />
            <Field label="월 처리 건수" type="number" value={form.monthlyVolume} onChange={(value) => updateField("monthlyVolume", value)} placeholder="예: 100" />
            <TextArea label="가장 불편한 지점" value={form.painPoint} onChange={(value) => updateField("painPoint", value)} />
            <SelectField label="예산 범위" value={form.budgetRange} onChange={(value) => updateField("budgetRange", value)} options={["미정", "100만원 이하", "100-300만원", "300-700만원", "700만원 이상"]} />
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <Field label="담당자 이름" value={form.contactName} onChange={(value) => updateField("contactName", value)} required />
            <Field label="이메일" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
            <Field label="연락처" value={form.phone} onChange={(value) => updateField("phone", value)} />
            <SelectField label="선호 상담 방식" value={form.consultingMethod} onChange={(value) => updateField("consultingMethod", value)} options={["online", "phone", "email"]} />
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
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0 || isSubmitting}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          이전
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            다음
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            진단 제출
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        required={required}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        className="h-12 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">선택</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        className="min-h-32 rounded-md border bg-background px-3 py-3 text-sm font-normal outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckboxGrid({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option);

          return (
            <label
              key={option}
              className="flex h-14 items-center gap-3 rounded-md border px-4 text-sm font-semibold"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
