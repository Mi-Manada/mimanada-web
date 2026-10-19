"use client";

import { Suspense } from "react";
import { AppealsScreen } from "@/components/profile/AppealsScreen";

export default function ApelacionesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-[#666]">Cargando…</p>}>
      <AppealsScreen />
    </Suspense>
  );
}
