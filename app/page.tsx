import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const serviceHighlights = [
  {
    title: "AI 자동화 진단",
    description: "반복 업무를 입력하면 자동화 가능성을 구조화해 분석합니다.",
    icon: Bot,
  },
  {
    title: "n8n 업무 연결",
    description: "진단 데이터를 자동화 워크플로와 AI 분석으로 연결합니다.",
    icon: Workflow,
  },
  {
    title: "안전한 데이터 관리",
    description: "진단 결과와 상담 정보를 자동화 시스템과 분리해 안정적으로 관리합니다.",
    icon: ShieldCheck,
  },
];

const painPoints = [
  "상담 문의와 고객 정보가 여러 채널에 흩어짐",
  "반복 보고서, 견적, 안내 메시지를 매번 수작업 처리",
  "n8n과 AI를 도입하고 싶지만 어디서 시작할지 불명확",
];

const processSteps = [
  "반복 업무 입력",
  "자동화 가능성 분석",
  "AI 결과 확인",
  "상담 및 구축 범위 확정",
];

const cases = [
  {
    title: "문의 분류 자동화",
    description: "폼, 이메일, 메신저 문의를 유형별로 분류하고 상담 준비 목록을 만듭니다.",
  },
  {
    title: "견적 초안 생성",
    description: "고객 요구사항을 기준으로 견적 항목과 작업 범위 초안을 정리합니다.",
  },
  {
    title: "관리자 알림",
    description: "진단 완료와 상담 신청을 자동화 워크플로로 전달해 후속 처리를 줄입니다.",
  },
];

const faqs = [
  {
    question: "진단만 받아도 되나요?",
    answer: "가능합니다. 진단 결과를 확인한 뒤 상담 여부를 선택하면 됩니다.",
  },
  {
    question: "n8n을 이미 쓰고 있어도 가능한가요?",
    answer: "가능합니다. 기존 워크플로를 기준으로 개선 지점을 분리해 검토합니다.",
  },
  {
    question: "AI API 키는 어디에서 사용하나요?",
    answer: "MVP 기준 AI 호출은 n8n에서 담당하고 Next.js 앱은 결과 저장과 표시를 맡습니다.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/80">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-base font-bold text-primary">
            WEBAGENT.KR
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/consultation"
              className="hidden rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              상담 신청
            </Link>
            <Link
              href="/diagnosis"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              무료 진단
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-12 px-6 py-14 lg:grid-cols-[1fr_420px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            WEBAGENT.KR MVP
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            AI로 일하는 회사를 만듭니다.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            홈페이지 제작부터 n8n 업무 자동화, AI Agent 구축까지 반복
            업무를 줄이는 실전형 자동화 시스템을 준비합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/diagnosis"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              무료 자동화 진단 시작
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold transition hover:bg-card"
            >
              상담 신청
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                자동화 진단 보드
              </p>
              <p className="mt-1 text-2xl font-bold">72점</p>
            </div>
            <ClipboardList className="h-10 w-10 text-primary" />
          </div>
          <div className="mt-5 space-y-4">
            {["문의 분류", "견적 초안", "상담 알림"].map((item, index) => (
              <div key={item} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">{item}</span>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">
                    {index === 0 ? "즉시 가능" : "설계 필요"}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${76 - index * 14}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 md:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Problem</p>
            <h2 className="mt-3 text-2xl font-bold">
              자동화는 도구보다 업무 구조가 먼저입니다.
            </h2>
          </div>
          <div className="grid gap-3">
            {painPoints.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-14 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-semibold text-muted-foreground">Before</p>
          <h2 className="mt-3 text-2xl font-bold">수작업 중심 운영</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            고객 문의, 업무 정리, 상담 준비가 담당자 기억과 반복 입력에
            의존합니다.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-semibold text-primary">After</p>
          <h2 className="mt-3 text-2xl font-bold">진단 기반 자동화 운영</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            반복 업무를 진단하고 n8n, AI, 데이터 저장 구조로 후속 처리를
            자동화합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {serviceHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-lg border bg-card p-5 text-card-foreground"
              >
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Use Cases</p>
            <h2 className="mt-3 text-2xl font-bold">먼저 자동화할 업무</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {cases.map((item) => (
              <article key={item.title} className="rounded-lg border bg-background p-5">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-primary-foreground">
              Process
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              진단 결과를 상담 가능한 실행 범위로 전환합니다.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-white/15 p-4">
                <span className="text-sm font-semibold text-primary-foreground">
                  0{index + 1}
                </span>
                <p className="mt-2 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold text-primary">FAQ</p>
            <h2 className="mt-3 text-2xl font-bold">자주 묻는 질문</h2>
          </div>
          <div className="grid gap-3">
            {faqs.map((item) => (
              <details key={item.question} className="rounded-lg border bg-card p-5">
                <summary className="cursor-pointer text-sm font-bold">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Start</p>
            <h2 className="mt-2 text-2xl font-bold">
              지금 반복 업무를 진단해 보세요.
            </h2>
          </div>
          <Link
            href="/diagnosis"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            무료 진단 시작
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>WEBAGENT.KR</span>
        <Link href="/privacy" className="hover:text-foreground">
          개인정보처리방침
        </Link>
      </footer>
    </main>
  );
}
