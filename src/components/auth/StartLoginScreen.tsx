"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HeartPawsLogo } from "@/components/brand/HeartPawsLogo";

const LOAD_MS = 1600;
const EXIT_MS = 450;

export function StartLoginScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [showCopy, setShowCopy] = useState(false);
  const [progress, setProgress] = useState(reduceMotion ? 1 : 0.15);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setShowCopy(true);
      setProgress(1);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / LOAD_MS);
      const eased = 1 - (1 - t) ** 2;
      setProgress(0.2 + eased * 0.8);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  function goToLogin() {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      router.push("/login");
    }, EXIT_MS);
  }

  const heartOpacity = reduceMotion ? 1 : progress;
  const showArrow = showCopy && (reduceMotion || progress >= 0.95);

  return (
    <section className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--brand-bg)] px-8 py-16">
      <motion.div
        className="flex w-full max-w-[22rem] scale-[0.92] flex-col items-center gap-8 sm:max-w-[24rem]"
        animate={{ opacity: exiting ? 0 : 1, y: exiting ? -8 : 0 }}
        transition={{ duration: EXIT_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ opacity: heartOpacity }} className="w-full">
          <HeartPawsLogo
            className="mx-auto h-auto w-full max-w-[18.5rem] sm:max-w-[20rem]"
            onAnimationComplete={() => {
              setShowCopy(true);
            }}
          />
        </div>

        <motion.div
          className="text-center subpixel-antialiased"
          initial={false}
          animate={
            showCopy
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: reduceMotion ? 0 : 14 }
          }
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-h2 leading-[1.05] tracking-[0.02em] text-[var(--brand-coral)] uppercase [font-weight:700]">
            Adopta, cuida
            <br />
            y consiente
          </h1>
          <p className="text-body-lg mt-2 leading-tight tracking-[0.08em] text-[var(--brand-muted)] uppercase [font-weight:700]">
            Únete a la manada
          </p>
        </motion.div>

        <motion.div
          className="mt-2"
          initial={false}
          animate={
            showArrow
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: reduceMotion ? 0 : 10 }
          }
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <button
            type="button"
            onClick={goToLogin}
            aria-label="Continuar a iniciar sesión"
            disabled={!showArrow}
            className="flex h-12 w-14 cursor-pointer items-center justify-center text-[var(--brand-coral)] opacity-100 transition-opacity duration-200 hover:opacity-55 disabled:pointer-events-none"
          >
            <motion.span
              className="inline-flex"
              animate={
                reduceMotion || !showArrow || exiting
                  ? { x: 0 }
                  : { x: [0, 10, 0] }
              }
              transition={
                reduceMotion || !showArrow || exiting
                  ? { duration: 0 }
                  : {
                      duration: 1.15,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "loop",
                    }
              }
            >
              <svg
                width="36"
                height="24"
                viewBox="0 0 36 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 12h28M22 5l9 7-9 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
