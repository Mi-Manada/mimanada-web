"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import { ProfileMenuIcon } from "@/components/profile/ProfilePageShell";
import { Button } from "@/components/ui/Button";
import { clearSession, getMe, mediaUrl, type AuthUser } from "@/lib/api";

type MenuItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    title: "Cuenta",
    items: [
      {
        title: "Mis datos",
        description: "Perfil, contacto y domicilio",
        href: "/perfil/datos",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M5.2 19c1.5-3 4-4.7 6.8-4.7S17.3 16 18.8 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Verificación",
        description: "Primero la cédula; luego foto y selfie",
        href: "/perfil/verificacion",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="4"
                y="5"
                width="16"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="11" r="2.6" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M7.5 16.5c1-1.6 2.5-2.4 4.5-2.4s3.5.8 4.5 2.4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Seguridad",
        description: "Contraseña y correo de acceso",
        href: "/perfil/seguridad",
        icon: (
          <ProfileMenuIcon>
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
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Privacidad",
        description: "Uso de tu información y rol de Mi Manada",
        href: "/perfil/privacidad",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3.8 5.5 6.5v5.2c0 4.2 2.8 7.3 6.5 8.5 3.7-1.2 6.5-4.3 6.5-8.5V6.5L12 3.8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="m9.4 12.1 1.8 1.8 3.5-3.6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
    ],
  },
  {
    title: "Adopciones",
    items: [
      {
        title: "Favoritos",
        description: "Mascotas que guardaste para después",
        href: "/perfil/favoritos",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 20s-6.5-3.8-6.5-8.2A3.7 3.7 0 0 1 12 9.2a3.7 3.7 0 0 1 6.5 2.6C18.5 16.2 12 20 12 20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Solicitudes",
        description: "Solicitudes enviadas o recibidas",
        href: "/adopta/solicitudes",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5.5 7.5h13a1.5 1.5 0 0 1 1.5 1.5v7.2a1.5 1.5 0 0 1-1.5 1.5H9.2L5.5 20v-2.8H5.5A1.5 1.5 0 0 1 4 15.7V9A1.5 1.5 0 0 1 5.5 7.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Puestos en adopción",
        description: "Casos que has publicado",
        href: "/adopta/puestos",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
              <ellipse cx="7.2" cy="8.2" rx="2" ry="2.4" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="16.8" cy="8.2" rx="2" ry="2.4" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="9" cy="5.5" rx="1.6" ry="2" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="15" cy="5.5" rx="1.6" ry="2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </ProfileMenuIcon>
        ),
      },
    ],
  },
];

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
            {menuSections.map((section) => (
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
