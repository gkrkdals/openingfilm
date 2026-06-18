import { Metadata } from "next";

export const metadata: Metadata = {
  title: "오프닝필름 | 관리자 콘솔",
  description: "오프닝필름 플랫폼 관리자 페이지",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased font-sans">
      {children}
    </div>
  );
}
