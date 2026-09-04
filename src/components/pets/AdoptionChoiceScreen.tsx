"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { CamadaIcon, MascotaIcon } from "@/components/pets/PetIcons";

function ChoiceCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-[16px] border border-[#ececec] bg-white p-4 transition hover:border-[var(--color-primary)]/40 hover:shadow-[0_8px_24px_rgba(230,68,97,0.08)]"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition group-hover:bg-[var(--color-primary)] group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.05rem] text-[#555] [font-weight:700]">
          {title}
        </span>
        <span className="mt-1 block text-[0.85rem] leading-snug text-[var(--color-text-muted)]">
          {description}
        </span>
      </span>
      <span className="mt-1 text-[var(--color-primary)]" aria-hidden>
        →
      </span>
    </Link>
  );
}

export function AdoptionChoiceScreen() {
  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-5 pb-5 pt-5 text-[var(--color-text-on-primary)] sm:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage: "url(/brand/paw-texture.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "420px auto",
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex w-full max-w-[80rem] items-center gap-2">
            <Link
              href="/adopta"
              aria-label="Volver"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 5 8 12l7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-[1.05rem] [font-weight:700]">Poner en adopción</h1>
              <p className="text-[0.75rem] text-white/85">
                Elige el tipo de publicación
              </p>
            </div>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-[80rem] grid-cols-1 gap-3 px-4 py-6 sm:px-6 md:grid-cols-2 lg:gap-4 lg:px-8">
          <ChoiceCard
            href="/adopta/nueva/camada"
            title="Camada"
            description="Varias camadas. Puedes agregar mascotas nuevas o ya publicadas antes de postear."
            icon={<CamadaIcon size={32} />}
          />
          <ChoiceCard
            href="/adopta/nueva/mascota"
            title="Mascota"
            description="Una sola mascota. Completas su ficha y la publicas de inmediato."
            icon={<MascotaIcon size={32} />}
          />
        </section>
      </main>
    </AppChrome>
  );
}
