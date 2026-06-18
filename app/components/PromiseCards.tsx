import RevealOnScroll from "./RevealOnScroll";

export default function PromiseCards() {
  return (
    <RevealOnScroll className="reveal-group grid gap-4">
      <div
        className="lift-hover rounded-3xl border border-black/10 bg-white px-6 py-6 reveal-item"
        style={{ transitionDelay: "0ms" }}
      >
        <h4 className="text-lg font-semibold text-[var(--ink)]">투명하고 합리적인 가치</h4>
        <div
          className="promise-divider"
          style={{ "--divider-delay": "120ms" } as React.CSSProperties}
        />
        <p className="mt-2 text-sm text-[var(--muted)]">
          누구나 부담 없이 다가올 수 있는<br className="md:hidden" /> 정직한 가성비를 제안합니다.
        </p>
      </div>
      <div
        className="lift-hover rounded-3xl border border-black/10 bg-white px-6 py-6 reveal-item"
        style={{ transitionDelay: "140ms" }}
      >
        <h4 className="text-lg font-semibold text-[var(--ink)]">친구 같은 친근한 소통</h4>
        <div
          className="promise-divider"
          style={{ "--divider-delay": "260ms" } as React.CSSProperties}
        />
        <p className="mt-2 text-sm text-[var(--muted)]">
          예식 당일, 불편한 촬영자가 아닌 <br className="md:hidden" /> 두 분을 응원하는 단짝으로 함께합니다.
        </p>
      </div>
      <div
        className="lift-hover rounded-3xl border border-black/10 bg-white px-6 py-6 reveal-item"
        style={{ transitionDelay: "280ms" }}
      >
        <h4 className="text-lg font-semibold text-[var(--ink)]">자연스러운 우리다운 기록</h4>
        <div
          className="promise-divider"
          style={{ "--divider-delay": "400ms" } as React.CSSProperties}
        />
        <p className="mt-2 text-sm text-[var(--muted)]">
          억지 연출 없이 그날의 공기와 설렘이 <br className="md:hidden" /> 그대로 남는 순간을 담아냅니다.
        </p>
      </div>
    </RevealOnScroll>
  );
}
