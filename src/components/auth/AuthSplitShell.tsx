"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

const spring = {
  type: "spring" as const,
  stiffness: 58,
  damping: 17,
  mass: 1.1,
};

/** Wait until the red panel has mostly crossed before swapping forms */
const FORM_SWAP_DELAY_MS = 420;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function AuthSplitShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const isConfirm =
    pathname.startsWith("/registro/confirmar") ||
    pathname.startsWith("/registro/activar");
  const brandOnLeft = !pathname.startsWith("/registro");

  const pathRef = useRef(pathname);
  const childrenRef = useRef(children);
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [formVisible, setFormVisible] = useState(true);

  childrenRef.current = children;

  useEffect(() => {
    if (pathname === pathRef.current) {
      setDisplayedChildren(children);
      return;
    }

    // On mobile, swap immediately (no panel motion).
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      pathRef.current = pathname;
      setDisplayedChildren(children);
      setFormVisible(true);
      return;
    }

    setFormVisible(false);

    const timer = window.setTimeout(() => {
      pathRef.current = pathname;
      setDisplayedChildren(childrenRef.current);
      setFormVisible(true);
    }, FORM_SWAP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, children]);

  if (isConfirm) {
    return <>{children}</>;
  }

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[var(--color-bg)] lg:min-h-[100dvh]">
      {isDesktop ? (
        <motion.aside
          className="absolute inset-y-0 z-20 flex w-[56%] items-center justify-center bg-[var(--color-primary)]"
          initial={false}
          animate={{ left: brandOnLeft ? "0%" : "44%" }}
          transition={spring}
        >
          <BrandLogo layout="vertical" />
        </motion.aside>
      ) : null}

      <motion.section
        className="relative z-10 flex min-h-full w-full flex-1 flex-col bg-[var(--color-bg)] lg:absolute lg:inset-y-0 lg:w-[44%]"
        initial={false}
        animate={
          isDesktop
            ? { left: brandOnLeft ? "56%" : "0%" }
            : { left: "0%" }
        }
        transition={spring}
      >
        <motion.div
          className="flex min-h-full flex-1 flex-col"
          initial={false}
          animate={{ opacity: formVisible ? 1 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {displayedChildren}
        </motion.div>
      </motion.section>
    </main>
  );
}
