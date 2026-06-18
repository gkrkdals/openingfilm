import Image from "next/image";

import FloatingNav from "./components/FloatingNav";
import PromiseCards from "./components/PromiseCards";
import PriceSection from "./components/PriceSection";
import PortfolioSection from "./components/PortfolioSection";
import ReservationForm from "./components/ReservationForm";
import ReviewSection from "./components/ReviewSection";
import prisma from "@/utils/db";

// Force dynamic fetch so edits are shown instantly
export const dynamic = "force-dynamic";

const DEFAULT_CONTENT: Record<string, string> = {
  hero_title_1: "당신의 가장 아름다운 오프닝을 기록합니다.",
  hero_title_2: "오프닝필름",
  hero_desc: "결혼이라는 인생 최고의 영화, 그 시작을 기록합니다. 자연스러운 미소와 눈물, 그날의 공기를 담백하게 담아낼게요.",
  hero_youtube_id: "hUZnXJjCogI",
  about_title: "결혼식이라는 인생 최고의 영화, 그 아름다운 오프닝을 기록합니다.",
  about_text_1: "결혼 준비를 시작하며 수많은 선택지와 마주할 때, 가장 설레어야 할 순간에 밀려오는 예산의 벽과 복잡한 업체의 구성들로 지치진 않으셨나요?",
  about_text_2: "화려하게 포장된 무거운 패키지, 알 수 없는 기준의 추가 비용들 속에서 \"정작 중요한 본질은 무엇일까\" 고민했습니다. 본식 영상의 본질은 화려한 연출이나 비싼 가격이 아니라, 그날 두 사람이 나눈 눈빛, 떨리는 손길, 그리고 축하해 주러 오신 소중한 분들의 따뜻한 미소를 온전히 담아내는 것이라 믿기 때문입니다.",
  about_text_3: "그래서 우리는 거품을 걷어내기로 했습니다. 화려한 수식어 대신 정직한 가격을, 복잡한 구성 대신 직관적이고 심플한 시스템을 선택했습니다. 가격의 문턱은 낮추었지만, 그날의 감동을 포착하는 시선의 깊이는 결코 가볍지 않습니다.",
  about_bottom: "새로운 시작을 앞둔 두 사람을 온 마음으로 축하합니다.",
  price_title: "1인 3캠 4K 촬영부터 숏폼까지 올인원 [단일] 구성",
  price_val: "360,000원",
  contact_kakao_url: "http://pf.kakao.com/_DaAbX",
  contact_phone: "010-4111-9775 / openingfilm@naver.com",
};

