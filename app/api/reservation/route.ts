import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function POST(request: Request) {
  try {
    const {
      groom_name,
      bride_name,
      wedding_date,
      wedding_time,
      wedding_location,
      contact,
    } = await request.json();

    if (!wedding_date || !wedding_time || !wedding_location || !contact) {
      return NextResponse.json(
        { error: "필수 입력 항목(예식 날짜, 시간, 장소, 연락처)이 누락되었습니다." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        groomName: groom_name || null,
        brideName: bride_name || null,
        weddingDate: wedding_date,
        weddingTime: wedding_time,
        weddingLocation: wedding_location,
        contact,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, id: reservation.id });
  } catch (err) {
    console.error("Reservation API Error:", err);
    return NextResponse.json(
      { error: "예약 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
