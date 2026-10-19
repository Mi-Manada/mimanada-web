"use client";

import { Suspense } from "react";
import { AdminSolicitudesScreen } from "@/components/admin/AdminSolicitudesScreen";

export default function AdminSolicitudesPage() {
  return (
    <Suspense fallback={<p className="text-[#666]">Cargando…</p>}>
      <AdminSolicitudesScreen />
    </Suspense>
  );
}
