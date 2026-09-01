import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-3 text-3xl font-bold">페이지를 찾을 수 없습니다.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          주소가 변경되었거나 아직 준비되지 않은 페이지입니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          홈으로 이동
        </Link>
      </div>
    </main>
  );
}
