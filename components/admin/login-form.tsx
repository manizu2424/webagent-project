"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ApiResponse } from "@/lib/api/responses";
import { getClientErrorMessage, requestJson } from "@/lib/api/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const { response, data: result } = await requestJson<
        ApiResponse<{ authenticated: true }>
      >(
        "/api/admin/login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
        { timeoutMs: 10_000 },
      );

      if (!response.ok || !result.ok) {
        setError(result.ok ? "로그인에 실패했습니다." : result.error);
        return;
      }

      router.push("/admin/diagnoses");
      router.refresh();
    } catch (error) {
      setError(getClientErrorMessage(error, "로그인에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border bg-card p-6 shadow-sm">
      <label className="grid gap-2 text-sm font-semibold">
        이메일
        <input
          className="h-12 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        비밀번호
        <input
          className="h-12 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        로그인
      </button>
    </form>
  );
}
