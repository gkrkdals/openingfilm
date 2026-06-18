interface ReviewItem {
  id: string;
  author: string;
  content: string;
}

interface ReviewSectionProps {
  reviews?: ReviewItem[];
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "def-rev1",
    author: "김서연",
    content: "가격 부담 없이도 가장 소중한 순간이 생생하게 남았어요. 진심이 느껴졌습니다.",
  },
  {
    id: "def-rev2",
    author: "박지훈",
    content: "촬영이 자연스러워서 긴장이 풀렸어요. 영상도 따뜻하게 완성됐습니다.",
  },
  {
    id: "def-rev3",
    author: "이민지",
    content: "가족들 반응이 최고였습니다. 다음 기념일에도 꼭 다시 보고 싶어요.",
  },
];

export default function ReviewSection({ reviews = [] }: ReviewSectionProps) {
  const displayReviews = reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  return (
    <section id="review" className="rounded-[36px] bg-[#eef1f3] px-8 py-16 md:px-12">
      <div className="flex flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
              Review & Event
            </p>
            <h3 className="mt-4 font-display text-2xl">
              함께한 이야기와 <br className="md:hidden" /> 이벤트를 전합니다.
            </h3>
          </div>
          <p className="max-w-sm text-sm text-[var(--muted)]">
            오프닝필름을 선택한 커플의 후기와 <br className="md:hidden" /> 진행 중인 이벤트 소식을 <br className="hidden md:block" /> 확인하세요.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {displayReviews.map((rev) => (
            <div key={rev.id} className="lift-hover flex flex-col justify-between rounded-3xl bg-white px-8 py-10 shadow-sm">
              <p className="text-sm text-[var(--muted)] whitespace-pre-wrap leading-relaxed">
                {rev.content}
              </p>
              <p className="mt-6 text-sm font-semibold">{rev.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
