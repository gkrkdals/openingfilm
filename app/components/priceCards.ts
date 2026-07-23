// PriceSection 카드의 순서 정보만 관리한다. 카드 "내용"은 PriceSection.tsx에 하드코딩되어 있고,
// 여기서는 각 카드의 안정적인 id와 (관리자 표시용) 라벨, 그리고 순서 저장에 쓰는 키만 정의한다.

export interface PriceCardMeta {
  id: string;
  label: string;
}

// 윗줄: 촬영 구성 / 촬영 범위 / 축하 메시지 (md:grid-cols-3)
export const PRICE_ROW1_CARDS: PriceCardMeta[] = [
  { id: "shooting", label: "촬영 구성" },
  { id: "scope", label: "촬영 범위" },
  { id: "message", label: "축하 메시지 포함" },
];

// 밑줄: 제공 파일 / 맞춤 추가 옵션 (md:grid-cols-2)
export const PRICE_ROW2_CARDS: PriceCardMeta[] = [
  { id: "files", label: "제공 파일" },
  { id: "options", label: "맞춤 추가 옵션" },
];

export const PRICE_ROW1_ORDER_KEY = "price_row1_order";
export const PRICE_ROW2_ORDER_KEY = "price_row2_order";

/**
 * 저장된 순서 문자열(CSV of id)을 정규 카드 목록에 적용해 id 배열을 만든다.
 * - 저장값에 있는 유효한 id를 먼저 순서대로,
 * - 저장값에서 빠진 정규 id는 원래 순서대로 뒤에 이어붙인다.
 * 이렇게 하면 카드가 추가되거나 저장값이 손상돼도 절대 사라지지 않는다(하드코딩이 최종 권위).
 */
export function applyPriceOrder(cards: PriceCardMeta[], orderStr?: string): string[] {
  const canonical = cards.map((c) => c.id);
  if (!orderStr) return canonical;

  const requested = orderStr.split(",").map((s) => s.trim());
  const ordered = requested.filter((id) => canonical.includes(id));
  const missing = canonical.filter((id) => !ordered.includes(id));
  return [...ordered, ...missing];
}

// ────────────────────────────────────────────────────────────────────────────
// 카드 "텍스트" 편집. 각 카드의 세부 슬롯(제목/설명/목록/옵션)만 편집 가능하게 하고,
// 값은 siteContent에 key-value로 저장한다. 저장값이 없으면 아래 default(현재 하드코딩 문구)로 폴백.
// 줄바꿈은 "\n"으로 저장하고 렌더 시 <br>로 변환한다(모바일 전용 반응형 줄바꿈은 단순화).

export interface PriceTextField {
  key: string;
  label: string;
  multiline: boolean;
  default: string;
}

export interface PriceTextGroup {
  cardId: string; // PRICE_ROW*_CARDS의 id와 일치
  cardLabel: string;
  fields: PriceTextField[];
}

export const PRICE_ROW1_TEXT: PriceTextGroup[] = [
  {
    cardId: "shooting",
    cardLabel: "촬영 구성",
    fields: [
      { key: "price_shooting_title", label: "제목", multiline: false, default: "촬영 구성" },
      {
        key: "price_shooting_desc",
        label: "설명",
        multiline: true,
        default: "1인 3캠 / 4K 고화질 촬영.\n메인 미러리스 2대와 서브 액션 캠 1대로\n순간을 기록합니다.",
      },
    ],
  },
  {
    cardId: "scope",
    cardLabel: "촬영 범위",
    fields: [
      { key: "price_scope_title", label: "제목", multiline: false, default: "촬영 범위" },
      {
        key: "price_scope_desc",
        label: "설명",
        multiline: true,
        default: "예식 1시간 전(신부대기실)부터 본식,\n식후 원판까지 영상 촬영을 진행합니다.",
      },
    ],
  },
  {
    cardId: "message",
    cardLabel: "축하 메시지 포함",
    fields: [
      { key: "price_message_title", label: "제목", multiline: false, default: "축하 메시지 포함" },
      {
        key: "price_message_desc",
        label: "설명",
        multiline: true,
        default: "부모님과 하객분들의 진심 어린 축하 메시지를\n영상으로 남겨드립니다.",
      },
    ],
  },
];

export const PRICE_ROW2_TEXT: PriceTextGroup[] = [
  {
    cardId: "files",
    cardLabel: "제공 파일",
    fields: [
      { key: "price_files_title", label: "제목", multiline: false, default: "제공 파일" },
      {
        key: "price_files_item1",
        label: "항목 1",
        multiline: true,
        default: "고정캠 풀영상 (대기실부터 원판까지 흐름 확인)",
      },
      {
        key: "price_files_item2",
        label: "항목 2",
        multiline: true,
        default: "숏폼 영상 (인스타/유튜브 쇼츠용 세로형)",
      },
      {
        key: "price_files_item3",
        label: "항목 3",
        multiline: true,
        default: "4K 원본 전체 파일 기본 제공 (1시간)",
      },
    ],
  },
  {
    cardId: "options",
    cardLabel: "맞춤 추가 옵션",
    fields: [
      { key: "price_options_title", label: "제목", multiline: false, default: "맞춤 추가 옵션" },
      {
        key: "price_options_opt1_title",
        label: "옵션 1 제목",
        multiline: false,
        default: "뮤비형 하이라이트 (+50,000원)",
      },
      {
        key: "price_options_opt1_desc",
        label: "옵션 1 설명",
        multiline: true,
        default: "감성적인 음악과 함께 뮤직비디오처럼 제작합니다.",
      },
      {
        key: "price_options_opt2_title",
        label: "옵션 2 제목",
        multiline: false,
        default: "시네마형 하이라이트 (+100,000원)",
      },
      {
        key: "price_options_opt2_desc",
        label: "옵션 2 설명",
        multiline: true,
        default: "현장 사운드와 내레이션을 담아 영화처럼 감동적으로 편집합니다.",
      },
    ],
  },
];

// 모든 텍스트 필드의 기본값을 key로 평탄화한 맵. PriceSection에서 폴백에 쓴다.
export const PRICE_TEXT_DEFAULTS: Record<string, string> = Object.fromEntries(
  [...PRICE_ROW1_TEXT, ...PRICE_ROW2_TEXT].flatMap((g) =>
    g.fields.map((f) => [f.key, f.default])
  )
);

/** 저장된 값이 있으면 그 값을, 없으면 기본값을 돌려준다. */
export function priceText(content: Record<string, string> | undefined, key: string): string {
  return content?.[key] ?? PRICE_TEXT_DEFAULTS[key] ?? "";
}
