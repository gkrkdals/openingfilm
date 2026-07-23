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
    const items = await prisma.promiseCard.findMany({
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("GET promise cards error:", err);
    return NextResponse.json({ error: "Failed to fetch promise cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, order_index } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.promiseCard.create({
      data: {
        title,
        content,
        orderIndex: order_index || 0,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("POST promise card error:", err);
    return NextResponse.json({ error: "Failed to create promise card" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, title, content } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.promiseCard.update({
      where: { id },
      data: { title, content },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("PUT promise card error:", err);
    return NextResponse.json({ error: "Failed to update promise card" }, { status: 500 });
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

    await prisma.promiseCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE promise card error:", err);
    return NextResponse.json({ error: "Failed to delete promise card" }, { status: 500 });
  }
}
