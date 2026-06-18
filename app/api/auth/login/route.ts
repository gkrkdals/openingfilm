import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import { verifyPassword, hashPassword } from "@/utils/password";
import { createToken } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    // 1. Check if there are any admin users in the database.
    const userCount = await prisma.adminUser.count();
    
    // Auto-seed the first admin if database is completely empty
    if (userCount === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || "admin@example.com";
      const defaultPassword = process.env.ADMIN_PASSWORD || "admin1234!";

      if (email === defaultEmail && password === defaultPassword) {
        // Create the admin user
        const hashedPassword = hashPassword(password);
        const newAdmin = await prisma.adminUser.create({
          data: {
            email: defaultEmail,
            password: hashedPassword,
          },
        });

        const token = await createToken({
          userId: newAdmin.id,
          email: newAdmin.email,
          exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        });

        const response = NextResponse.json({ success: true, message: "관리자 계정이 자동 생성되고 로그인되었습니다." });
        response.cookies.set("admin-session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }
    }

    // 2. Normal login flow
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await createToken({
      userId: admin.id,
      email: admin.email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
