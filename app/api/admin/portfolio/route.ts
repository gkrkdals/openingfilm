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
    const items = await prisma.portfolio.findMany({
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET portfolios error:", err);
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, youtube_id, type, order_index } = await request.json();

    if (!title || !youtube_id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.portfolio.create({
      data: {
        title,
        youtubeId: youtube_id,
        type,
        orderIndex: order_index || 0,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("POST portfolios error:", err);
    return NextResponse.json({ error: "Failed to create portfolio item" }, { status: 500 });
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

    await prisma.portfolio.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE portfolio error:", err);
    return NextResponse.json({ error: "Failed to delete portfolio item" }, { status: 500 });
  }
}
