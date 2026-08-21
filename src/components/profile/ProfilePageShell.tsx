"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppChrome } from "@/components/app/AppChrome";

export function ProfilePageShell({
  title,
  backHref = "/perfil",
  action,
  children,
}: {
  title: string;
  backHref?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-5 pb-6 pt-5 text-[var(--color-text-on-primary)] sm:px-8 lg:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage: "url(/brand/paw-texture.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "420px auto",
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex w-full max-w-[40rem] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href={backHref}
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
              <h1 className="text-[1.05rem] [font-weight:700]">{title}</h1>
            </div>
            {action ?? null}
          </div>
        </header>
        <section className="mx-auto w-full max-w-[40rem] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </section>
      </main>
    </AppChrome>
  );
}

export function ProfileMenuIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
      {children}
    </span>
  );
}

export function ProfileEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[16px] border border-dashed border-[#e4e4e4] bg-[#fafafa] px-5 py-10 text-center">
      <p className="text-[1rem] text-[#555] [font-weight:700]">{title}</p>
      <p className="mt-2 max-w-[22rem] text-[0.85rem] leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-5 text-[0.875rem] text-[var(--color-primary)] [font-weight:600]"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
