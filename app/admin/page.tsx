"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PRICE_ROW1_CARDS,
  PRICE_ROW2_CARDS,
  PRICE_ROW1_ORDER_KEY,
  PRICE_ROW2_ORDER_KEY,
  PRICE_ROW1_TEXT,
  PRICE_ROW2_TEXT,
  PRICE_TEXT_DEFAULTS,
  applyPriceOrder,
  type PriceTextField,
  type PriceTextGroup,
} from "../components/priceCards";
import {
  CUSTOM_FIELDS_MAX,
  CUSTOM_LABEL_MAX,
  RESERVATION_BUTTON_TEXT,
  RESERVATION_CUSTOM_KEY,
  RESERVATION_HIDDEN_KEY,
  RESERVATION_INTRO_TEXT,
  RESERVATION_ORDER_KEY,
  RESERVATION_WIDE_KEY,
  getReservationFields,
  newCustomFieldId,
  parseCustomFields,
  parseReservationExtra,
  reservationFieldOrder,
  reservationHiddenIds,
  reservationPlaceholder,
  reservationPlaceholderGroup,
  reservationText,
  reservationWideIds,
  visibleReservationLayout,
} from "../components/reservationFields";

// Define TypeScript types corresponding to Prisma schema
interface SiteContent {
  key: string;
  value: string;
}

interface PortfolioItem {
  id: string;
  type: string;
  title: string;
  youtubeId: string;
  orderIndex: number;
}

interface ReviewItem {
  id: string;
  author: string;
  content: string;
  orderIndex: number;
}

interface PromiseItem {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
}

interface ReservationItem {
  id: string;
  groomName: string | null;
  brideName: string | null;
  weddingDate: string;
  weddingTime: string;
  weddingLocation: string;
  contact: string;
  email: string | null;
  extra: string | null;
  status: string;
  createdAt: string;
}

/**
 * 드래그로 순서를 바꿀 수 있는 영상 카드.
 * 드래그 리스너는 핸들에만 붙인다 — 카드 전체에 붙이면 "삭제" 클릭이 드래그로 먹힌다.
 */
function SortableVideoCard({
  video,
  onDelete,
}: {
  video: PortfolioItem;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: video.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-3 border border-black/5 rounded-2xl p-4 bg-white shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${video.title} 순서 이동`}
        className="touch-none cursor-grab active:cursor-grabbing px-1 text-lg leading-none text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{video.title}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5 truncate">ID: {video.youtubeId}</p>
      </div>
      <button
        onClick={() => onDelete(video.id)}
        className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
      >
        삭제
      </button>
    </div>
  );
}

/**
 * 한 종류(regular/shorts)의 영상 목록. 목록끼리는 서로 독립된 DndContext를 쓰므로
 * 목록 간 이동(= type 변경)은 일어나지 않는다.
 */
function SortableVideoList({
  videos,
  onReorder,
  onDelete,
  emptyMessage,
}: {
  videos: PortfolioItem[];
  onReorder: (activeId: string, overId: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}) {
  const sensors = useSensors(
    // 5px 이상 움직여야 드래그로 인식 — 핸들의 클릭/포커스를 방해하지 않도록
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  if (videos.length === 0) {
    return <p className="text-xs text-[var(--muted)] py-4 text-center">{emptyMessage}</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {videos.map((video) => (
            <SortableVideoCard key={video.id} video={video} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * 드래그로 순서를 바꿀 수 있는 후기 카드.
 * 영상 카드와 마찬가지로 드래그 리스너는 핸들에만 붙여 "삭제" 클릭과 충돌하지 않게 한다.
 */
function SortableReviewCard({
  review,
  onDelete,
}: {
  review: ReviewItem;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: review.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col justify-between border border-black/5 rounded-2xl p-5 bg-white shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`${review.author} 후기 순서 이동`}
            className="touch-none cursor-grab active:cursor-grabbing text-lg leading-none text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ⠿
          </button>
          <p className="text-xs text-[var(--muted)] font-bold">{review.author}</p>
        </div>
        <p className="text-xs leading-relaxed text-[var(--ink-soft)] whitespace-pre-wrap">{review.content}</p>
      </div>
      <div className="mt-4 border-t border-black/5 pt-3 flex justify-end">
        <button
          onClick={() => onDelete(review.id)}
          className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

/**
 * 후기 목록. 후기는 3열 그리드로 배치되므로 rectSortingStrategy를 쓴다.
 */
function SortableReviewList({
  reviews,
  onReorder,
  onDelete,
}: {
  reviews: ReviewItem[];
  onReorder: (activeId: string, overId: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  if (reviews.length === 0) {
    return (
      <p className="col-span-full text-xs text-[var(--muted)] py-8 text-center">등록된 후기가 없습니다.</p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={reviews.map((r) => r.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <SortableReviewCard key={review.id} review={review} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * 드래그로 순서를 바꾸고 제목/내용을 직접 편집할 수 있는 약속 카드.
 */
function SortablePromiseCard({
  promise,
  onChange,
  onSave,
  onDelete,
  isSaving,
}: {
  promise: PromiseItem;
  onChange: (id: string, patch: Partial<Pick<PromiseItem, "title" | "content">>) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: promise.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border border-black/5 rounded-2xl p-4 bg-white shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`${promise.title} 순서 이동`}
          className="touch-none cursor-grab active:cursor-grabbing px-1 pt-2 text-lg leading-none text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">제목</label>
            <input
              type="text"
              value={promise.title}
              onChange={(e) => onChange(promise.id, { title: e.target.value })}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">내용</label>
            <textarea
              rows={2}
              value={promise.content}
              onChange={(e) => onChange(promise.id, { content: e.target.value })}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => onDelete(promise.id)}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={() => onSave(promise.id)}
              disabled={isSaving}
              className="rounded-full bg-[var(--ink)] text-white px-4 py-1.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 약속 카드 목록. 단일 시퀀스이므로 세로 정렬 전략을 쓴다.
 */
function SortablePromiseList({
  promises,
  onChange,
  onSave,
  onDelete,
  onReorder,
  savingId,
}: {
  promises: PromiseItem[];
  onChange: (id: string, patch: Partial<Pick<PromiseItem, "title" | "content">>) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  savingId: string | null;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  if (promises.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)] py-8 text-center">등록된 약속 카드가 없습니다.</p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={promises.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {promises.map((promise) => (
            <SortablePromiseCard
              key={promise.id}
              promise={promise}
              onChange={onChange}
              onSave={onSave}
              onDelete={onDelete}
              isSaving={savingId === promise.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * 라벨만 있는 정렬 카드 — 가격 섹션 카드 순서 변경처럼 "내용은 코드에 고정, 순서만 변경"할 때 쓴다.
 */
function SortableLabelCard({
  id,
  label,
  extra,
}: {
  id: string;
  label: string;
  extra?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border border-black/5 rounded-2xl p-4 bg-white shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${label} 순서 이동`}
        className="touch-none cursor-grab active:cursor-grabbing px-1 text-lg leading-none text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ⠿
      </button>
      <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
      {extra ? <div className="ml-auto flex items-center gap-2">{extra}</div> : null}
    </div>
  );
}

