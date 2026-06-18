"use client";

import { useState } from "react";

export default function ReservationForm() {
  const [formStatus, setFormStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [formMessage, setFormMessage] = useState("");

  const handleFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (formStatus === "sending") return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setFormStatus("sending");
    setFormMessage("");

    const groom_name = formData.get("신랑 성함") as string;
    const bride_name = formData.get("신부 성함") as string;
    const wedding_date = formData.get("예식 날짜") as string;
    const wedding_time = formData.get("예식 시간") as string;
    const wedding_location = formData.get("예식 장소") as string;
    const contact = formData.get("연락처") as string;

    // Validation
    if (!wedding_date || !wedding_time || !wedding_location || !contact) {
      setFormStatus("error");
      setFormMessage("필수 입력 항목(예식 날짜, 시간, 장소, 연락처)을 모두 입력해 주세요.");
      return;
    }

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groom_name,
          bride_name,
          wedding_date,
          wedding_time,
          wedding_location,
          contact,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setFormStatus("success");
      setFormMessage("예약 신청이 정상적으로 접수되었습니다.");
      form.reset();
    } catch (err) {
      console.error("Reservation submit error:", err);
      setFormStatus("error");
      setFormMessage("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleFormSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="신랑 성함"
          className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="신랑 성함"
        />
        <input
          name="신부 성함"
          className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="신부 성함"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="예식 날짜"
          required
          className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="예식 날짜 (필수)"
        />
        <input
          name="예식 시간"
          required
          className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="예식 시간 (필수)"
        />
      </div>
      <input
        name="예식 장소"
        required
        className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        placeholder="예식 장소 (필수)"
      />
      <input
        name="연락처"
        required
        className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        placeholder="연락처 (필수)"
      />
      <button
        type="submit"
        disabled={formStatus === "sending"}
        className="mt-2 rounded-full border border-black/30 px-6 py-3 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {formStatus === "sending" ? "전송 중..." : "예약 신청하기"}
      </button>
      {formMessage ? (
        <p
          className={`text-sm ${
            formStatus === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
          aria-live="polite"
        >
          {formMessage}
        </p>
      ) : null}
    </form>
  );
}
