import RevealOnScroll from "./RevealOnScroll";

interface PriceSectionProps {
  priceTitle?: string;
  priceVal?: string;
}

export default function PriceSection({
  priceTitle = "1인 3캠 4K 촬영부터 숏폼까지 올인원 [단일] 구성",
  priceVal = "360,000원",
}: PriceSectionProps) {
  return (
    <section id="price" className="py-20">
      <RevealOnScroll className="price-panel overflow-hidden rounded-[36px] bg-[var(--mist)]">
        <div className="px-8 py-12 md:px-14">
          <div className="price-stage" style={{ transitionDelay: "140ms" }}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                  Price / Guide
                </p>
                <h3 className="mt-4 font-display text-lg md:text-3xl">
                  {priceTitle.split("\n").map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx < priceTitle.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </h3>
              </div>
              <div className="lift-hover mx-auto rounded-2xl bg-white px-6 py-4 text-center shadow-sm md:mx-0">
                <p className="text-sm text-[var(--muted)]">기본 구성</p>
                <p className="mt-2 text-2xl font-semibold">{priceVal}</p>
                <p className="text-xs text-[var(--muted)]">VAT 별도</p>
              </div>
            </div>
          </div>

          <div className="price-stage" style={{ transitionDelay: "300ms" }}>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="lift-hover rounded-2xl bg-white px-6 py-8">
                <h4 className="text-lg font-semibold text-center md:text-left">촬영 구성</h4>
                <p className="mt-3 text-sm text-[var(--muted)] text-center md:text-left">
                  1인 3캠 / 4K 고화질 촬영. <br />
                  메인 <span className="whitespace-nowrap">미러리스 2대</span>와 <br className="md:hidden" />
                  서브 <span className="whitespace-nowrap">액션 캠 1대</span>로 <br /> 순간을 기록합니다.
                </p>
              </div>
              <div className="lift-hover rounded-2xl bg-white px-6 py-8">
                <h4 className="text-lg font-semibold text-center md:text-left">촬영 범위</h4>
                <p className="mt-3 text-sm text-[var(--muted)] text-center md:text-left">
                  예식 1시간 전(신부대기실)부터 <br className="md:hidden" /> 본식, <br className="hidden md:block" />
                  <span className="whitespace-nowrap">식후 원판</span>까지 영상 촬영을 <br className="md:hidden" /> 진행합니다.
                </p>
              </div>
              <div className="lift-hover rounded-2xl bg-white px-6 py-8">
                <h4 className="text-lg font-semibold text-center md:text-left">축하 메시지 포함</h4>
                <p className="mt-3 text-sm text-[var(--muted)] text-center md:text-left">
                  부모님과 하객분들의 <br className="md:hidden" /> 진심 어린 축하 메시지를 <br /> 영상으로 남겨드립니다.
                </p>
              </div>
            </div>
          </div>

          <div className="price-stage" style={{ transitionDelay: "460ms" }}>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="lift-hover rounded-2xl border border-black/10 bg-white px-6 py-8">
                <h4 className="text-lg font-semibold text-center md:text-left">제공 파일</h4>
                <ul className="mt-4 space-y-3 text-sm text-[var(--muted)] text-center md:text-left">
                  <li className="flex flex-col items-center gap-2 text-center md:flex-row md:items-center md:gap-3 md:text-left">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mist)] text-xs font-semibold text-[var(--ink)] md:mt-0">
                      1
                    </span>
                    <span>
                      고정캠 풀영상 <br className="md:hidden" /> (대기실부터 원판까지 흐름 확인)
                    </span>
                  </li>
                  <li className="flex flex-col items-center gap-2 text-center md:flex-row md:items-center md:gap-3 md:text-left">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mist)] text-xs font-semibold text-[var(--ink)] md:mt-0">
                      2
                    </span>
                    <span>
                      숏폼 영상 <br className="md:hidden" /> (인스타/유튜브 쇼츠용 세로형)
                    </span>
                  </li>
                  <li className="flex flex-col items-center gap-2 text-center md:flex-row md:items-center md:gap-3 md:text-left">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mist)] text-xs font-semibold text-[var(--ink)] md:mt-0">
                      3
                    </span>
                    <span>
                      4K 원본 전체 파일 기본 제공 <span className="font-semibold text-[var(--ink)]"> <br className="md:hidden" /> (1시간)</span>
                    </span>
                  </li>
                </ul>
              </div>
              <div className="lift-hover rounded-2xl border border-black/10 bg-white px-6 py-8">
                <h4 className="text-lg font-semibold text-center md:text-left">맞춤 추가 옵션</h4>
                <div className="mt-4 space-y-4 text-sm text-[var(--muted)] text-center md:text-left">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">뮤비형 하이라이트 (+50,000원)</p>
                    <p className="mt-1">감성적인 음악과 함께 <br className="md:hidden" /> 뮤직비디오처럼 제작합니다.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--ink)]">시네마형 하이라이트 <br className="md:hidden" /> (+100,000원)</p>
                    <p className="mt-1">
                      현장 사운드와 내레이션을 담아 <br className="md:hidden" /> 영화처럼 감동적으로 편집합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
