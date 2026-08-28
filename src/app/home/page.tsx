"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppChrome } from "@/components/app/AppChrome";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import { clearSession } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col items-center gap-5 bg-[var(--color-bg)] px-6 py-10">
        <div className="w-full max-w-[80rem]">
          <ProfileActivationBanner />
        </div>
        <h1 className="text-[clamp(2.5rem,9vw,5rem)] leading-none tracking-tight text-[var(--color-text)] [font-weight:800]">
          HOME
        </h1>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/adopta"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-[0.875rem] text-white [font-weight:700]"
          >
            Ver adopciones
          </Link>
          <Link
            href="/adopta/nueva"
            className="text-[0.9rem] text-[var(--color-primary)] underline underline-offset-[3px] [font-weight:600]"
          >
            Poner en adopción
          </Link>
          <Link
            href="/perfil"
            className="text-[0.875rem] text-[var(--color-text-muted)] underline underline-offset-[3px]"
          >
            Ir al perfil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[0.875rem] text-[var(--color-text-muted)] underline underline-offset-[3px]"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    </AppChrome>
  );
}
