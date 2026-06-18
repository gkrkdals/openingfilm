"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

interface ReservationItem {
  id: string;
  groomName: string | null;
  brideName: string | null;
  weddingDate: string;
  weddingTime: string;
  weddingLocation: string;
  contact: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"text" | "portfolio" | "review" | "reservation">("text");
  const [loading, setLoading] = useState(true);

  // States for DB data
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  // Action states
  const [isSavingText, setIsSavingText] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // New item form states
  const [newVideo, setNewVideo] = useState({ title: "", youtubeId: "", type: "regular" });
  const [newReview, setNewReview] = useState({ author: "", content: "" });

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
      }

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
      const orderIndex = portfolios.length;
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
              <div className="grid gap-6 md:grid-cols-2">
                {/* 가로형 비디오 */}
                <div>
                  <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--ink)]">일반 비디오 목록 ({portfolios.filter(v => v.type === "regular").length})</h3>
                  <div className="space-y-3">
                    {portfolios
                      .filter((v) => v.type === "regular")
                      .map((video) => (
                        <div key={video.id} className="flex items-center justify-between border border-black/5 rounded-2xl p-4 bg-white shadow-sm">
                          <div>
                            <p className="font-semibold text-sm">{video.title}</p>
                            <p className="text-xs text-[var(--muted)] mt-0.5">ID: {video.youtubeId}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    {portfolios.filter(v => v.type === "regular").length === 0 && (
                      <p className="text-xs text-[var(--muted)] py-4 text-center">등록된 가로형 영상이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 쇼츠 비디오 */}
                <div>
                  <h3 className="text-sm font-bold border-b border-black/5 pb-2 mb-4 text-[var(--ink)]">숏폼(Shorts) 목록 ({portfolios.filter(v => v.type === "shorts").length})</h3>
                  <div className="space-y-3">
                    {portfolios
                      .filter((v) => v.type === "shorts")
                      .map((video) => (
                        <div key={video.id} className="flex items-center justify-between border border-black/5 rounded-2xl p-4 bg-white shadow-sm">
                          <div>
                            <p className="font-semibold text-sm">{video.title}</p>
                            <p className="text-xs text-[var(--muted)] mt-0.5">ID: {video.youtubeId}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    {portfolios.filter(v => v.type === "shorts").length === 0 && (
                      <p className="text-xs text-[var(--muted)] py-4 text-center">등록된 숏폼 영상이 없습니다.</p>
                    )}
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
                <div className="grid gap-4 md:grid-cols-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="flex flex-col justify-between border border-black/5 rounded-2xl p-5 bg-white shadow-sm">
                      <div>
                        <p className="text-xs text-[var(--muted)] mb-2 font-bold">{rev.author}</p>
                        <p className="text-xs leading-relaxed text-[var(--ink-soft)] whitespace-pre-wrap">{rev.content}</p>
                      </div>
                      <div className="mt-4 border-t border-black/5 pt-3 flex justify-end">
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="col-span-full text-xs text-[var(--muted)] py-8 text-center">등록된 후기가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
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
                          {res.contact}
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
                        <td colSpan={6} className="text-center py-12 text-[var(--muted)]">
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
