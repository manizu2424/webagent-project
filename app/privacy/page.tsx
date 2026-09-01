import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-primary">
          WEBAGENT.KR
        </Link>
        <article className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-bold">개인정보처리방침</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            WEBAGENT.KR은 자동화 진단과 상담 진행을 위해 회사명, 담당자명,
            이메일, 연락처, 업무 현황 정보를 수집합니다.
          </p>
          <h2 className="mt-8 text-lg font-bold">수집 및 이용 목적</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            진단 결과 생성, 상담 일정 조율, 자동화 구축 범위 검토에 사용합니다.
          </p>
          <h2 className="mt-8 text-lg font-bold">보관 기간</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            상담 종료 또는 삭제 요청 시까지 보관하며, 법적 보관 의무가 있는
            경우 해당 기간 동안 보관합니다.
          </p>
          <h2 className="mt-8 text-lg font-bold">문의</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            개인정보 삭제 또는 정정 요청은 운영자 이메일로 접수합니다.
          </p>
        </article>
      </div>
    </main>
  );
}
