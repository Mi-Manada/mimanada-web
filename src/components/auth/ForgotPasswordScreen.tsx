"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    // UI flow until email recovery is wired on the API
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setSent(true);
    setLoading(false);
  }

  return (
    <section className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-[17.5rem] flex-col">
        <div className="mb-8 self-center lg:hidden">
          <BrandLogo layout="horizontal" />
        </div>

        <h1 className="mb-2 text-center text-[clamp(1.125rem,2vw+0.5rem,1.35rem)] leading-tight text-[var(--color-text-heading)] [font-weight:600]">
          Recuperar contraseña
        </h1>
        <p className="mb-5 text-center text-[0.8125rem] leading-snug text-[var(--color-text-muted)]">
          {sent
            ? "Si el correo está registrado, te enviaremos instrucciones para restablecer tu contraseña."
            : "Ingresa tu correo y te enviaremos un enlace para restablecerla."}
        </p>

        {sent ? (
          <Link
            href="/login"
            className="mt-2 text-center text-[0.875rem] text-[var(--color-primary)] [font-weight:600]"
          >
            Volver a iniciar sesión
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <TextField
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-[0.9375rem]"
              required
            />

            <Button
              type="submit"
              className="mt-3 w-full text-[0.9375rem]"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        )}

        {!sent ? (
          <>
            <div className="mt-6 flex items-center gap-2.5" aria-hidden>
              <span className="h-px flex-1 bg-[var(--color-divider)]" />
              <span className="h-2 w-2 rounded-full border border-[var(--color-divider)]" />
              <span className="h-px flex-1 bg-[var(--color-divider)]" />
            </div>

            <p className="mt-5 text-center text-[0.8125rem] text-[var(--color-text-muted)]">
              ¿Ya la recordaste?
            </p>
            <Link
              href="/login"
              className="mt-1 text-center text-[0.875rem] text-[var(--color-primary)] [font-weight:600]"
            >
              Iniciar sesión
            </Link>
          </>
        ) : null}
      </div>
    </section>
  );
}
