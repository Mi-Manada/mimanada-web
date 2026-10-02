"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TAB_ITEMS } from "@/components/profile/profile-menu";

function isTabActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ececec] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex h-[3.75rem] max-w-[80rem] items-stretch justify-between px-1">
        {MOBILE_TAB_ITEMS.map((item) => {
          const active = item.enabled && isTabActive(pathname, item.href);
          const className = `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] transition ${
            active
              ? "text-[var(--color-primary)] [font-weight:800]"
              : item.enabled
                ? "text-[#777] [font-weight:600]"
                : "cursor-default text-[#bbb] [font-weight:500]"
          }`;

          if (!item.enabled) {
            return (
              <li key={item.label} className="flex min-w-0 flex-1">
                <span className={className} aria-disabled>
                  <span className="opacity-90">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.label} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                className={className}
                aria-current={active ? "page" : undefined}
              >
                <span className={active ? "opacity-100" : "opacity-90"}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
