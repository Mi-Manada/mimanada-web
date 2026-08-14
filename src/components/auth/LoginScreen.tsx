"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { ApiError, loginRequest, setSession } from "@/lib/api";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginRequest(email, password);
      setSession(result.accessToken);
      const next = searchParams.get("next") || "/home";
      router.replace(next);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar sesión. Intenta de nuevo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-[17.5rem] flex-col">
        <div className="mb-8 self-center lg:hidden">
          <BrandLogo layout="horizontal" />
        </div>

        <h1 className="mb-5 text-center text-[clamp(1.125rem,2vw+0.5rem,1.35rem)] leading-tight text-[var(--color-text-heading)] [font-weight:600]">
          Iniciar sesión
        </h1>

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

          <PasswordField
            name="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-[0.9375rem]"
            required
          />

          {error ? (
            <p className="text-[0.8125rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          <Link
            href="/recuperar-contrasena"
            className="mt-1.5 self-center text-[0.8125rem] text-[var(--color-text-muted)] underline underline-offset-[3px]"
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <Button
            type="submit"
            className="mt-3 w-full text-[0.9375rem]"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresa"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-2.5" aria-hidden>
          <span className="h-px flex-1 bg-[var(--color-divider)]" />
          <span className="h-2 w-2 rounded-full border border-[var(--color-divider)]" />
          <span className="h-px flex-1 bg-[var(--color-divider)]" />
        </div>

        <p className="mt-5 text-center text-[0.8125rem] text-[var(--color-text-muted)]">
          ¿Aún no eres parte de la manada?
        </p>
        <Link
          href="/registro"
          className="mt-1 text-center text-[0.875rem] text-[var(--color-primary)] [font-weight:600]"
        >
          Regístrate
        </Link>
      </div>
    </section>
  );
}
