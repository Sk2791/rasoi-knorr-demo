import React, { useEffect, useRef, useState } from "react";

interface TickingStatProps {
  value: number;
  formatter?: (n: number) => string;
}

// Purely cosmetic "live" counter: animates up to `value` on mount/update, then
// nudges upward by a small pseudo-random amount every few seconds so the
// dashboard feels alive. Not backed by any real polling data source.
//
// Uses setInterval (not requestAnimationFrame) for the step timer — rAF is
// paused by the browser whenever the tab/pane isn't actively compositing,
// which would silently freeze this animation; a plain interval keeps ticking.
export const TickingStat: React.FC<TickingStatProps> = ({ value, formatter }) => {
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);
  const hasMountedRef = useRef(false);

  const animateTo = (target: number, durationMs: number) => {
    const start = displayedRef.current;
    const startTime = Date.now();
    const stepMs = 40;
    const intervalId = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (target - start) * eased;
      displayedRef.current = next;
      setDisplayed(next);
      if (t >= 1) window.clearInterval(intervalId);
    }, stepMs);
    return intervalId;
  };

  useEffect(() => {
    const id = animateTo(value, hasMountedRef.current ? 700 : 1200);
    hasMountedRef.current = true;
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number;
    let animId: number;
    const tick = () => {
      const delay = 4000 + Math.random() * 4000;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const bump = Math.max(1, Math.round(displayedRef.current * (0.002 + Math.random() * 0.01)));
        animId = animateTo(displayedRef.current + bump, 900);
        tick();
      }, delay);
    };
    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(animId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = Math.round(displayed);
  return <>{formatter ? formatter(shown) : shown.toLocaleString("en-IN")}</>;
};
