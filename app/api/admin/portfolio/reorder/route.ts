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

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items: { id: string; order_index: number }[] = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid reorder format" }, { status: 400 });
    }

    const isValid = items.every(
      (item) => typeof item?.id === "string" && Number.isInteger(item?.order_index)
    );
    if (!isValid) {
      return NextResponse.json({ error: "Invalid reorder format" }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.portfolio.update({
          where: { id: item.id },
          data: { orderIndex: item.order_index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST portfolio reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder portfolio items" }, { status: 500 });
  }
}
