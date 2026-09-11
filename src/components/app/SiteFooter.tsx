import Link from "next/link";

const VALUE_BLOCKS = [
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
] as const;

const FOOTER_LINKS = [
  { href: "/adopta", label: "Adopta" },
  { href: "/adopta/nueva", label: "Publicar" },
  { href: "/adopta/solicitudes", label: "Solicitudes" },
  { href: "/perfil", label: "Mi perfil" },
  { href: "/perfil/privacidad", label: "Privacidad" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#ececec] bg-white">
      <div className="mx-auto grid w-full max-w-[80rem] gap-8 px-4 py-10 sm:grid-cols-3 sm:gap-6 sm:px-6 lg:px-8 lg:py-12">
        {VALUE_BLOCKS.map((block) => (
          <div key={block.title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
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
        ))}
      </div>

      <div className="border-t border-[#ececec] bg-[#f7f7f7]">
        <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <nav
            aria-label="Enlaces del sitio"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8rem] text-[#666]"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:hola@mimanada.app"
              className="transition hover:text-[var(--color-primary)]"
            >
              Ayuda
            </a>
          </nav>
          <p className="text-[0.72rem] leading-relaxed text-[#9a9a9a]">
            Copyright © {year} Mi Manada. Conectamos mascotas con familias
            responsables.
          </p>
        </div>
      </div>
    </footer>
  );
}
