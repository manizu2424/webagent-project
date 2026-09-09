import Link from "next/link";

export function AdminPagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="페이지 이동"
      className="mt-4 flex items-center justify-between gap-4"
    >
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="rounded-md border px-4 py-2 text-sm font-semibold"
        >
          이전
        </Link>
      ) : (
        <span className="rounded-md border px-4 py-2 text-sm font-semibold opacity-40">
          이전
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="rounded-md border px-4 py-2 text-sm font-semibold"
        >
          다음
        </Link>
      ) : (
        <span className="rounded-md border px-4 py-2 text-sm font-semibold opacity-40">
          다음
        </span>
      )}
    </nav>
  );
}
