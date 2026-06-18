"use client";

import { useEffect, useRef, useState } from "react";

type RevealOnScrollProps = {
  className?: string;
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
};

export default function RevealOnScroll({
  className = "",
  children,
  threshold = 0.2,
  rootMargin = "0px",
}: RevealOnScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const combinedClassName = [className, isVisible ? "is-visible" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={containerRef} className={combinedClassName}>
      {children}
    </div>
  );
}
