import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/utils/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("admin-session")?.value;

  // 토큰 검증
  const user = token ? await verifyToken(token) : null;

  // 관리자 대시보드 접근 제어 (로그인 페이지 제외)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // 로그인 상태에서 로그인 페이지 접근 시 대시보드로 이동
  if (pathname.startsWith("/admin/login")) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 이미지 파일 확장자들
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
