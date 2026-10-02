"use client";

import { Suspense } from "react";
import { AdminModerationScreen } from "@/components/admin/AdminModerationScreen";

export default function AdminModerationPage() {
  return (
    <Suspense fallback={<p className="text-[#666]">Cargando…</p>}>
      <AdminModerationScreen />
    </Suspense>
  );
}
