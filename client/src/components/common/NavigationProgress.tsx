"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setState("loading");
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    let p = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 10 + 3;
      if (p > 90) {
        p = 90;
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setProgress(p);
    }, 250);
  }, []);

  const complete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setState("complete");
    setTimeout(() => {
      setState("idle");
      setProgress(0);
    }, 400);
  }, []);

  // Complete when route changes
  useEffect(() => {
    if (state === "loading") {
      complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Intercept link clicks to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:")
      )
        return;

      try {
        const url = new URL(href, window.location.origin);
        const current = window.location.pathname + window.location.search;
        const next = url.pathname + url.search;
        if (next !== current) {
          start();
        }
      } catch {
        // Invalid URL, ignore
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [start]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
      <div
        className={`h-full bg-primary shadow-[0_0_6px_rgba(244,67,54,0.5)] transition-all ${
          state === "complete" ? "duration-200" : "duration-300 ease-out"
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
