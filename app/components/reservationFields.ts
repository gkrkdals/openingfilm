// 예약 섹션(안내 문구 + 신청 폼)의 편집 가능한 설정.
// 기본 칸 7개의 name은 예약 API·DB 컬럼·구글 시트로 이어지는 키라 고정이다. 관리자는 칸의
// 순서·너비·안내 문구를 바꾸고, 선택 칸을 숨기고, 새 칸(추가 칸)을 만들 수 있다.
// 모든 설정은 siteContent에 key-value로 저장하며, 저장값이 없으면 기본값으로 폴백한다.
// 이 파일은 클라이언트(폼·어드민)와 서버(예약 API)가 함께 쓰므로 순수 TS로 유지한다.

import { applyPriceOrder, type PriceTextGroup } from "./priceCards";

export interface ReservationFieldMeta {
  id: string;
  /** FormData 키. 기본 칸은 한국어 이름, 추가 칸은 custom_<id> */
  name: string;
  label: string;
  required: boolean;
  type: "text" | "email";
  defaultPlaceholder: string;
  defaultWide: boolean;
  /** 관리자가 추가한 칸 */
  custom: boolean;
  /** 기본 칸 중 숨길 수 있는 칸(DB에서 선택 값인 칸만) */
  hideable: boolean;
}

export const BUILTIN_RESERVATION_FIELDS: ReservationFieldMeta[] = [
  { id: "groom", name: "신랑 성함", label: "신랑 성함", required: false, type: "text", defaultPlaceholder: "신랑 성함", defaultWide: false, custom: false, hideable: true },
  { id: "bride", name: "신부 성함", label: "신부 성함", required: false, type: "text", defaultPlaceholder: "신부 성함", defaultWide: false, custom: false, hideable: true },
  { id: "date", name: "예식 날짜", label: "예식 날짜", required: true, type: "text", defaultPlaceholder: "예식 날짜 (필수)", defaultWide: false, custom: false, hideable: false },
  { id: "time", name: "예식 시간", label: "예식 시간", required: true, type: "text", defaultPlaceholder: "예식 시간 (필수)", defaultWide: false, custom: false, hideable: false },
  { id: "location", name: "예식 장소", label: "예식 장소", required: true, type: "text", defaultPlaceholder: "예식 장소 (필수)", defaultWide: true, custom: false, hideable: false },
  { id: "contact", name: "연락처", label: "연락처", required: true, type: "text", defaultPlaceholder: "연락처 (필수)", defaultWide: false, custom: false, hideable: false },
  { id: "email", name: "메일 주소", label: "메일 주소", required: false, type: "email", defaultPlaceholder: "메일 주소", defaultWide: false, custom: false, hideable: true },
];

export const RESERVATION_ORDER_KEY = "reservation_field_order";
/** 한 줄 전체를 쓰는 칸의 id CSV. 키가 아예 없으면 defaultWide를 따르고, 빈 문자열이면 전부 반칸. */
export const RESERVATION_WIDE_KEY = "reservation_field_wide";
/** 숨긴 기본 칸의 id CSV (hideable인 칸만 유효) */
export const RESERVATION_HIDDEN_KEY = "reservation_field_hidden";
/** 추가 칸 정의 JSON 배열 [{id, label, required}] */
export const RESERVATION_CUSTOM_KEY = "reservation_custom_fields";

export const CUSTOM_LABEL_MAX = 30;
export const CUSTOM_VALUE_MAX = 500;
export const CUSTOM_FIELDS_MAX = 10;

export const reservationPlaceholderKey = (id: string) => `reservation_ph_${id}`;

type Content = Record<string, string | undefined>;

export interface CustomFieldDef {
  id: string;
  label: string;
  required: boolean;
}

/** 저장된 추가 칸 JSON을 안전하게 읽는다. 손상된 값은 무시한다. */
export function parseCustomFields(json?: string): CustomFieldDef[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const result: CustomFieldDef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, label, required } = item as Record<string, unknown>;
    if (typeof id !== "string" || !/^c[a-z0-9]{1,20}$/.test(id) || seen.has(id)) continue;
    if (typeof label !== "string" || !label.trim()) continue;
    seen.add(id);
    result.push({ id, label: label.trim().slice(0, CUSTOM_LABEL_MAX), required: required === true });
    if (result.length >= CUSTOM_FIELDS_MAX) break;
  }
  return result;
}

export function newCustomFieldId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 기본 칸 + 추가 칸 전체 (숨김 포함, 정규 순서) */
export function getReservationFields(content: Content): ReservationFieldMeta[] {
  const custom = parseCustomFields(content[RESERVATION_CUSTOM_KEY]).map<ReservationFieldMeta>((c) => ({
    id: c.id,
    name: `custom_${c.id}`,
    label: c.label,
    required: c.required,
    type: "text",
    defaultPlaceholder: c.label + (c.required ? " (필수)" : ""),
    defaultWide: false,
    custom: true,
    hideable: false,
  }));
  return [...BUILTIN_RESERVATION_FIELDS, ...custom];
}

