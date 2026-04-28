"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type BoardFrameProps = {
  children: ReactNode;
};

/**
 * Fixed-pixel square wrapper around the chessboard. The actual size is
 * computed from the parent's bounding rect and snapped down to a multiple of
 * 8 — react-chessboard splits the board into 8 flex children per row, so any
 * fractional pixel size leaks as visible 1px gaps between rows or files.
 *
 * Re-runs on parent resize via ResizeObserver, and on viewport resize as a
 * fallback for browsers that don't fire RO when the parent's size changes
 * because of margin/padding adjustments only.
 */
export function BoardFrame({ children }: BoardFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const measure = () => {
      const rect = parent.getBoundingClientRect();
      const fit = Math.min(rect.width, rect.height);
      // Snap down to a multiple of 8 so each square is an integer pixel size.
      const snapped = Math.max(0, Math.floor(fit / 8) * 8);
      setSize(snapped);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ width: size || undefined, height: size || undefined }}
      className="relative overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
    >
      {size > 0 ? children : null}
    </div>
  );
}
