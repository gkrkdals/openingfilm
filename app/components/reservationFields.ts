// 예약 섹션(안내 문구 + 신청 폼)의 편집 가능한 설정.
// 입력 칸의 name은 예약 API·DB·구글 시트로 이어지는 키이므로 고정이고, 관리자는 칸의
// 순서·너비·안내 문구(placeholder)만 바꿀 수 있다. 값은 siteContent에 key-value로 저장하며,
// 저장값이 없으면 아래 기본값으로 폴백한다.

import { applyPriceOrder, type PriceTextGroup } from "./priceCards";

export interface ReservationFieldMeta {
  id: string;
  /** FormData 키. ReservationForm의 제출 로직이 이 이름으로 값을 읽는다. */
  name: string;
  label: string;
  required: boolean;
  type: "text" | "email";
  defaultPlaceholder: string;
  defaultWide: boolean;
}

export const RESERVATION_FIELDS: ReservationFieldMeta[] = [
  { id: "groom", name: "신랑 성함", label: "신랑 성함", required: false, type: "text", defaultPlaceholder: "신랑 성함", defaultWide: false },
  { id: "bride", name: "신부 성함", label: "신부 성함", required: false, type: "text", defaultPlaceholder: "신부 성함", defaultWide: false },
  { id: "date", name: "예식 날짜", label: "예식 날짜", required: true, type: "text", defaultPlaceholder: "예식 날짜 (필수)", defaultWide: false },
  { id: "time", name: "예식 시간", label: "예식 시간", required: true, type: "text", defaultPlaceholder: "예식 시간 (필수)", defaultWide: false },
  { id: "location", name: "예식 장소", label: "예식 장소", required: true, type: "text", defaultPlaceholder: "예식 장소 (필수)", defaultWide: true },
  { id: "contact", name: "연락처", label: "연락처", required: true, type: "text", defaultPlaceholder: "연락처 (필수)", defaultWide: false },
  { id: "email", name: "메일 주소", label: "메일 주소", required: false, type: "email", defaultPlaceholder: "메일 주소", defaultWide: false },
];

export const RESERVATION_ORDER_KEY = "reservation_field_order";
/** 한 줄 전체를 쓰는 칸의 id CSV. 키가 아예 없으면 defaultWide를 따르고, 빈 문자열이면 전부 반칸. */
export const RESERVATION_WIDE_KEY = "reservation_field_wide";

export const reservationPlaceholderKey = (id: string) => `reservation_ph_${id}`;

export function reservationFieldOrder(orderStr?: string): string[] {
  return applyPriceOrder(RESERVATION_FIELDS, orderStr);
}

export function reservationWideIds(wideStr?: string): Set<string> {
  if (wideStr === undefined) {
    return new Set(RESERVATION_FIELDS.filter((f) => f.defaultWide).map((f) => f.id));
  }
  return new Set(wideStr.split(",").map((s) => s.trim()).filter(Boolean));
}

export interface ReservationFieldSlot {
  id: string;
  full: boolean;
  /** 관리자는 반칸으로 설정했지만 옆에 짝이 없어 자동으로 한 줄 전체를 쓰는 경우 */
  autoFull: boolean;
}

/**
 * 2열 그리드 배치를 계산한다. 반칸인데 짝이 없는 칸(뒤가 전체 칸이거나 마지막)은
 * 자동으로 한 줄 전체를 쓰게 해서 빈칸이 생기지 않게 한다. 화면 순서와 Tab 순서는 항상 일치한다.
 */
export function layoutReservationFields(order: string[], wide: Set<string>): ReservationFieldSlot[] {
  const slots: ReservationFieldSlot[] = [];
  let col = 0;
  order.forEach((id, idx) => {
    if (wide.has(id)) {
      slots.push({ id, full: true, autoFull: false });
      col = 0;
      return;
    }
    const next = order[idx + 1];
    if (col === 0 && (next === undefined || wide.has(next))) {
      slots.push({ id, full: true, autoFull: true });
      return;
    }
    slots.push({ id, full: false, autoFull: false });
    col = col === 0 ? 1 : 0;
  });
  return slots;
}

// 예약 섹션 왼쪽 안내 문구와 버튼 문구
export const RESERVATION_INTRO_TEXT: PriceTextGroup = {
  cardId: "intro",
  cardLabel: "왼쪽 안내 문구",
  fields: [
    { key: "reservation_label", label: "상단 작은 글씨", multiline: false, default: "Reservation" },
    {
      key: "reservation_title",
      label: "제목",
      multiline: true,
      default: "오프닝필름 예약 신청\n가장 아름다운 시작을 함께 준비합니다.",
    },
    { key: "reservation_contact", label: "문의 안내", multiline: false, default: '문의: 카카오톡 "오프닝필름" / DM' },
  ],
};

export const RESERVATION_BUTTON_TEXT: PriceTextGroup = {
  cardId: "button",
  cardLabel: "신청 버튼",
  fields: [{ key: "reservation_submit", label: "버튼 문구", multiline: false, default: "예약 신청하기" }],
};

export const RESERVATION_PLACEHOLDER_TEXT: PriceTextGroup = {
  cardId: "placeholders",
  cardLabel: "입력 칸 안내 문구",
  fields: RESERVATION_FIELDS.map((f) => ({
    key: reservationPlaceholderKey(f.id),
    label: f.label + (f.required ? " (필수 항목)" : ""),
    multiline: false,
    default: f.defaultPlaceholder,
  })),
};

export const RESERVATION_TEXT_DEFAULTS: Record<string, string> = Object.fromEntries(
  [RESERVATION_INTRO_TEXT, RESERVATION_BUTTON_TEXT, RESERVATION_PLACEHOLDER_TEXT].flatMap((g) =>
    g.fields.map((f) => [f.key, f.default])
  )
);

export function reservationText(content: Record<string, string> | undefined, key: string): string {
  return content?.[key] ?? RESERVATION_TEXT_DEFAULTS[key] ?? "";
}

/** ReservationForm에 넘길 직렬화 가능한 칸 목록 */
export interface ReservationFormField {
  id: string;
  name: string;
  type: "text" | "email";
  required: boolean;
  placeholder: string;
  full: boolean;
}

export function buildReservationFormFields(content: Record<string, string>): ReservationFormField[] {
  const order = reservationFieldOrder(content[RESERVATION_ORDER_KEY]);
  const wide = reservationWideIds(content[RESERVATION_WIDE_KEY]);
  return layoutReservationFields(order, wide).map((slot) => {
    const meta = RESERVATION_FIELDS.find((f) => f.id === slot.id)!;
    return {
      id: meta.id,
      name: meta.name,
      type: meta.type,
      required: meta.required,
      placeholder: reservationText(content, reservationPlaceholderKey(meta.id)),
      full: slot.full,
    };
  });
}
