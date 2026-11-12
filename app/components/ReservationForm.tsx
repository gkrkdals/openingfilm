"use client";

import { useState } from "react";
import { CUSTOM_VALUE_MAX, type ReservationFormField } from "./reservationFields";

export default function ReservationForm({
  fields,
  submitLabel,
}: {
  fields: ReservationFormField[];
  submitLabel: string;
}) {
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
    const email = formData.get("메일 주소") as string;
    const extra = Object.fromEntries(
      fields.filter((f) => f.custom).map((f) => [f.id, (formData.get(f.name) as string | null) ?? ""])
    );

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
          email,
          extra,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 입력 문제(400)는 서버 메시지를 그대로 보여준다 (예: 관리자가 추가한 필수 칸 누락)
        if (res.status === 400 && data.error) {
          setFormStatus("error");
          setFormMessage(data.error);
          return;
        }
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
        {fields.map((field) => (
          <input
            key={field.id}
            name={field.name}
            type={field.type}
            required={field.required}
            maxLength={field.custom ? CUSTOM_VALUE_MAX : undefined}
            aria-label={field.custom ? field.placeholder : field.name}
            className={`rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none ${
              field.full ? "md:col-span-2" : ""
            }`}
            placeholder={field.placeholder}
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={formStatus === "sending"}
        className="mt-2 rounded-full border border-black/30 px-6 py-3 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {formStatus === "sending" ? "전송 중..." : submitLabel}
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
