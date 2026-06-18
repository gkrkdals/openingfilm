"use client";

import { useState } from "react";

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Price", href: "#price" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Review", href: "#review" },
  { label: "Reservation", href: "#reservation" },
];

export default function FloatingNav() {
  const [activeSection, setActiveSection] = useState("top");

  return (
    <div className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
      <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--mist)] text-[var(--ink)] shadow-lg md:rounded-2xl">
        <a
          className={`border-b border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition md:px-4 md:py-3 md:text-xs ${
            activeSection === "top"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--ink)] hover:bg-black/5"
          }`}
          href="#top"
          onClick={() => setActiveSection("top")}
        >
          ▲ Top
        </a>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            className={`border-b border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition md:px-4 md:py-3 md:text-xs ${
              activeSection === item.href.slice(1)
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--ink)] hover:bg-black/5"
            }`}
            href={item.href}
            onClick={() => setActiveSection(item.href.slice(1))}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
