"use client";

import { RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary">Error</p>
        <h1 className="mt-3 text-3xl font-bold">문제가 발생했습니다.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </button>
      </div>
    </main>
  );
}
