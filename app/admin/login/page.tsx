import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/auth/admin";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin/diagnoses");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-primary">
          WEBAGENT.KR
        </Link>
        <h1 className="mt-6 text-3xl font-bold">관리자 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          `.env`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET` 설정이 필요합니다.
        </p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
