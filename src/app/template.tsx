import type { ReactNode } from "react";

/** Layout wrapper without fade — navigation should feel instant. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
