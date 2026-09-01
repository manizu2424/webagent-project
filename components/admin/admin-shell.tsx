import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <Link href="/admin/diagnoses" className="text-sm font-semibold text-primary">
              WEBAGENT.KR Admin
            </Link>
            <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin/diagnoses" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-card">
              진단
            </Link>
            <Link href="/admin/consultations" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-card">
              상담
            </Link>
            <LogoutButton />
          </nav>
        </header>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
