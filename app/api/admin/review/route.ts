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
    const items = await prisma.review.findMany({
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET reviews error:", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { author, content, order_index } = await request.json();

    if (!author || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.review.create({
      data: {
        author,
        content,
        orderIndex: order_index || 0,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("POST review error:", err);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
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

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE review error:", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
