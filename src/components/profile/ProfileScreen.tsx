"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import { PROFILE_MENU_SECTIONS } from "@/components/profile/profile-menu";
import { Button } from "@/components/ui/Button";
import { clearSession, getMe, mediaUrl, peekMe, type AuthUser } from "@/lib/api";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function userTypeLabel(type: AuthUser["userType"] | undefined) {
  switch (type) {
    case "fundacion":
      return "Fundación / refugio";
    case "proveedor":
      return "Comercio / marca";
    case "persona":
    default:
      return "Persona natural";
  }
}

export function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => peekMe());

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

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  const displayName = user?.fullName?.trim() || "Usuario";

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-5 pb-8 pt-5 text-[var(--color-text-on-primary)] sm:px-8 lg:px-10 lg:pb-10 lg:pt-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage: "url(/brand/paw-texture.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "420px auto",
            }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto w-full max-w-[80rem]">
            <div className="mb-6 flex items-center gap-2 lg:mb-8">
              <Link
                href="/home"
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
              <h1 className="text-[1.05rem] [font-weight:700]">Mi Perfil</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-white/20 text-[1.15rem] [font-weight:700] sm:h-[4.75rem] sm:w-[4.75rem]">
                {mediaUrl(user?.profilePhotoUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(user?.profilePhotoUrl) ?? undefined}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initialsFromName(displayName)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[clamp(1.35rem,2.5vw,1.75rem)] leading-tight [font-weight:700]">
                  {displayName}
                </p>
                <p className="mt-1 text-[0.8rem] text-white/85">
                  {userTypeLabel(user?.userType)}
                </p>
                {user ? (
                  <p
                    className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[0.7rem] [font-weight:600] ${
                      user.profileActivated
                        ? "bg-white/20 text-white"
                        : "bg-[var(--color-accent-yellow)] text-[var(--color-primary)]"
                    }`}
                  >
                    {user.profileActivated
                      ? "Perfil activo"
                      : "Perfil pendiente de activar"}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="relative z-10 mx-auto w-full max-w-[80rem] flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pt-7">
          <div className="mb-5">
            <ProfileActivationBanner />
          </div>
          <div className="flex flex-col gap-6">
            {PROFILE_MENU_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="mb-2.5 px-1 text-[0.75rem] tracking-[0.08em] text-[var(--color-text-muted)] uppercase [font-weight:700]">
                  {section.title}
                </h2>
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 rounded-[14px] border border-[#ececec] bg-white px-3.5 py-3.5 transition hover:border-[#e0e0e0] hover:bg-[#fafafa]"
                      >
                        {item.icon}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.95rem] text-[#555] [font-weight:700]">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-[0.78rem] leading-snug text-[var(--color-text-muted)]">
                            {item.description}
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
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-7 flex justify-center lg:mt-9">
            <Button
              type="button"
              onClick={handleLogout}
              className="min-w-[12.5rem] px-8"
            >
              Cerrar Sesión
            </Button>
          </div>
        </section>
      </main>
    </AppChrome>
  );
}
