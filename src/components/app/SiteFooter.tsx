"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getMe, peekMe, type AuthUser } from "@/lib/api";

const VALUE_BLOCKS: Array<{
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: ReactNode;
}> = [
  {
    title: "Encuentra a tu compañero",
    description:
      "Explora perros y gatos en adopción, filtra por especie y conoce su historia antes de decidir.",
    href: "/adopta",
    linkLabel: "Cómo buscar una mascota",
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect x="6" y="10" width="36" height="26" rx="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 28c2.5-4 6-6 8-6s5.5 2 8 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="20" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M33 33.5 38 38.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="30.5" cy="31" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Solicita con confianza",
    description:
      "Envía una solicitud de adopción. El teléfono del publicador solo se muestra cuando das ese paso.",
    href: "/adopta/solicitudes",
    linkLabel: "Ver mis solicitudes",
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M14 12h20a3 3 0 0 1 3 3v22l-6-4H14a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M18 20h12M18 25h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M28.5 34.5 32 38l7-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Publica y salva vidas",
    description:
      "Da en adopción una mascota o una camada completa y ayúdales a encontrar familia.",
    href: "/adopta/nueva",
    linkLabel: "Poner en adopción",
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M24 34s-9-6.2-9-13a6.5 6.5 0 0 1 13 0c0 6.8-9 13-9 13Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="20.5" r="2.2" fill="currentColor" />
        <path
          d="M12 38h24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M34 12v6M31 15h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const FOOTER_COLUMNS = [
  [
    { href: "/perfil", label: "Mi cuenta" },
    { href: "/perfil/favoritos", label: "Favoritos" },
    { href: "/adopta/puestos", label: "Mis publicaciones" },
    { href: "/adopta/solicitudes", label: "Solicitudes" },
    { href: "/adopta/nueva", label: "Poner en adopción" },
  ],
  [
    { href: "/adopta", label: "Adopta" },
    { href: "/home", label: "Inicio" },
    { href: "/perfil/verificacion", label: "Verificación", badge: "IMPORTANTE" },
    { href: "/perfil/notificaciones", label: "Notificaciones" },
    { href: "/perfil/advertencias", label: "Advertencias" },
    { href: "mailto:hola@mimanada.app", label: "Ayuda", external: true },
  ],
] as const;

const LEGAL_LINKS = [
  { href: "/perfil/privacidad", label: "Términos y condiciones" },
  { href: "/perfil/privacidad", label: "Cómo cuidamos tu privacidad" },
] as const;

function ValueBlockCard({
  block,
}: {
  block: (typeof VALUE_BLOCKS)[number];
}) {
  return (
    <div className="flex h-full flex-col items-center px-2 text-center sm:items-start sm:px-0 sm:text-left">
      <span className="text-[#9a9a9a]">{block.icon}</span>
      <h3 className="mt-4 text-[1rem] text-[#4a4a4a] [font-weight:700]">
        {block.title}
      </h3>
      <p className="mt-2 max-w-[22rem] text-[0.85rem] leading-relaxed text-[var(--color-text-muted)]">
        {block.description}
      </p>
      <Link
        href={block.href}
        className="mt-3 text-[0.85rem] text-[var(--color-primary)] [font-weight:600] hover:underline"
      >
        {block.linkLabel}
      </Link>
    </div>
  );
}

function ValueBlocksCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const width = el.clientWidth;
      if (width <= 0) return;
      const index = Math.round(el.scrollLeft / width);
      setActive(Math.min(VALUE_BLOCKS.length - 1, Math.max(0, index)));
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="border-t border-[#ececec] bg-white">
      {/* Mobile carousel */}
      <div className="sm:hidden">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Beneficios de Mi Manada"
        >
          {VALUE_BLOCKS.map((block) => (
            <div
              key={block.title}
              className="w-full shrink-0 snap-center px-6 py-8"
            >
              <ValueBlockCard block={block} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 pb-5">
          {VALUE_BLOCKS.map((block, index) => (
            <button
              key={block.title}
              type="button"
              aria-label={`Ir a ${block.title}`}
              aria-current={active === index}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${
                active === index
                  ? "w-5 bg-[var(--color-primary)]"
                  : "w-2 bg-[#d8d8d8]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="mx-auto hidden w-full max-w-[80rem] gap-8 px-4 py-10 sm:grid sm:grid-cols-3 sm:gap-6 sm:px-6 lg:px-8 lg:py-12">
        {VALUE_BLOCKS.map((block) => (
          <ValueBlockCard key={block.title} block={block} />
        ))}
      </div>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
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

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || null;

  return (
    <footer className="mt-auto">
      <ValueBlocksCarousel />

      <div className="lg:hidden">
        <div className="bg-[var(--color-primary)]">
          <div className="mx-auto flex w-full max-w-[80rem] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white p-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-mimanda-horizontal-diapo.png"
                alt="Mi Manada"
                className="h-full w-full object-contain"
              />
            </span>
            <p className="text-[0.82rem] text-white [font-weight:700] sm:text-[0.88rem]">
              ¡Adopta y publica con Mi Manada!
            </p>
          </div>
        </div>

        <div className="bg-white">
          <nav
            aria-label="Enlaces del sitio"
            className="mx-auto grid w-full max-w-[80rem] grid-cols-2 gap-x-6 gap-y-0 px-4 py-5 sm:px-6 lg:px-8"
          >
            {FOOTER_COLUMNS.map((column, colIndex) => (
              <ul key={colIndex} className="space-y-4">
                {column.map((link) => {
                  const content = (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>{link.label}</span>
                      {"badge" in link && link.badge ? (
                        <span className="rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[0.62rem] leading-none text-white [font-weight:800]">
                          {link.badge}
                        </span>
                      ) : null}
                    </span>
                  );

                  if ("external" in link && link.external) {
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[0.82rem] text-[#4a4a4a] [font-weight:400] transition hover:text-[var(--color-primary)]"
                        >
                          {content}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.82rem] text-[#4a4a4a] [font-weight:400] transition hover:text-[var(--color-primary)]"
                      >
                        {content}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-[#e8e8e8] bg-[#f5f5f5]">
        <div className="mx-auto w-full max-w-[80rem] px-4 py-5 sm:px-6 lg:px-8">
          {firstName ? (
            <Link
              href="/perfil"
              className="mb-4 inline-flex items-center gap-2.5 text-[#4a4a4a] transition hover:text-[var(--color-primary)]"
            >
              <span className="flex h-7 w-7 items-center justify-center text-[#666]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="9.2" r="2.8" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M6.4 18.2c1.3-2.4 3.4-3.6 5.6-3.6s4.3 1.2 5.6 3.6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-[1rem] [font-weight:600]">{firstName}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="mb-4 inline-flex items-center gap-2.5 text-[#4a4a4a] transition hover:text-[var(--color-primary)]"
            >
              <span className="flex h-7 w-7 items-center justify-center text-[#666]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="9.2" r="2.8" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M6.4 18.2c1.3-2.4 3.4-3.6 5.6-3.6s4.3 1.2 5.6 3.6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-[1rem] [font-weight:600]">Iniciar sesión</span>
            </Link>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8rem] text-[#666]">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="mt-3 text-[0.75rem] leading-relaxed text-[#9a9a9a]">
            © {year}. Mi Manada. Conectamos mascotas con familias responsables.
          </p>
        </div>
      </div>
    </footer>
  );
}