/**
 * 라벨 목록 정렬. items는 화면에 보이는 순서대로 넘긴다.
 */
function SortableLabelList({
  items,
  onReorder,
}: {
  items: { id: string; label: string; extra?: React.ReactNode }[];
  onReorder: (activeId: string, overId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((it) => (
            <SortableLabelCard key={it.id} id={it.id} label={it.label} extra={it.extra} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * 클릭하면 편집으로 바뀌는 텍스트 필드. 값은 상위 siteContent에 저장되고, 실제 저장은
 * "변경사항 저장" 버튼(폼 제출)으로 일괄 반영된다.
 */
function EditablePriceField({
  field,
  value,
  onChange,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  field: PriceTextField;
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">{field.label}</label>
      {isEditing ? (
        field.multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onStopEdit}
            className="w-full rounded-xl border border-[var(--accent)] bg-white px-3 py-2 text-xs focus:outline-none"
          />
        ) : (
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onStopEdit}
            className="w-full rounded-xl border border-[var(--accent)] bg-white px-3 py-2 text-xs focus:outline-none"
          />
        )
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          title="클릭하여 편집"
          className="w-full text-left rounded-xl border border-black/10 bg-white px-3 py-2 text-xs whitespace-pre-wrap hover:border-[var(--accent)] transition-colors cursor-text min-h-[2.25rem]"
        >
          {value ? (
            value
          ) : (
            <span className="italic text-[var(--muted)]">비어 있음 (클릭하여 입력)</span>
          )}
        </button>
      )}
    </div>
  );
}

/** 카드 하나의 텍스트 필드 묶음을 렌더한다. */
function PriceTextCard({
  group,
  getValue,
  onChange,
  editingKey,
  setEditingKey,
}: {
  group: PriceTextGroup;
  getValue: (key: string) => string;
  onChange: (key: string, value: string) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[var(--paper)] p-4 space-y-3">
      <p className="text-xs font-bold text-[var(--ink)]">{group.cardLabel}</p>
      {group.fields.map((field) => (
        <EditablePriceField
          key={field.key}
          field={field}
          value={getValue(field.key)}
          onChange={(v) => onChange(field.key, v)}
          isEditing={editingKey === field.key}
          onStartEdit={() => setEditingKey(field.key)}
          onStopEdit={() => setEditingKey(null)}
        />
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "text" | "portfolio" | "review" | "promise" | "price" | "reservationForm" | "reservation"
  >("text");
  const [loading, setLoading] = useState(true);

  // States for DB data
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [promises, setPromises] = useState<PromiseItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  // Action states
  const [isSavingText, setIsSavingText] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [reorderStatus, setReorderStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // New item form states
  const [newVideo, setNewVideo] = useState({ title: "", youtubeId: "", type: "regular" });
  const [newReview, setNewReview] = useState({ author: "", content: "" });
  const [newPromise, setNewPromise] = useState({ title: "", content: "" });
  const [savingPromiseId, setSavingPromiseId] = useState<string | null>(null);

  // 가격 섹션 카드 순서(id 배열). 내용은 코드에 고정, 순서만 관리.
  const [priceRow1, setPriceRow1] = useState<string[]>(PRICE_ROW1_CARDS.map((c) => c.id));
  const [priceRow2, setPriceRow2] = useState<string[]>(PRICE_ROW2_CARDS.map((c) => c.id));

  // 예약 폼 — 새로 추가할 칸 입력값
  const [newCustomField, setNewCustomField] = useState({ label: "", required: false });

  // 가격 카드 텍스트 편집 — 현재 클릭해서 편집 중인 필드 key(하나만)
  const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch site content
      const resContent = await fetch("/api/admin/content");
      if (resContent.ok) {
        const contentData = await resContent.json();
        const contentMap: Record<string, string> = {};
        contentData?.forEach((item: SiteContent) => {
          contentMap[item.key] = item.value;
        });
        setSiteContent(contentMap);
        setPriceRow1(applyPriceOrder(PRICE_ROW1_CARDS, contentMap[PRICE_ROW1_ORDER_KEY]));
        setPriceRow2(applyPriceOrder(PRICE_ROW2_CARDS, contentMap[PRICE_ROW2_ORDER_KEY]));      }

      // 2. Fetch portfolios
      const resPort = await fetch("/api/admin/portfolio");
      if (resPort.ok) {
        const portData = await resPort.json();
        setPortfolios(portData || []);
      }

      // 3. Fetch reviews
      const resRev = await fetch("/api/admin/review");
      if (resRev.ok) {
        const revData = await resRev.json();
        setReviews(revData || []);
      }

      // 3-1. Fetch promise cards
      const resProm = await fetch("/api/admin/promise");
      if (resProm.ok) {
        const promData = await resProm.json();
        setPromises(promData || []);
      }

      // 4. Fetch reservations
      const resRes = await fetch("/api/admin/reservation");
      if (resRes.ok) {
        const resData = await resRes.json();
        setReservations(resData || []);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // 1. Text Content Save
  const handleSaveText = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingText(true);
    setSaveStatus("idle");

    try {
      const updates = Object.entries(siteContent).map(([key, value]) => ({
        key,
        value,
      }));

      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to save content");
      setSaveStatus("success");
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSavingText(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleTextChange = (key: string, value: string) => {
    setSiteContent((prev) => ({ ...prev, [key]: value }));
  };

  // 2. Portfolio actions
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.youtubeId) return;

    try {
      // orderIndex는 type별 0..n-1 시퀀스이므로 같은 종류의 개수를 쓴다.
      const orderIndex = portfolios.filter((v) => v.type === newVideo.type).length;
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVideo.title,
          youtube_id: newVideo.youtubeId,
          type: newVideo.type,
          order_index: orderIndex,
        }),
      });

      if (!res.ok) throw new Error("Failed to add video");
      const data = await res.json();

      setPortfolios((prev) => [...prev, data]);
      setNewVideo({ title: "", youtubeId: "", type: "regular" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("정말 이 영상을 포트폴리오에서 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/portfolio?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      setPortfolios((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 드래그 순서 변경 — 낙관적 갱신 후 저장, 실패하면 이전 순서로 롤백
  const handleReorderVideos = async (type: string, activeId: string, overId: string) => {
    const prevPortfolios = portfolios;

    const list = prevPortfolios.filter((v) => v.type === type);
    const oldIndex = list.findIndex((v) => v.id === activeId);
    const newIndex = list.findIndex((v) => v.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // 해당 종류만 재배열하고 0..n-1로 다시 매긴다. 다른 종류는 건드리지 않는다.
    const reordered = arrayMove(list, oldIndex, newIndex).map((video, idx) => ({
      ...video,
      orderIndex: idx,
    }));

    let cursor = 0;
    const next = prevPortfolios.map((v) => (v.type === type ? reordered[cursor++] : v));

    setPortfolios(next);
    setReorderStatus("saving");

    try {
      const res = await fetch("/api/admin/portfolio/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reordered.map((video) => ({ id: video.id, order_index: video.orderIndex }))
        ),
      });

      if (!res.ok) throw new Error("Failed to reorder videos");
      setReorderStatus("success");
    } catch (err) {
      console.error(err);
      setPortfolios(prevPortfolios);
      setReorderStatus("error");
    } finally {
      setTimeout(() => setReorderStatus("idle"), 3000);
    }
  };

  // 3. Review actions
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.author || !newReview.content) return;

    try {
      const orderIndex = reviews.length;
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: newReview.author,
          content: newReview.content,
          order_index: orderIndex,
        }),
      });

      if (!res.ok) throw new Error("Failed to add review");
      const data = await res.json();

      setReviews((prev) => [...prev, data]);
      setNewReview({ author: "", content: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/review?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      setReviews((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 후기 드래그 순서 변경 — 낙관적 갱신 후 저장, 실패하면 이전 순서로 롤백
  const handleReorderReviews = async (activeId: string, overId: string) => {
    const prevReviews = reviews;

    const oldIndex = prevReviews.findIndex((r) => r.id === activeId);
    const newIndex = prevReviews.findIndex((r) => r.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // 0..n-1로 orderIndex를 다시 매긴다.
    const reordered = arrayMove(prevReviews, oldIndex, newIndex).map((review, idx) => ({
      ...review,
      orderIndex: idx,
    }));

    setReviews(reordered);
    setReorderStatus("saving");

    try {
      const res = await fetch("/api/admin/review/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reordered.map((review) => ({ id: review.id, order_index: review.orderIndex }))
        ),
      });

      if (!res.ok) throw new Error("Failed to reorder reviews");
      setReorderStatus("success");
    } catch (err) {
      console.error(err);
      setReviews(prevReviews);
      setReorderStatus("error");
    } finally {
      setTimeout(() => setReorderStatus("idle"), 3000);
    }
  };

  // 3-1. Promise card actions
  const handleAddPromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromise.title || !newPromise.content) return;

    try {
      const orderIndex = promises.length;
      const res = await fetch("/api/admin/promise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPromise.title,
          content: newPromise.content,
          order_index: orderIndex,
        }),
      });

      if (!res.ok) throw new Error("Failed to add promise card");
      const data = await res.json();

      setPromises((prev) => [...prev, data]);
      setNewPromise({ title: "", content: "" });
    } catch (err) {
      console.error(err);
    }
  };

  // 로컬 편집(입력) — 저장은 "저장" 버튼으로.
  const handlePromiseChange = (
    id: string,
    patch: Partial<Pick<PromiseItem, "title" | "content">>
  ) => {
    setPromises((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const handleSavePromise = async (id: string) => {
    const target = promises.find((p) => p.id === id);
    if (!target) return;
    if (!target.title || !target.content) return;

    setSavingPromiseId(id);
    try {
      const res = await fetch("/api/admin/promise", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: target.title, content: target.content }),
      });
      if (!res.ok) throw new Error("Failed to update promise card");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPromiseId(null);
    }
  };

  const handleDeletePromise = async (id: string) => {
    if (!confirm("정말 이 약속 카드를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/promise?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete promise card");
      setPromises((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 약속 카드 드래그 순서 변경 — 낙관적 갱신 후 저장, 실패하면 이전 순서로 롤백
  const handleReorderPromises = async (activeId: string, overId: string) => {
    const prevPromises = promises;

    const oldIndex = prevPromises.findIndex((p) => p.id === activeId);
    const newIndex = prevPromises.findIndex((p) => p.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(prevPromises, oldIndex, newIndex).map((promise, idx) => ({
      ...promise,
      orderIndex: idx,
    }));

    setPromises(reordered);
    setReorderStatus("saving");

    try {
      const res = await fetch("/api/admin/promise/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reordered.map((promise) => ({ id: promise.id, order_index: promise.orderIndex }))
        ),
      });

      if (!res.ok) throw new Error("Failed to reorder promise cards");
      setReorderStatus("success");
    } catch (err) {
      console.error(err);
      setPromises(prevPromises);
      setReorderStatus("error");
    } finally {
      setTimeout(() => setReorderStatus("idle"), 3000);
    }
  };

  // 가격 카드 순서 변경 — 순서(id CSV)만 siteContent에 저장. 낙관적 갱신 후 저장, 실패 시 롤백.
  const handleReorderPriceCards = async (row: 1 | 2, activeId: string, overId: string) => {
    const current = row === 1 ? priceRow1 : priceRow2;
    const setter = row === 1 ? setPriceRow1 : setPriceRow2;
    const key = row === 1 ? PRICE_ROW1_ORDER_KEY : PRICE_ROW2_ORDER_KEY;

    const oldIndex = current.indexOf(activeId);
    const newIndex = current.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = current;
    const next = arrayMove(current, oldIndex, newIndex);
    const value = next.join(",");

    setter(next);
    setSiteContent((c) => ({ ...c, [key]: value }));
    setReorderStatus("saving");

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ key, value }]),
      });

      if (!res.ok) throw new Error("Failed to save price card order");
      setReorderStatus("success");
    } catch (err) {
      console.error(err);
      setter(prev);
      setSiteContent((c) => ({ ...c, [key]: prev.join(",") }));
      setReorderStatus("error");
    } finally {
      setTimeout(() => setReorderStatus("idle"), 3000);
    }
  };

  // 예약 폼 설정 값 하나를 즉시 저장. 화면은 siteContent에서 바로 파생되므로 낙관적으로 갱신하고,
  // 실패하면 이전 값으로 되돌린다.
  const saveReservationSetting = async (key: string, value: string) => {
    const prevValue = siteContent[key];
    setSiteContent((c) => ({ ...c, [key]: value }));
    setReorderStatus("saving");

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ key, value }]),
      });

      if (!res.ok) throw new Error("Failed to save reservation form setting");
      setReorderStatus("success");
    } catch (err) {
      console.error(err);
      setSiteContent((c) => {
        const next = { ...c };
        if (prevValue === undefined) delete next[key];
        else next[key] = prevValue;
        return next;
      });
      setReorderStatus("error");
    } finally {
      setTimeout(() => setReorderStatus("idle"), 3000);
    }
  };

  const handleReorderReservationFields = (activeId: string, overId: string) => {
    const order = reservationFieldOrder(siteContent);
    const oldIndex = order.indexOf(activeId);
    const newIndex = order.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;
    saveReservationSetting(RESERVATION_ORDER_KEY, arrayMove(order, oldIndex, newIndex).join(","));
  };

  const toggleInCsvSet = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return [...next].join(",");
  };

  const handleToggleReservationWide = (id: string) => {
    saveReservationSetting(RESERVATION_WIDE_KEY, toggleInCsvSet(reservationWideIds(siteContent), id));
  };

  const handleToggleReservationHidden = (id: string) => {
    saveReservationSetting(RESERVATION_HIDDEN_KEY, toggleInCsvSet(reservationHiddenIds(siteContent), id));
  };

  const handleAddCustomField = () => {
    const label = newCustomField.label.trim().slice(0, CUSTOM_LABEL_MAX);
    if (!label) return;
    const defs = parseCustomFields(siteContent[RESERVATION_CUSTOM_KEY]);
    if (defs.length >= CUSTOM_FIELDS_MAX) return;
    const next = [...defs, { id: newCustomFieldId(), label, required: newCustomField.required }];
    saveReservationSetting(RESERVATION_CUSTOM_KEY, JSON.stringify(next));
    setNewCustomField({ label: "", required: false });
  };

  const handleToggleCustomRequired = (id: string) => {
    const next = parseCustomFields(siteContent[RESERVATION_CUSTOM_KEY]).map((d) =>
      d.id === id ? { ...d, required: !d.required } : d
    );
    saveReservationSetting(RESERVATION_CUSTOM_KEY, JSON.stringify(next));
  };

  const handleDeleteCustomField = (id: string, label: string) => {
    if (!confirm(`"${label}" 칸을 삭제하시겠습니까?\n이미 접수된 예약에 저장된 답변은 그대로 남습니다.`)) return;
    const next = parseCustomFields(siteContent[RESERVATION_CUSTOM_KEY]).filter((d) => d.id !== id);
    saveReservationSetting(RESERVATION_CUSTOM_KEY, JSON.stringify(next));
  };

  // 4. Reservation actions
  const handleUpdateResStatus = async (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      pending: "approved",
      approved: "cancelled",
      cancelled: "pending",
    };
    const newStatus = nextStatusMap[currentStatus] || "pending";

    try {
      const res = await fetch("/api/admin/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setReservations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm("정말 이 예약 신청 내역을 영구 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/reservation?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete reservation");
      setReservations((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"></div>
        <p className="mt-4 text-sm text-[var(--muted)]">데이터 로드 중...</p>
      </div>
    );
  }

  // 예약 폼 설정 화면용 파생 값 (모두 siteContent에서 계산)
  const resFields = getReservationFields(siteContent);
  const resOrder = reservationFieldOrder(siteContent);
  const resWide = reservationWideIds(siteContent);
  const resHidden = reservationHiddenIds(siteContent);
  const resCustomCount = resFields.filter((f) => f.custom).length;
  const resPlaceholderGroup = reservationPlaceholderGroup(resFields);
  const resTextDefault = (key: string) =>
    resPlaceholderGroup.fields.find((f) => f.key === key)?.default ?? reservationText(undefined, key);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* 어드민 상단 헤더 */}
      <header className="border-b border-black/5 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="오프닝필름"
              width={140}
              height={35}
              className="h-7 w-auto"
            />
            <span className="h-4 w-px bg-black/10" />
            <h1 className="text-sm font-semibold tracking-wider text-[var(--ink)] uppercase">
              Admin Console
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold text-[var(--muted)] hover:border-rose-300 hover:text-rose-600 transition-all cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* 탭 버튼 그룹 */}
        <div className="mb-8 flex gap-2 border-b border-black/5 pb-px">
          {[
            { id: "text", label: "페이지 텍스트" },
            { id: "portfolio", label: "포트폴리오 관리" },
            { id: "review", label: "고객 후기" },
            { id: "promise", label: "ABOUT 섹션" },
            { id: "price", label: "PRICE/GUIDE 섹션" },
            { id: "reservationForm", label: "예약 폼 설정" },
            { id: "reservation", label: "예약 내역 조회" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 영역 */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
          
          {/* TAB 1: SITE TEXT CONTENT */}
          {activeTab === "text" && (
            <form onSubmit={handleSaveText} className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold">메인 페이지 텍스트 설정</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">사이트에 노출되는 주요 문구 및 링크 주소들을 변경합니다.</p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingText}
                  className="rounded-full bg-[var(--ink)] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingText ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>

              {saveStatus === "success" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 text-sm">
                  변경 사항이 성공적으로 저장되었습니다.
                </div>
              )}
              {saveStatus === "error" && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm">
                  오류가 발생하여 저장에 실패했습니다.
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold border-b border-black/5 pb-2 text-[var(--accent)]">히어로 섹션 문구</h3>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">히어로 타이틀 1</label>
                    <input
                      type="text"
                      value={siteContent["hero_title_1"] || ""}
                      onChange={(e) => handleTextChange("hero_title_1", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">히어로 타이틀 2</label>
                    <input
                      type="text"
                      value={siteContent["hero_title_2"] || ""}
                      onChange={(e) => handleTextChange("hero_title_2", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">히어로 상세 설명</label>
                    <textarea
                      rows={3}
                      value={siteContent["hero_desc"] || ""}
                      onChange={(e) => handleTextChange("hero_desc", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">히어로 유튜브 동영상 ID</label>
                    <input
                      type="text"
                      value={siteContent["hero_youtube_id"] || ""}
                      onChange={(e) => handleTextChange("hero_youtube_id", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold border-b border-black/5 pb-2 text-[var(--accent)]">About 섹션 문구</h3>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">About 타이틀</label>
                    <input
                      type="text"
                      value={siteContent["about_title"] || ""}
                      onChange={(e) => handleTextChange("about_title", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">본문 문단 1</label>
                    <textarea
                      rows={2}
                      value={siteContent["about_text_1"] || ""}
                      onChange={(e) => handleTextChange("about_text_1", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">본문 문단 2</label>
                    <textarea
                      rows={3}
                      value={siteContent["about_text_2"] || ""}
                      onChange={(e) => handleTextChange("about_text_2", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">본문 문단 3</label>
                    <textarea
                      rows={2}
                      value={siteContent["about_text_3"] || ""}
                      onChange={(e) => handleTextChange("about_text_3", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">하단 강조 문구</label>
                    <input
                      type="text"
                      value={siteContent["about_bottom"] || ""}
                      onChange={(e) => handleTextChange("about_bottom", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 border-t border-black/5 pt-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold border-b border-black/5 pb-2 text-[var(--accent)]">가격 및 링크 설정</h3>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">단일 구성 상세 제목</label>
                    <input
                      type="text"
                      value={siteContent["price_title"] || ""}
                      onChange={(e) => handleTextChange("price_title", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">기본 가격</label>
                    <input
                      type="text"
                      value={siteContent["price_val"] || ""}
                      onChange={(e) => handleTextChange("price_val", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold border-b border-black/5 pb-2 text-[var(--accent)]">연락처 및 외부 채널</h3>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">카카오톡 채널 주소</label>
                    <input
                      type="text"
                      value={siteContent["contact_kakao_url"] || ""}
                      onChange={(e) => handleTextChange("contact_kakao_url", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] mb-2">푸터 연락처 / 이메일 안내문구</label>
                    <input
                      type="text"
                      value={siteContent["contact_phone"] || ""}
                      onChange={(e) => handleTextChange("contact_phone", e.target.value)}
                      className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </form>
          )}

          {/* TAB 2: PORTFOLIO VIDEO MANAGEMENT */}
          {activeTab === "portfolio" && (
            <div className="space-y-8">
              {/* 추가 양식 */}
              <div>
                <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--accent)]">새 포트폴리오 영상 추가</h3>
                <form onSubmit={handleAddVideo} className="grid gap-4 md:grid-cols-4 items-end bg-[var(--paper)] p-4 rounded-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">영상 분류</label>
                    <select
                      value={newVideo.type}
                      onChange={(e) => setNewVideo((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    >
                      <option value="regular">일반 가로 포트폴리오</option>
                      <option value="shorts">세로 숏폼(Shorts)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">영상 제목</label>
                    <input
                      type="text"
                      required
                      placeholder="오프닝필름 샘플 5"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">유튜브 Video ID</label>
                    <input
                      type="text"
                      required
                      placeholder="gKC6YGV8QGY (URL 끝 코드)"
                      value={newVideo.youtubeId}
                      onChange={(e) => setNewVideo((prev) => ({ ...prev, youtubeId: e.target.value }))}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[var(--ink)] text-white py-2.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer"
                  >
                    추가하기
                  </button>
                </form>
              </div>

              {/* 목록 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-[var(--muted)]">
                    ⠿ 핸들을 드래그해 순서를 바꾸면 즉시 저장되고 실제 페이지에 반영됩니다.
                  </p>
                  {reorderStatus === "saving" && (
                    <span className="text-xs text-[var(--muted)]">순서 저장 중...</span>
                  )}
                  {reorderStatus === "success" && (
                    <span className="text-xs font-semibold text-emerald-600">순서가 저장되었습니다.</span>
                  )}
                  {reorderStatus === "error" && (
                    <span className="text-xs font-semibold text-rose-600">
                      순서 저장에 실패해 이전 상태로 되돌렸습니다.
                    </span>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* 가로형 비디오 */}
                  <div>
                    <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--ink)]">일반 비디오 목록 ({portfolios.filter(v => v.type === "regular").length})</h3>
                    <SortableVideoList
                      videos={portfolios.filter((v) => v.type === "regular")}
                      onReorder={(activeId, overId) => handleReorderVideos("regular", activeId, overId)}
                      onDelete={handleDeleteVideo}
                      emptyMessage="등록된 가로형 영상이 없습니다."
                    />
                  </div>

                  {/* 쇼츠 비디오 */}
                  <div>
                    <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--ink)]">숏폼(Shorts) 목록 ({portfolios.filter(v => v.type === "shorts").length})</h3>
                    <SortableVideoList
                      videos={portfolios.filter((v) => v.type === "shorts")}
                      onReorder={(activeId, overId) => handleReorderVideos("shorts", activeId, overId)}
                      onDelete={handleDeleteVideo}
                      emptyMessage="등록된 숏폼 영상이 없습니다."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER REVIEWS */}
          {activeTab === "review" && (
            <div className="space-y-8">
              {/* 추가 폼 */}
              <div>
                <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--accent)]">새 고객 후기 추가</h3>
                <form onSubmit={handleAddReview} className="space-y-4 bg-[var(--paper)] p-5 rounded-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">작성자 이름</label>
                    <input
                      type="text"
                      required
                      placeholder="김민우"
                      value={newReview.author}
                      onChange={(e) => setNewReview((prev) => ({ ...prev, author: e.target.value }))}
                      className="w-full max-w-xs rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">후기 본문</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="촬영 분위기가 너무 편안했고 결과물 색감도 너무 고급스러워요..."
                      value={newReview.content}
                      onChange={(e) => setNewReview((prev) => ({ ...prev, content: e.target.value }))}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--ink)] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer"
                  >
                    추가하기
                  </button>
                </form>
              </div>

              {/* 목록 */}
              <div>
                <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--ink)]">후기 목록 ({reviews.length})</h3>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-[var(--muted)]">
                    ⠿ 핸들을 드래그해 순서를 바꾸면 즉시 저장되고 실제 페이지에 반영됩니다.
                  </p>
                  {reorderStatus === "saving" && (
                    <span className="text-xs text-[var(--muted)]">순서 저장 중...</span>
                  )}
                  {reorderStatus === "success" && (
                    <span className="text-xs font-semibold text-emerald-600">순서가 저장되었습니다.</span>
                  )}
                  {reorderStatus === "error" && (
                    <span className="text-xs font-semibold text-rose-600">
                      순서 저장에 실패해 이전 상태로 되돌렸습니다.
                    </span>
                  )}
                </div>
                <SortableReviewList
                  reviews={reviews}
                  onReorder={handleReorderReviews}
                  onDelete={handleDeleteReview}
                />
              </div>
            </div>
          )}

          {/* TAB 3-1: PROMISE CARDS */}
          {activeTab === "promise" && (
            <div className="space-y-8">
              {/* 추가 폼 */}
              <div>
                <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--accent)]">새 약속 카드 추가</h3>
                <form onSubmit={handleAddPromise} className="space-y-4 bg-[var(--paper)] p-5 rounded-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">제목</label>
                    <input
                      type="text"
                      required
                      placeholder="투명하고 합리적인 가치"
                      value={newPromise.title}
                      onChange={(e) => setNewPromise((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full max-w-md rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">내용</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="누구나 부담 없이 다가올 수 있는 정직한 가성비를 제안합니다."
                      value={newPromise.content}
                      onChange={(e) => setNewPromise((prev) => ({ ...prev, content: e.target.value }))}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--ink)] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer"
                  >
                    추가하기
                  </button>
                </form>
              </div>

              {/* 목록 */}
              <div>
                <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--ink)]">약속 카드 목록 ({promises.length})</h3>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-[var(--muted)]">
                    ⠿ 핸들을 드래그해 순서를 바꾸면 즉시 저장됩니다. 제목·내용을 고친 뒤에는 카드의 <span className="font-semibold">저장</span> 버튼을 눌러야 반영됩니다.
                  </p>
                  {reorderStatus === "saving" && (
                    <span className="text-xs text-[var(--muted)]">순서 저장 중...</span>
                  )}
                  {reorderStatus === "success" && (
                    <span className="text-xs font-semibold text-emerald-600">순서가 저장되었습니다.</span>
                  )}
                  {reorderStatus === "error" && (
                    <span className="text-xs font-semibold text-rose-600">
                      순서 저장에 실패해 이전 상태로 되돌렸습니다.
                    </span>
                  )}
                </div>
                <div className="max-w-2xl">
                  <SortablePromiseList
                    promises={promises}
                    onChange={handlePromiseChange}
                    onSave={handleSavePromise}
                    onDelete={handleDeletePromise}
                    onReorder={handleReorderPromises}
                    savingId={savingPromiseId}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3-2: PRICE / GUIDE SECTION */}
          {activeTab === "price" && (
            <form onSubmit={handleSaveText} className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">PRICE / GUIDE 섹션 설정</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    가격 안내 카드의 순서와 문구를 관리합니다. 카드 구조는 유지되고 순서·내용만 바뀝니다.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingText}
                  className="rounded-full bg-[var(--ink)] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingText ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>

              {saveStatus === "success" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 text-sm">
                  변경 사항이 성공적으로 저장되었습니다.
                </div>
              )}
              {saveStatus === "error" && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm">
                  오류가 발생하여 저장에 실패했습니다.
                </div>
              )}

              {/* 가격 카드 순서 변경 — 순서만 드래그로 변경(즉시 저장) */}
              <div className="border-t border-black/5 pt-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-[var(--accent)]">가격 섹션 카드 순서</h3>
                  {reorderStatus === "saving" && (
                    <span className="text-xs text-[var(--muted)]">순서 저장 중...</span>
                  )}
                  {reorderStatus === "success" && (
                    <span className="text-xs font-semibold text-emerald-600">순서가 저장되었습니다.</span>
                  )}
                  {reorderStatus === "error" && (
                    <span className="text-xs font-semibold text-rose-600">
                      순서 저장에 실패해 이전 상태로 되돌렸습니다.
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mb-4">
                  ⠿ 핸들을 드래그해 순서를 바꾸면 즉시 저장되고 실제 페이지에 반영됩니다. 카드 내용은 변경되지 않고 순서만 바뀝니다. (윗줄/아랫줄은 각 줄 안에서만 이동)
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] mb-3">윗줄 (3단 구성)</p>
                    <SortableLabelList
                      items={priceRow1.map((id) => ({
                        id,
                        label: PRICE_ROW1_CARDS.find((c) => c.id === id)?.label ?? id,
                      }))}
                      onReorder={(activeId, overId) => handleReorderPriceCards(1, activeId, overId)}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] mb-3">아랫줄 (2단 구성)</p>
                    <SortableLabelList
                      items={priceRow2.map((id) => ({
                        id,
                        label: PRICE_ROW2_CARDS.find((c) => c.id === id)?.label ?? id,
                      }))}
                      onReorder={(activeId, overId) => handleReorderPriceCards(2, activeId, overId)}
                    />
                  </div>
                </div>
              </div>

              {/* 가격 카드 텍스트 편집 — 클릭하면 편집, 상단 "변경사항 저장"으로 반영 */}
              <div className="border-t border-black/5 pt-6">
                <h3 className="text-sm font-bold text-[var(--accent)] mb-1">가격 섹션 카드 내용</h3>
                <p className="text-xs text-[var(--muted)] mb-4">
                  각 항목을 클릭하면 편집할 수 있습니다. 카드 구조는 그대로 유지되고 문구만 바뀝니다.
                  줄바꿈은 Enter로 넣으며, 수정 후 상단의 <span className="font-semibold">변경사항 저장</span> 버튼을 눌러야 반영됩니다.
                </p>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] mb-3">윗줄 (3단 구성)</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {PRICE_ROW1_TEXT.map((group) => (
                        <PriceTextCard
                          key={group.cardId}
                          group={group}
                          getValue={(key) => siteContent[key] ?? PRICE_TEXT_DEFAULTS[key] ?? ""}
                          onChange={handleTextChange}
                          editingKey={editingPriceKey}
                          setEditingKey={setEditingPriceKey}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] mb-3">아랫줄 (2단 구성)</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {PRICE_ROW2_TEXT.map((group) => (
                        <PriceTextCard
                          key={group.cardId}
                          group={group}
                          getValue={(key) => siteContent[key] ?? PRICE_TEXT_DEFAULTS[key] ?? ""}
                          onChange={handleTextChange}
                          editingKey={editingPriceKey}
                          setEditingKey={setEditingPriceKey}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB: RESERVATION FORM SETTINGS */}
          {activeTab === "reservationForm" && (
            <form onSubmit={handleSaveText} className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">예약 폼 설정</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    예약 신청 섹션의 입력 칸 순서·너비와 안내 문구를 관리합니다.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingText}
                  className="rounded-full bg-[var(--ink)] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingText ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>

              {saveStatus === "success" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 text-sm">
                  변경 사항이 성공적으로 저장되었습니다.
                </div>
              )}
              {saveStatus === "error" && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm">
                  오류가 발생하여 저장에 실패했습니다.
                </div>
              )}

              {/* 입력 칸 배치 — 드래그/토글 즉시 저장 */}
              <div className="border-t border-black/5 pt-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-[var(--accent)]">입력 칸 순서와 너비</h3>
                  {reorderStatus === "saving" && (
                    <span className="text-xs text-[var(--muted)]">저장 중...</span>
                  )}
                  {reorderStatus === "success" && (
                    <span className="text-xs font-semibold text-emerald-600">저장되었습니다.</span>
                  )}
                  {reorderStatus === "error" && (
                    <span className="text-xs font-semibold text-rose-600">
                      저장에 실패해 이전 상태로 되돌렸습니다.
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mb-4">
                  ⠿ 핸들을 드래그해 순서를 바꾸고, 오른쪽 버튼으로 너비·숨김·필수 여부를 고르면 즉시 저장되어 실제 페이지에 반영됩니다.
                  옆에 짝이 없는 반칸은 빈자리가 생기지 않도록 자동으로 한 줄 전체를 씁니다. (모바일에서는 항상 한 줄에 하나씩 표시)
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] mb-3">칸 목록</p>
                    <SortableLabelList
                      items={resOrder.map((id) => {
                        const meta = resFields.find((f) => f.id === id);
                        const wide = resWide.has(id);
                        const hidden = resHidden.has(id);
                        const pill = (active: boolean) =>
                          `rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            active
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : "border-black/15 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
                          }`;
                        return {
                          id,
                          label:
                            (meta?.label ?? id) +
                            (meta?.required ? " *" : "") +
                            (meta?.custom ? " (추가)" : "") +
                            (hidden ? " — 숨김" : ""),
                          extra: (
                            <>
                              {meta?.custom && (
                                <button type="button" onClick={() => handleToggleCustomRequired(id)} className={pill(meta.required)}>
                                  {meta.required ? "필수" : "선택"}
                                </button>
                              )}
                              {meta?.hideable && (
                                <button type="button" onClick={() => handleToggleReservationHidden(id)} className={pill(hidden)}>
                                  {hidden ? "숨김" : "표시"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleReservationWide(id)}
                                disabled={hidden}
                                className={`${pill(wide)} disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {wide ? "한 줄 전체" : "반칸"}
                              </button>
                              {meta?.custom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomField(id, meta.label)}
                                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                                >
                                  삭제
                                </button>
                              )}
                            </>
                          ),
                        };
                      })}
                      onReorder={handleReorderReservationFields}
                    />
                    <p className="text-[11px] text-[var(--muted)] mt-3">
                      * 표시는 필수 입력 항목입니다. 예식 날짜·시간·장소·연락처는 예약 접수에 꼭 필요해 숨길 수 없습니다.
                    </p>

                    {/* 새 칸 추가 */}
                    <div className="mt-5 rounded-2xl border border-dashed border-black/15 p-4">
                      <p className="text-xs font-bold text-[var(--ink)] mb-1">새 칸 추가</p>
                      <p className="text-[11px] text-[var(--muted)] mb-3">
                        예: 신부 연락처, 추천인. 추가한 칸은 목록 맨 아래에 생기며, 위에서 순서·너비를 바꿀 수 있습니다.
                        고객이 입력한 내용은 예약 내역과 구글 시트의 &quot;추가 항목&quot;에 함께 기록됩니다.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={newCustomField.label}
                          maxLength={CUSTOM_LABEL_MAX}
                          onChange={(e) => setNewCustomField((s) => ({ ...s, label: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              handleAddCustomField();
                            }
                          }}
                          placeholder="칸 이름"
                          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs focus:border-[var(--accent)] focus:outline-none"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-[var(--muted)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCustomField.required}
                            onChange={(e) => setNewCustomField((s) => ({ ...s, required: e.target.checked }))}
                          />
                          필수
                        </label>
                        <button
                          type="button"
                          onClick={handleAddCustomField}
                          disabled={!newCustomField.label.trim() || resCustomCount >= CUSTOM_FIELDS_MAX}
                          className="rounded-full bg-[var(--ink)] text-white px-4 py-2 text-xs font-semibold hover:bg-[var(--accent)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          추가
                        </button>
                      </div>
                      {resCustomCount >= CUSTOM_FIELDS_MAX && (
                        <p className="text-[11px] text-rose-600 mt-2">추가 칸은 최대 {CUSTOM_FIELDS_MAX}개까지 만들 수 있습니다.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] mb-3">미리보기 (PC 화면 배치)</p>
                    <div className="rounded-2xl bg-[var(--mist)] p-4 grid grid-cols-2 gap-2">
                      {visibleReservationLayout(siteContent).map((slot) => {
                        const meta = resFields.find((f) => f.id === slot.id)!;
                        return (
                          <div
                            key={slot.id}
                            className={`rounded-lg border border-black/15 bg-white px-3 py-2 text-[11px] text-[var(--muted)] truncate ${
                              slot.full ? "col-span-2" : ""
                            }`}
                          >
                            {reservationPlaceholder(siteContent, meta)}
                            {slot.autoFull && (
                              <span className="ml-1 text-[10px] text-[var(--accent)]">(자동 확장)</span>
                            )}
                          </div>
                        );
                      })}
                      <div className="col-span-2 mt-1 rounded-full border border-black/30 py-1.5 text-center text-[11px] font-semibold text-[var(--ink)]">
                        {reservationText(siteContent, "reservation_submit")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 문구 편집 — 클릭하면 편집, 상단 "변경사항 저장"으로 반영 */}
              <div className="border-t border-black/5 pt-6">
                <h3 className="text-sm font-bold text-[var(--accent)] mb-1">예약 섹션 문구</h3>
                <p className="text-xs text-[var(--muted)] mb-4">
                  각 항목을 클릭하면 편집할 수 있습니다. 입력 칸 문구는 고객이 입력하기 전 칸 안에 흐리게 보이는 안내입니다.
                  수정 후 상단의 <span className="font-semibold">변경사항 저장</span> 버튼을 눌러야 반영됩니다.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {[RESERVATION_INTRO_TEXT, resPlaceholderGroup, RESERVATION_BUTTON_TEXT].map((group) => (
                    <PriceTextCard
                      key={group.cardId}
                      group={group}
                      getValue={(key) => siteContent[key] ?? resTextDefault(key)}
                      onChange={handleTextChange}
                      editingKey={editingPriceKey}
                      setEditingKey={setEditingPriceKey}
                    />
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: RESERVATION REQUESTS */}
          {activeTab === "reservation" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">오프닝필름 예약 신청 내역</h2>
                <p className="text-xs text-[var(--muted)] mt-1">고객들이 랜딩 페이지에서 작성한 예약 폼 내역 목록입니다.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/10 bg-[var(--paper)] text-[var(--muted)] font-semibold uppercase">
                      <th className="px-4 py-3">신랑 / 신부</th>
                      <th className="px-4 py-3">예식일시 / 장소</th>
                      <th className="px-4 py-3">연락처</th>
                      <th className="px-4 py-3">추가 항목</th>
                      <th className="px-4 py-3">신청시간</th>
                      <th className="px-4 py-3 text-center">상태</th>
                      <th className="px-4 py-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => (
                      <tr key={res.id} className="border-b border-black/5 hover:bg-[var(--paper)] transition-all">
                        <td className="px-4 py-4 font-semibold text-[var(--ink)]">
                          {res.groomName || "-"} / {res.brideName || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{res.weddingDate} {res.weddingTime}</p>
                          <p className="text-[var(--muted)] mt-0.5">{res.weddingLocation}</p>
                        </td>
                        <td className="px-4 py-4 text-[var(--ink-soft)] font-medium">
                          <p>{res.contact}</p>
                          {res.email ? (
                            <p className="text-[var(--muted)] mt-0.5">{res.email}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-[var(--ink-soft)]">
                          {parseReservationExtra(res.extra).length > 0
                            ? parseReservationExtra(res.extra).map((entry, idx) => (
                                <p key={idx} className={idx > 0 ? "mt-0.5" : ""}>
                                  <span className="text-[var(--muted)]">{entry.label}:</span> {entry.value}
                                </p>
                              ))
                            : <span className="text-[var(--muted)]">-</span>}
                        </td>
                        <td className="px-4 py-4 text-[var(--muted)]">
                          {new Date(res.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleUpdateResStatus(res.id, res.status)}
                            className={`rounded-full px-3 py-1 font-bold text-[10px] cursor-pointer uppercase transition-all ${
                              res.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : res.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {res.status === "approved"
                              ? "확정됨"
                              : res.status === "cancelled"
                              ? "취소됨"
                              : "대기중"}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleDeleteReservation(res.id)}
                            className="text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[var(--muted)]">
                          아직 접수된 예약이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
