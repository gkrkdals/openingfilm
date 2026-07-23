import { Fragment, type ReactNode } from "react";
import RevealOnScroll from "./RevealOnScroll";
import {
  PRICE_ROW1_CARDS,
  PRICE_ROW2_CARDS,
  applyPriceOrder,
  priceText,
} from "./priceCards";

interface PriceSectionProps {
  priceTitle?: string;
  priceVal?: string;
  row1Order?: string;
  row2Order?: string;
  content?: Record<string, string>;
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

export default function PriceSection({
  priceTitle = "1인 3캠 4K 촬영부터 숏폼까지 올인원 [단일] 구성",
  priceVal = "360,000원",
  row1Order,
  row2Order,
  content,
}: PriceSectionProps) {
  const t = (key: string) => priceText(content, key);

  // 카드 구조는 고정, 문구만 저장값/기본값에서 읽어 렌더한다.
  const row1: Record<string, ReactNode> = {
    shooting: (
      <div className="lift-hover rounded-2xl bg-white px-6 py-8">
        <h4 className="text-lg font-semibold text-center md:text-left">{t("price_shooting_title")}</h4>
        <p className="mt-3 text-sm text-[var(--muted)] text-center md:text-left">
          <Multiline text={t("price_shooting_desc")} />
        </p>
      </div>
    ),
    scope: (
      <div className="lift-hover rounded-2xl bg-white px-6 py-8">
        <h4 className="text-lg font-semibold text-center md:text-left">{t("price_scope_title")}</h4>
        <p className="mt-3 text-sm text-[var(--muted)] text-center md:text-left">
          <Multiline text={t("price_scope_desc")} />
        </p>
      </div>
    ),
    message: (
      <div className="lift-hover rounded-2xl bg-white px-6 py-8">
        <h4 className="text-lg font-semibold text-center md:text-left">{t("price_message_title")}</h4>
        <p className="mt-3 text-sm text-[var(--muted)] text-center md:text-left">
          <Multiline text={t("price_message_desc")} />
        </p>
      </div>
    ),
  };

  const row2: Record<string, ReactNode> = {
    files: (
      <div className="lift-hover rounded-2xl border border-black/10 bg-white px-6 py-8">
        <h4 className="text-lg font-semibold text-center md:text-left">{t("price_files_title")}</h4>
        <ul className="mt-4 space-y-3 text-sm text-[var(--muted)] text-center md:text-left">
          {["price_files_item1", "price_files_item2", "price_files_item3"].map((key, idx) => (
            <li
              key={key}
              className="flex flex-col items-center gap-2 text-center md:flex-row md:items-center md:gap-3 md:text-left"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mist)] text-xs font-semibold text-[var(--ink)] md:mt-0">
                {idx + 1}
              </span>
              <span>
                <Multiline text={t(key)} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
    options: (
      <div className="lift-hover rounded-2xl border border-black/10 bg-white px-6 py-8">
        <h4 className="text-lg font-semibold text-center md:text-left">{t("price_options_title")}</h4>
        <div className="mt-4 space-y-4 text-sm text-[var(--muted)] text-center md:text-left">
          <div>
            <p className="font-semibold text-[var(--ink)]">{t("price_options_opt1_title")}</p>
            <p className="mt-1">
              <Multiline text={t("price_options_opt1_desc")} />
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">
              <Multiline text={t("price_options_opt2_title")} />
            </p>
            <p className="mt-1">
              <Multiline text={t("price_options_opt2_desc")} />
            </p>
          </div>
        </div>
      </div>
    ),
  };

  const row1Ids = applyPriceOrder(PRICE_ROW1_CARDS, row1Order);
  const row2Ids = applyPriceOrder(PRICE_ROW2_CARDS, row2Order);

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
              {row1Ids.map((id) => (
                <Fragment key={id}>{row1[id]}</Fragment>
              ))}
            </div>
          </div>

          <div className="price-stage" style={{ transitionDelay: "460ms" }}>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {row2Ids.map((id) => (
                <Fragment key={id}>{row2[id]}</Fragment>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
