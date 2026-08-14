"use client";

import type { ReactNode } from "react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthSplitShell>{children}</AuthSplitShell>;
}
