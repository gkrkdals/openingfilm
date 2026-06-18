import RevealOnScroll from "./RevealOnScroll";

interface VideoItem {
  id: string;
  type: string;
  title: string;
  youtube_id: string;
}

interface PortfolioSectionProps {
  videos?: VideoItem[];
}

const DEFAULT_REGULAR = [
  { id: "def-1", title: "오프닝필름 샘플 1", youtube_id: "gKC6YGV8QGY" },
  { id: "def-2", title: "오프닝필름 샘플 2", youtube_id: "6MGtuoj-4b0" },
  { id: "def-3", title: "오프닝필름 샘플 3", youtube_id: "fSw9FgvUKAw" },
  { id: "def-4", title: "오프닝필름 샘플 4", youtube_id: "Fc2M-FkgR8s" },
];

const DEFAULT_SHORTS = [
  { id: "def-s1", title: "오프닝필름 숏폼 1", youtube_id: "UBT8NjGH510" },
  { id: "def-s2", title: "오프닝필름 숏폼 2", youtube_id: "ojUzdvQO7ZI" },
  { id: "def-s3", title: "오프닝필름 숏폼 3", youtube_id: "by09u6yabJQ" },
];

export default function PortfolioSection({ videos = [] }: PortfolioSectionProps) {
  const regularVideos = videos.length > 0 
    ? videos.filter((v) => v.type === "regular")
    : DEFAULT_REGULAR;
  
  const shortsVideos = videos.length > 0 
    ? videos.filter((v) => v.type === "shorts")
    : DEFAULT_SHORTS;

  return (
    <section id="portfolio" className="py-20">
      <RevealOnScroll className="portfolio-panel">
        <div className="portfolio-stage" style={{ transitionDelay: "140ms" }}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                Portfolio
              </p>
              <h3 className="mt-4 font-display text-3xl">
                그날의 기록을<br className="md:hidden" /> 소개합니다.
              </h3>
            </div>
            <a
              className="rounded-full border border-black/20 px-5 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="https://www.youtube.com/@openingfilm-h3f/featured"
              target="_blank"
              rel="noreferrer"
            >
              작업물 더 보기
            </a>
          </div>
        </div>

        <div className="portfolio-stage" style={{ transitionDelay: "320ms" }}>
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 shorts-scroll">
            {regularVideos.map((video) => (
              <div key={video.id} className="w-[85%] flex-shrink-0 snap-center md:w-auto">
                <div className="lift-hover group relative aspect-video overflow-hidden rounded-3xl bg-black shadow-[var(--shadow)]">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white transition group-hover:scale-110 pointer-events-none">
                    ▶
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="portfolio-stage" style={{ transitionDelay: "480ms" }}>
          <p className="mt-14 mb-6 text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Shorts</p>
          {/* Mobile: horizontal scroll-snap carousel / Desktop: 3-column grid */}
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 shorts-scroll">
            {shortsVideos.map((video) => (
              <div key={video.id} className="w-[72%] flex-shrink-0 snap-center md:w-auto">
                <div className="lift-hover group relative aspect-[9/16] overflow-hidden rounded-3xl bg-black shadow-[var(--shadow)]">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-sm text-white transition group-hover:scale-110 pointer-events-none">
                    ▶
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
