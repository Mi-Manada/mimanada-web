"use client";

import { Suspense } from "react";
import { AdminReportsScreen } from "@/components/admin/AdminReportsScreen";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<p className="text-[#666]">Cargando…</p>}>
      <AdminReportsScreen />
    </Suspense>
  );
}
