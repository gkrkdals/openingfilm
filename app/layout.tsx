import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://openingfilm.co.kr"),
  title: "오프닝필름 | 본식 DVD & 웨딩 영상 제작 스튜디오",
  description: "결혼식이라는 인생 최고의 영화, 그 시작을 기록합니다. 거품 없는 정직한 가격의 1인 3캠 4K 본식 DVD 단일 구성 스튜디오.",
  keywords: ["본식 DVD", "본식영상", "웨딩영상", "웨딩DVD", "결혼식영상", "오프닝필름"],
  alternates: {
    canonical: "https://openingfilm.co.kr",
  },
  openGraph: {
    title: "오프닝필름 | 본식 DVD & 웨딩 영상 제작 스튜디오",
    description: "결혼식이라는 인생 최고의 영화, 그 시작을 기록합니다. 거품 없는 정직한 가격의 1인 3캠 4K 본식 DVD 단일 구성 스튜디오.",
    url: "https://openingfilm.co.kr",
    siteName: "오프닝필름",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "오프닝필름 로고",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--paper)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
