"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import {
  ApiError,
  changePasswordRequest,
  getMe,
  type AuthUser,
} from "@/lib/api";

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
      {children}
    </span>
  );
}

export function SecurityScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la información de seguridad.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openPasswordForm() {
    setChangingPassword(true);
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function cancelPasswordForm() {
    setChangingPassword(false);
    setError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      await changePasswordRequest({
        currentPassword,
        newPassword,
      });
      setSuccess("Contraseña actualizada.");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setSaving(false);
    }
  }

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
          <div className="relative z-10 mx-auto flex w-full max-w-[40rem] items-center gap-2">
            <Link
              href="/perfil"
              aria-label="Volver al perfil"
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
            <h1 className="text-[1.05rem] [font-weight:700]">Seguridad</h1>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[40rem] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
          ) : null}

          {!loading && user && !changingPassword ? (
            <ul className="flex flex-col gap-2.5">
              <li>
                <div className="flex items-center gap-3 rounded-[14px] border border-[#ececec] bg-white px-3.5 py-3.5">
                  <MenuIcon>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect
                        x="3.5"
                        y="6"
                        width="17"
                        height="12"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="m4.5 7.5 7.5 5.5 7.5-5.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </MenuIcon>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] text-[#555] [font-weight:700]">
                      E-mail
                    </span>
                    <span className="mt-0.5 block truncate text-[0.78rem] text-[var(--color-text-muted)]">
                      {user.email}
                    </span>
                  </span>
                </div>
              </li>

              <li>
                <button
                  type="button"
                  onClick={openPasswordForm}
                  className="flex w-full items-center gap-3 rounded-[14px] border border-[#ececec] bg-white px-3.5 py-3.5 text-left transition hover:border-[#e0e0e0] hover:bg-[#fafafa]"
                >
                  <MenuIcon>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect
                        x="6"
                        y="10.5"
                        width="12"
                        height="9"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8.5 10.5V8.2a3.5 3.5 0 0 1 7 0v2.3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </MenuIcon>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] text-[#555] [font-weight:700]">
                      Contraseña
                    </span>
                    <span className="mt-0.5 block text-[0.78rem] text-[var(--color-text-muted)]">
                      ••••••••
                    </span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 text-[#c4c4c4]"
                    aria-hidden
                  >
                    <path
                      d="m9 5 7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            </ul>
          ) : null}

          {!loading && changingPassword ? (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5">
              <h2 className="text-[0.95rem] text-[#555] [font-weight:700]">
                Cambiar contraseña
              </h2>

              <PasswordField
                name="currentPassword"
                autoComplete="current-password"
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="outlined"
                required
              />
              <PasswordField
                name="newPassword"
                autoComplete="new-password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                required
              />
              <PasswordField
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                required
              />

              {error ? (
                <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
              ) : null}

              <div className="mt-1 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelPasswordForm}
                  disabled={saving}
                  className="h-9 min-w-[6.25rem] border border-[var(--color-primary)] px-4 text-[0.8125rem]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 min-w-[8rem] px-4 text-[0.8125rem]"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          ) : null}

          {success && !changingPassword ? (
            <p className="mt-4 text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
              {success}
            </p>
          ) : null}

          {!loading && error && !changingPassword ? (
            <p className="mt-4 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}
        </section>
      </main>
    </AppChrome>
  );
}
