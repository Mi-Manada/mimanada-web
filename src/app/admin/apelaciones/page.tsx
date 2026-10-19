"use client";

import { Suspense } from "react";
import { AdminAppealsScreen } from "@/components/admin/AdminAppealsScreen";

export default function AdminApelacionesPage() {
  return (
    <Suspense fallback={<p className="text-[#666]">Cargando…</p>}>
      <AdminAppealsScreen />
    </Suspense>
  );
}
