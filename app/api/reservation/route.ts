import { NextResponse, after } from "next/server";
import prisma from "@/utils/db";
import {
  RESERVATION_CUSTOM_KEY,
  formatReservationExtra,
  parseReservationExtra,
  validateReservationExtra,
} from "@/app/components/reservationFields";

// 예약 내용을 구글 스프레드시트로 전송 (docs/google-sheets-setup.md 참고).
// 부가 동작이므로 실패해도 예약 접수에는 영향을 주지 않는다.
async function sendToSheet(reservation: {
  groomName: string | null;
  brideName: string | null;
  weddingDate: string;
  weddingTime: string;
  weddingLocation: string;
  contact: string;
  email: string | null;
  extra: string | null;
  createdAt: Date;
}) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: process.env.SHEETS_WEBHOOK_TOKEN,
        groom_name: reservation.groomName,
        bride_name: reservation.brideName,
        wedding_date: reservation.weddingDate,
        wedding_time: reservation.weddingTime,
        wedding_location: reservation.weddingLocation,
        contact: reservation.contact,
        email: reservation.email,
        extra: formatReservationExtra(parseReservationExtra(reservation.extra)),
        created_at: reservation.createdAt.toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error("Sheets webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Sheets webhook error:", err);
  }
}

export async function POST(request: Request) {
  try {
    const {
      groom_name,
      bride_name,
      wedding_date,
      wedding_time,
      wedding_location,
      contact,
      email,
      extra,
    } = await request.json();

    if (!wedding_date || !wedding_time || !wedding_location || !contact) {
      return NextResponse.json(
        { error: "필수 입력 항목(예식 날짜, 시간, 장소, 연락처)이 누락되었습니다." },
        { status: 400 }
      );
    }

    // 관리자가 추가한 칸은 현재 정의 기준으로 검증한다 (정의에 없는 키는 버림)
    const customSetting = await prisma.siteContent.findUnique({ where: { key: RESERVATION_CUSTOM_KEY } });
    const extraResult = validateReservationExtra(
      { [RESERVATION_CUSTOM_KEY]: customSetting?.value },
      extra
    );
    if (!extraResult.ok) {
      return NextResponse.json({ error: extraResult.error }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        groomName: groom_name || null,
        brideName: bride_name || null,
        weddingDate: wedding_date,
        weddingTime: wedding_time,
        weddingLocation: wedding_location,
        contact,
        email: email || null,
        extra: extraResult.entries.length > 0 ? JSON.stringify(extraResult.entries) : null,
        status: "pending",
      },
    });

    // 응답을 보낸 뒤 백그라운드에서 시트로 전송
    after(() => sendToSheet(reservation));

    return NextResponse.json({ success: true, id: reservation.id });
  } catch (err) {
    console.error("Reservation API Error:", err);
    return NextResponse.json(
      { error: "예약 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
