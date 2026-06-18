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
    const contents = await prisma.siteContent.findMany();
    return NextResponse.json(contents);
  } catch (err) {
    console.error("GET site_content error:", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates: { key: string; value: string }[] = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates format" }, { status: 400 });
    }

    // Run upsert inside a transaction or sequential updates
    await prisma.$transaction(
      updates.map((item) =>
        prisma.siteContent.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST site_content error:", err);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}
