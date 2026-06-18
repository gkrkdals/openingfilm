import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

async function isAuthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value;
  if (!token) return false;
  const decoded = await verifyToken(token);
  return !!decoded;
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET reservations error:", err);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("POST reservation status error:", err);
    return NextResponse.json({ error: "Failed to update reservation status" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE reservation error:", err);
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
  }
}
