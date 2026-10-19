import type { ReactNode } from "react";
import { ProfileMenuIcon } from "@/components/profile/ProfilePageShell";

export type ProfileMenuItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

export type ProfileMenuSection = {
  title: string;
  items: ProfileMenuItem[];
};

export const PROFILE_MENU_SECTIONS: ProfileMenuSection[] = [
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
      {
        title: "Advertencias",
        description: "Avisos y sanciones de moderación",
        href: "/perfil/advertencias",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3.8 2.8 19.2h18.4L12 3.8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M12 9.5v4.2M12 16.6h.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Apelaciones",
        description: "Impugna decisiones sobre tus publicaciones",
        href: "/perfil/apelaciones",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v14L12 17.2 5.5 20V6A1.5 1.5 0 0 1 7 4.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9 9.2h6M9 12.2h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
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
        title: "Notificaciones",
        description: "Avisos de solicitudes de adopción",
        href: "/perfil/notificaciones",
        icon: (
          <ProfileMenuIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 4.5a5 5 0 0 1 5 5v2.2c0 .8.3 1.5.8 2.1l.9 1.1c.7.8.1 2.1-1 2.1H6.3c-1.1 0-1.7-1.3-1-2.1l.9-1.1c.5-.6.8-1.3.8-2.1V9.5a5 5 0 0 1 5-5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M10 18.8a2.2 2.2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </ProfileMenuIcon>
        ),
      },
      {
        title: "Solicitudes",
        description: "Gestiona quién quiere adoptar",
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

/** Main app tabs for mobile bottom nav (Mercado Libre style). */
export const MOBILE_TAB_ITEMS = [
  {
    href: "/home",
    label: "Home",
    enabled: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/adopta",
    label: "Adopta",
    enabled: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7.5 14c-1.8.2-3.2 1.6-3.2 3.4V20h15.4v-2.6c0-1.8-1.4-3.2-3.2-3.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M12 4.5c2.2 1.8 3.6 3.7 3.6 5.6 0 2-1.6 3.5-3.6 3.5S8.4 12.1 8.4 10.1c0-1.9 1.4-3.8 3.6-5.6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Servicios",
    enabled: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20s-6.5-3.8-6.5-8.2A3.7 3.7 0 0 1 12 9.2a3.7 3.7 0 0 1 6.5 2.6C18.5 16.2 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M12 11.2v4.2M10 13.3h4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Tienda",
    enabled: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 9.5 6.2 5h11.6L19 9.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 9.5h14v9.2a1.3 1.3 0 0 1-1.3 1.3H6.3A1.3 1.3 0 0 1 5 18.7V9.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Comunidad",
    enabled: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20s-6.2-3.7-6.2-8A3.5 3.5 0 0 1 12 9.4a3.5 3.5 0 0 1 6.2 2.6C18.2 16.3 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="10.2" cy="12.4" r="1.1" fill="currentColor" />
        <circle cx="13.8" cy="12.4" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
] as const;