export default async function Home() {
  let content = { ...DEFAULT_CONTENT };
  let portfolios: { id: string; type: string; title: string; youtube_id: string }[] = [];
  let reviews: { id: string; author: string; content: string }[] = [];

  try {
    // 1. Fetch site content
    const contentData = await prisma.siteContent.findMany();
    contentData?.forEach((item: any) => {
      content[item.key] = item.value;
    });

    // 2. Fetch portfolios
    const portData = await prisma.portfolio.findMany({
      orderBy: { orderIndex: "asc" },
    });
    if (portData) {
      portfolios = portData.map((item: any) => ({
        id: item.id,
        title: item.title,
        youtube_id: item.youtubeId,
        type: item.type,
      }));
    }

    // 3. Fetch reviews
    const revData = await prisma.review.findMany({
      orderBy: { orderIndex: "asc" },
    });
    if (revData) {
      reviews = revData.map((item: any) => ({
        id: item.id,
        author: item.author,
        content: item.content,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch data from SQLite via Prisma:", err);
  }

  return (
    <div className="relative flex-1 overflow-x-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="pointer-events-none absolute left-0 top-0 h-[560px] w-[560px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle_at_center,rgba(184,163,123,0.25),rgba(248,246,242,0))]" />
      <div className="pointer-events-none absolute right-0 top-24 h-[520px] w-[520px] translate-x-1/3 rounded-full bg-[radial-gradient(circle_at_center,rgba(17,17,15,0.2),rgba(248,246,242,0))]" />

      <header className="border-b border-black/5 bg-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex flex-col leading-none">
            <Image
              src="/logo.png"
              alt="오프닝필름"
              width={200}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium uppercase tracking-[0.2em] md:flex">
            <a className="transition hover:text-[var(--accent)]" href="#about">
              About
            </a>
            <a className="transition hover:text-[var(--accent)]" href="#price">
              Price
            </a>
            <a className="transition hover:text-[var(--accent)]" href="#portfolio">
              Portfolio
            </a>
            <a className="transition hover:text-[var(--accent)]" href="#review">
              Review
            </a>
            <a className="transition hover:text-[var(--accent)]" href="#reservation">
              Reservation
            </a>
          </nav>
        </div>
      </header>

      <FloatingNav />

      <main id="top" className="mx-auto flex w-full max-w-6xl flex-col px-6">
        <section className="grid gap-14 pb-24 pt-20 md:grid-cols-[1.1fr_0.9fr] md:pt-28">
          <div className="flex flex-col gap-8">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">
              Opening Film Studio
            </p>
            <h1 className="text-xl font-semibold leading-[1.25] md:text-4xl md:leading-[1.32]">
              <span className="rise-up rise-up-1 inline-block text-sm md:text-3xl">
                {content.hero_title_1}
              </span>
              <br />
              <span className="font-display rise-up rise-up-2 inline-block">
                {content.hero_title_2}
              </span>
            </h1>
            <div className="flex flex-col gap-4 text-sm text-[var(--muted)] md:text-lg">
              <p className="whitespace-pre-wrap leading-relaxed">
                {content.hero_desc}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                className="inline-flex items-center gap-3 rounded-full border border-black/30 px-7 py-3 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                href={content.contact_kakao_url}
                target="_blank"
                rel="noreferrer"
              >
                카카오톡 빠른 문의
                <span aria-hidden>→</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                <span className="h-px w-12 bg-[var(--border)]" />
                카카오톡 오프닝필름 / DM
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full border border-black/10" />
            <div className="absolute right-6 top-10 h-10 w-10 rounded-full bg-[var(--mist)]" />
            <div className="fade-in relative mx-auto aspect-[10/16] w-[92%] overflow-hidden rounded-[32px] shadow-2xl md:mx-0">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${content.hero_youtube_id}?autoplay=1&mute=1&playsinline=1`}
                title="오프닝필름 쇼츠"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </section>

        <section
          id="about"
          className="relative -mx-6 overflow-hidden bg-[var(--mist)] px-6 py-20 text-[var(--ink)]"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">About</p>
              <h2 className="font-display text-xl md:text-4xl leading-snug">
                {content.about_title.split("\n").map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx < content.about_title.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </h2>
            </div>
            <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] text-center md:text-left">
              <div className="space-y-4 text-[var(--muted)] leading-relaxed">
                <div className="moving-line moving-line-right moving-line-beige" aria-hidden="true" />
                <p className="whitespace-pre-wrap">{content.about_text_1}</p>
                <p className="whitespace-pre-wrap">{content.about_text_2}</p>
                <p className="whitespace-pre-wrap">{content.about_text_3}</p>
                <div className="moving-line moving-line-left moving-line-beige" aria-hidden="true" />
              </div>
              <PromiseCards />
            </div>
            <div className="text-center font-semibold tracking-wide leading-relaxed text-2xl text-[var(--muted)]">
              {content.about_bottom}
            </div>
          </div>
        </section>

        <PriceSection priceTitle={content.price_title} priceVal={content.price_val} />

        <PortfolioSection videos={portfolios} />

        <ReviewSection reviews={reviews} />

        <section
          id="reservation"
          className="mt-20 overflow-hidden rounded-[36px] bg-[var(--mist)] text-[var(--ink)]"
        >
          <div className="grid gap-12 px-8 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-14">
            <div className="flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Reservation</p>
              <h3 className="text-2xl font-semibold leading-9 md:text-3xl">
                오프닝필름 예약 신청
                <br />
                가장 아름다운 시작을 함께 준비합니다.
              </h3>
              <p className="text-sm text-[var(--muted)]">
                문의: 카카오톡 "오프닝필름" / DM
              </p>
            </div>
            <ReservationForm />
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-16 w-full max-w-6xl px-6 pb-12 text-sm text-[var(--muted)]">
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-black/10 pt-6">
          <div>
            <p>오프닝필름</p>
            <p>문의: {content.contact_phone}</p>
            <a
              className="text-sm transition hover:text-[var(--accent)]"
              href={content.contact_kakao_url}
              target="_blank"
              rel="noreferrer"
            >
              카카오톡 채널
            </a>
          </div>
          <div className="flex items-center gap-3 text-lg">
            <a href="https://www.youtube.com/@openingfilm-h3f" target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">▶</a>
            <a href="https://www.instagram.com/opening.film?igsh=ZmF4Ymh2eTl1eHRr" target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">◎</a>
            <a href={content.contact_kakao_url} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-3 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">✉</a>
          </div>
        </div>
        <p className="mt-4 text-xs">Copyright 2026 오프닝필름. All rights reserved.</p>
      </footer>
    </div>
  );
}
