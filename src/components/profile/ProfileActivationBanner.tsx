"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMe, type AuthUser } from "@/lib/api";

export function ProfileActivationBanner() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || user.profileActivated) return null;

  const missing: string[] = [];
  if (!user.profilePhotoUrl) missing.push("foto de perfil");
  if (!user.idCardPhotoUrl) missing.push("cédula");
  if (!user.selfiePhotoUrl) missing.push("selfie");

  return (
    <div className="w-full rounded-[14px] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 px-4 py-3.5">
      <p className="text-[0.9rem] text-[var(--color-primary)] [font-weight:700]">
        Activa tu perfil para usar adopciones
      </p>
      <p className="mt-1 text-[0.8rem] leading-snug text-[var(--color-text-muted)]">
        Te falta: {missing.join(", ")}. Sin esto tu cuenta queda limitada.
      </p>
      <Link
        href="/perfil/verificacion"
        className="mt-2 inline-flex text-[0.8125rem] text-[var(--color-primary)] underline underline-offset-[3px] [font-weight:600]"
      >
        Completar verificación
      </Link>
    </div>
  );
}
