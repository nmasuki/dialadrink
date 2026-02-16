"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface BannerImage {
  secure_url?: string;
  width?: number;
  height?: number;
}

interface HeroBannerProps {
  desktopImages?: BannerImage[];
  mobileImages?: BannerImage[];
  alt: string;
  interval?: number;
}

const MOBILE_BREAKPOINT = 768;

export default function HeroBanner({
  desktopImages = [],
  mobileImages = [],
  alt,
  interval = 5000,
}: HeroBannerProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const validDesktop = desktopImages.filter((img) => img.secure_url);
  const validMobile = mobileImages.filter((img) => img.secure_url);

  const images = isMobile === null ? [] : isMobile
        ? (validMobile.length > 0 ? validMobile : validDesktop)
        : (validDesktop.length > 0 ? validDesktop : validMobile);

  const count = images.length;

  const goTo = useCallback((idx: number) => { setCurrent(idx); }, []);

  // Auto-advance
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % count), interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, interval]);

  // Reset index when image set changes
  useEffect(() => {
    setCurrent(0);
  }, [count]);

  return (
    <div className="relative w-full min-h-[50vh] md:min-h-[60vh] overflow-hidden">
      {images.map((img, idx) => (
        <div
          key={img.secure_url!}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={img.secure_url!}
            alt={`${alt} ${count > 1 ? idx + 1 : ""}`}
            fill
            priority={idx === 0}
            className="object-cover object-top"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === current
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
