"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthSplit =
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname.startsWith("/registro/");

  // Auth split pages handle their own organic panel transition.
  if (pathname === "/login" || pathname === "/registro") {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      className="flex min-h-full flex-1 flex-col"
      initial={{ opacity: 0, y: isAuthSplit ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
