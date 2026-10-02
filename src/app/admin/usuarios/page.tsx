"use client";

import { Suspense } from "react";
import { AdminUsersScreen } from "@/components/admin/AdminUsersScreen";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<p className="text-[#666]">Cargando…</p>}>
      <AdminUsersScreen />
    </Suspense>
  );
}