/** 저장된 순서를 적용한 전체 칸 id (숨김 포함) */
export function reservationFieldOrder(content: Content): string[] {
  return applyPriceOrder(getReservationFields(content), content[RESERVATION_ORDER_KEY]);
}

export function reservationWideIds(content: Content): Set<string> {
  const wideStr = content[RESERVATION_WIDE_KEY];
  if (wideStr === undefined) {
    return new Set(BUILTIN_RESERVATION_FIELDS.filter((f) => f.defaultWide).map((f) => f.id));
  }
  return new Set(wideStr.split(",").map((s) => s.trim()).filter(Boolean));
}

export function reservationHiddenIds(content: Content): Set<string> {
  const hideable = new Set(BUILTIN_RESERVATION_FIELDS.filter((f) => f.hideable).map((f) => f.id));
  const raw = content[RESERVATION_HIDDEN_KEY] ?? "";
  return new Set(raw.split(",").map((s) => s.trim()).filter((id) => hideable.has(id)));
}

export function reservationPlaceholder(content: Content, field: ReservationFieldMeta): string {
  return content[reservationPlaceholderKey(field.id)] ?? field.defaultPlaceholder;
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

/** 화면에 실제로 보이는 칸의 배치 (숨긴 칸 제외) */
export function visibleReservationLayout(content: Content): ReservationFieldSlot[] {
  const hidden = reservationHiddenIds(content);
  const order = reservationFieldOrder(content).filter((id) => !hidden.has(id));
  return layoutReservationFields(order, reservationWideIds(content));
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

export function reservationPlaceholderGroup(fields: ReservationFieldMeta[]): PriceTextGroup {
  return {
    cardId: "placeholders",
    cardLabel: "입력 칸 안내 문구",
    fields: fields.map((f) => ({
      key: reservationPlaceholderKey(f.id),
      label: f.label + (f.required ? " (필수 항목)" : ""),
      multiline: false,
      default: f.defaultPlaceholder,
    })),
  };
}

const RESERVATION_TEXT_DEFAULTS: Record<string, string> = Object.fromEntries(
  [RESERVATION_INTRO_TEXT, RESERVATION_BUTTON_TEXT].flatMap((g) => g.fields.map((f) => [f.key, f.default]))
);

export function reservationText(content: Content | undefined, key: string): string {
  return content?.[key] ?? RESERVATION_TEXT_DEFAULTS[key] ?? "";
}

/** ReservationForm에 넘길 직렬화 가능한 칸 목록 (숨긴 칸 제외, 화면 순서) */
export interface ReservationFormField {
  id: string;
  name: string;
  type: "text" | "email";
  required: boolean;
  placeholder: string;
  full: boolean;
  custom: boolean;
}

export function buildReservationFormFields(content: Content): ReservationFormField[] {
  const fields = getReservationFields(content);
  return visibleReservationLayout(content).map((slot) => {
    const meta = fields.find((f) => f.id === slot.id)!;
    return {
      id: meta.id,
      name: meta.name,
      type: meta.type,
      required: meta.required,
      placeholder: reservationPlaceholder(content, meta),
      full: slot.full,
      custom: meta.custom,
    };
  });
}

export interface ReservationExtraEntry {
  label: string;
  value: string;
}

/**
 * 예약 API에서 추가 칸 답변을 검증한다. 현재 정의된 추가 칸만 받고(나머지 키는 버림),
 * 필수 칸 누락 시 에러, 값은 길이를 제한한다. 빈 값은 저장하지 않는다.
 */
export function validateReservationExtra(
  content: Content,
  input: unknown
): { ok: true; entries: ReservationExtraEntry[] } | { ok: false; error: string } {
  const answers = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const entries: ReservationExtraEntry[] = [];
  for (const def of parseCustomFields(content[RESERVATION_CUSTOM_KEY])) {
    const raw = answers[def.id];
    const value = typeof raw === "string" ? raw.trim().slice(0, CUSTOM_VALUE_MAX) : "";
    if (!value) {
      if (def.required) return { ok: false, error: `필수 입력 항목(${def.label})을 입력해 주세요.` };
      continue;
    }
    entries.push({ label: def.label, value });
  }
  return { ok: true, entries };
}

/** DB의 extra JSON을 읽는다 (어드민 표시·시트 전송용) */
export function parseReservationExtra(json: string | null | undefined): ReservationExtraEntry[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (e): e is ReservationExtraEntry => e && typeof e.label === "string" && typeof e.value === "string"
    );
  } catch {
    return [];
  }
}

/** 시트 한 칸에 넣을 문자열: "추천인: 홍길동 / 신부 연락처: 010-..." */
export function formatReservationExtra(entries: ReservationExtraEntry[]): string {
  return entries.map((e) => `${e.label}: ${e.value}`).join(" / ");
}
