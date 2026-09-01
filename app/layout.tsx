import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEBAGENT.KR",
  description: "AI 업무 자동화 진단과 상담을 연결하는 WEBAGENT.KR MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
