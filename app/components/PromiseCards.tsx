import { Fragment } from "react";
import RevealOnScroll from "./RevealOnScroll";

export interface PromiseCardItem {
  id: string;
  title: string;
  content: string;
}

/** "\n"을 <br>로 변환해 렌더 (일반 줄바꿈). */
function Multiline({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, idx) => (
        <Fragment key={idx}>
          {line}
          {idx < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

export default function PromiseCards({ promises = [] }: { promises?: PromiseCardItem[] }) {
  return (
    <RevealOnScroll className="reveal-group grid gap-4">
      {promises.map((card, idx) => {
        const cardDelay = idx * 140;
        return (
          <div
            key={card.id}
            className="lift-hover rounded-3xl border border-black/10 bg-white px-6 py-6 reveal-item"
            style={{ transitionDelay: `${cardDelay}ms` }}
          >
            <h4 className="text-lg font-semibold text-[var(--ink)]">{card.title}</h4>
            <div
              className="promise-divider"
              style={{ "--divider-delay": `${cardDelay + 120}ms` } as React.CSSProperties}
            />
            <p className="mt-2 text-sm text-[var(--muted)]">
              <Multiline text={card.content} />
            </p>
          </div>
        );
      })}
    </RevealOnScroll>
  );
}
