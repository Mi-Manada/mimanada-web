"use client";

import Link from "next/link";
import { ActivationOnboardingScreen } from "@/components/auth/ActivationOnboardingScreen";
import { AppChrome } from "@/components/app/AppChrome";

export default function VerificacionPage() {
  return (
    <AppChrome>
      <div className="border-b border-[#eee] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-[26rem] items-center gap-2">
          <Link
            href="/perfil"
            className="text-[0.85rem] text-[var(--color-primary)] [font-weight:600]"
          >
            ← Volver al perfil
          </Link>
        </div>
      </div>
      <ActivationOnboardingScreen mode="manage" />
    </AppChrome>
  );
}
