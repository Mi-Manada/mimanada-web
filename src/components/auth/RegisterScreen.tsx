"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { RegisterSuccessModal } from "@/components/auth/RegisterSuccessModal";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { ApiError, registerRequest, setSession } from "@/lib/api";

function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.5-3.2 4-5 7-5s5.5 1.8 7 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProvider() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19c1.2-2.8 3.4-4.2 6.5-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15 14.5h5.5v3.2a1.3 1.3 0 0 1-1.3 1.3H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16.8" cy="12.2" r="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const userTypeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "persona", label: "Persona normal", icon: <IconPerson /> },
      { value: "fundacion", label: "Fundación", icon: <IconHome /> },
      { value: "proveedor", label: "Proveedor", icon: <IconProvider /> },
    ],
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!userType) {
      setError("Selecciona un tipo de usuario.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerRequest({
        email,
        password,
        fullName,
        phone: phone || undefined,
        userType: userType as "persona" | "fundacion" | "proveedor",
      });

      setSession(result.accessToken);

      const firstName = fullName.trim().split(/\s+/)[0] || "amigo";
      sessionStorage.setItem("mimanada.registerName", firstName);
      setSuccessOpen(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo completar el registro.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleCloseSuccess() {
    setSuccessOpen(false);
    router.push("/registro/confirmar");
  }

  return (
    <>
      <section className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-10 sm:px-6">
        <div className="mb-8 self-center lg:hidden">
          <BrandLogo layout="horizontal" />
        </div>

        <h1 className="mb-5 text-center text-[clamp(1.125rem,2vw+0.5rem,1.35rem)] leading-tight text-[var(--color-text-heading)] [font-weight:600]">
          Registro
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid w-full max-w-[19rem] grid-cols-1 gap-2.5 lg:max-w-[34rem] lg:grid-cols-2 lg:gap-x-3 lg:gap-y-2.5"
        >
          <SelectField
            name="userType"
            placeholder="Tipo de usuario"
            value={userType}
            options={userTypeOptions}
            onChange={setUserType}
            required
          />

          <TextField
            name="fullName"
            autoComplete="name"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            variant="outlined"
            required
          />

          <TextField
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Teléfono celular"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            variant="outlined"
            required
          />

          <TextField
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            required
          />

          <PasswordField
            name="password"
            autoComplete="new-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            required
          />

          <PasswordField
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            variant="outlined"
            required
          />

          <label className="mt-1 flex cursor-pointer items-start justify-center gap-2.5 lg:col-span-2">
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
            />
            <span className="text-[0.8125rem] leading-snug text-[var(--color-text-muted)]">
              Acepto los{" "}
              <span className="text-[var(--color-primary)] [font-weight:600]">
                términos y condiciones
              </span>
            </span>
          </label>

          {error ? (
            <p className="text-[0.8125rem] text-[var(--color-primary)] lg:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex justify-center lg:col-span-2">
            <Button type="submit" className="min-w-[9.5rem]" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-[0.8125rem] text-[var(--color-text-muted)]">
          ¿Ya te registraste?{" "}
          <Link
            href="/login"
            className="text-[var(--color-primary)] [font-weight:600]"
          >
            Inicia sesión
          </Link>
        </p>
      </section>

      <RegisterSuccessModal open={successOpen} onClose={handleCloseSuccess} />
    </>
  );
}
