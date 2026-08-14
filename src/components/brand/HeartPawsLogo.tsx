"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import paths from "@/lib/heart-paws-paths.json";

type HeartPawsLogoProps = {
  className?: string;
  onAnimationComplete?: () => void;
};

type HeartPhase = "forming" | "grown";

/** Approximate vertical center of a path from its coordinate pairs. */
function getPathCenterY(d: string): number {
  const nums = [...d.matchAll(/-?\d*\.?\d+/g)].map(Number);
  let sum = 0;
  let count = 0;
  for (let i = 1; i < nums.length; i += 2) {
    sum += nums[i];
    count += 1;
  }
  return count ? sum / count : 0;
}

export function HeartPawsLogo({
  className,
  onAnimationComplete,
}: HeartPawsLogoProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<HeartPhase>("forming");
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onAnimationComplete);
  onCompleteRef.current = onAnimationComplete;

  const notifyComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  };

  useEffect(() => {
    if (reduceMotion) {
      setPhase("grown");
      notifyComplete();
    }
  }, [reduceMotion]);

  const { items, lastIndex } = useMemo(() => {
    const withY = paths.map((d, index) => ({
      d,
      index,
      y: getPathCenterY(d),
    }));

    const minY = Math.min(...withY.map((p) => p.y));
    const maxY = Math.max(...withY.map((p) => p.y));
    const range = maxY - minY || 1;

    const items = withY.map((p) => ({
      ...p,
      delay: ((maxY - p.y) / range) * 0.42,
    }));

    const lastIndex = items.reduce(
      (best, p) => (p.delay > items[best].delay ? p.index : best),
      0,
    );

    return { items, lastIndex };
  }, []);

  return (
    <svg
      viewBox="0 0 451 383"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      overflow="visible"
    >
      <motion.g
        style={{ transformOrigin: "225.5px 191.5px" }}
        initial={{ scale: 1 }}
        animate={{ scale: phase === "grown" ? 1.08 : 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        onAnimationComplete={() => {
          if (phase === "grown") {
            notifyComplete();
          }
        }}
      >
        {items.map(({ d, index, delay }) => (
          <motion.path
            key={index}
            d={d}
            fill="#A7A7A3"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={
              reduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0 }
            }
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 0.28,
                    delay,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
            onAnimationComplete={
              index === lastIndex && phase === "forming" && !reduceMotion
                ? () => setPhase("grown")
                : undefined
            }
          />
        ))}
      </motion.g>
    </svg>
  );
}
