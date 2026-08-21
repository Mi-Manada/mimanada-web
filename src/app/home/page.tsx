"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppChrome } from "@/components/app/AppChrome";
import { clearSession } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-6">
        <h1 className="text-[clamp(3rem,10vw,6rem)] leading-none tracking-tight text-[var(--color-text)] [font-weight:800]">
          HOME
        </h1>
        <Link
          href="/perfil"
          className="text-[0.9375rem] text-[var(--color-primary)] underline underline-offset-[3px] [font-weight:600]"
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
      </main>
    </AppChrome>
  );
}
