import Link from "next/link";
import { ResultPanel } from "@/components/diagnosis/result-panel";

type ResultPageProps = {
  params: Promise<{
    publicId: string;
  }>;
};

export default async function ResultPage({ params }: ResultPageProps) {
  const { publicId } = await params;

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-primary">
          WEBAGENT.KR
        </Link>
        <div className="mt-8">
          <ResultPanel publicId={publicId} />
        </div>
      </div>
    </main>
  );
}
