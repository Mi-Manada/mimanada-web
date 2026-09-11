import type { ReactNode } from "react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  enabled?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: "/home",
    label: "Home",
    enabled: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13.2" r="1.35" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/adopta",
    label: "Adopta",
    enabled: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        <path
          d="M8.2 14.2c.7-1.1 1.7-1.7 3.8-1.7s3.1.6 3.8 1.7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Comunidad",
    enabled: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
  {
    href: "/perfil",
    label: "Perfil",
    enabled: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="9" r="3.1" fill="currentColor" />
        <path
          d="M5.8 19.2c1.4-3.1 3.9-4.7 6.2-4.7s4.8 1.6 6.2 4.7"
          fill="currentColor"
        />
      </svg>
    ),
  },
];
