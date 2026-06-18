"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "이메일 또는 비밀번호가 올바르지 않습니다.");
        setIsLoading(false);
        return;
      }

      // 로그인 성공 시 어드민 메인 대시보드로 이동
      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMsg("로그인 중 서버 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--paper)] px-4 py-12">
      {/* Decorative radial gradients for luxury background look */}
      <div className="pointer-events-none absolute left-0 top-0 h-[480px] w-[480px] -translate-x-1/4 -translate-y-1/4 rounded-full bg-[radial-gradient(circle_at_center,rgba(184,163,123,0.18),rgba(248,246,242,0))]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[480px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle_at_center,rgba(17,17,15,0.12),rgba(248,246,242,0))]" />

      <div className="fade-up z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-black/5 bg-white/60 p-8 shadow-[var(--shadow)] backdrop-blur-xl md:p-10">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="오프닝필름 로고"
            width={160}
            height={40}
            className="h-8 w-auto mb-4"
            priority
          />
          <h1 className="text-lg font-semibold tracking-[0.2em] text-[var(--ink)] uppercase">
            Admin Console
          </h1>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            관리자 계정으로 로그인해 주세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:bg-white focus:outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)] focus:bg-white focus:outline-none transition-all duration-200"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg py-2 px-3 text-center">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 rounded-full bg-[var(--ink)] hover:bg-[var(--accent)] text-white font-semibold text-sm py-3.5 transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                인증 중...
              </>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            ← 메인 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
