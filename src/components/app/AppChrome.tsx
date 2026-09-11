"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { APP_NAV_ITEMS } from "@/components/app/nav-items";
import { SiteFooter } from "@/components/app/SiteFooter";

function LogoMark() {
  return (
    <Link
      href="/home"
      className="flex shrink-0 items-center"
      aria-label="Mi Manada - Inicio"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-mi-manada-header.png"
        alt="Mi Manada"
        className="h-7 w-auto object-contain sm:h-8"
      />
    </Link>
  );
}

export function AppChrome({
  children,
  hideHeader = false,
}: {
  children: ReactNode;
  hideHeader?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)] lg:min-h-[100dvh]">
      {!hideHeader ? (
        <header className="sticky top-0 z-40 bg-[var(--color-primary)] text-[var(--color-text-on-primary)]">
          <div className="mx-auto flex h-[4.25rem] w-full max-w-[80rem] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <LogoMark />

            <form
              className="ml-auto flex min-w-0 flex-1 justify-end sm:max-w-[18rem] md:max-w-[22rem] lg:max-w-[26rem]"
              onSubmit={(event) => {
                event.preventDefault();
              }}
              role="search"
            >
              <label className="relative flex w-full items-center">
                <span className="pointer-events-none absolute left-3.5 text-[var(--color-primary)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="m16.2 16.2 3.3 3.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="h-10 w-full rounded-full border-0 bg-white/85 py-2 pr-4 pl-10 text-[0.875rem] text-[var(--color-text)] outline-none placeholder:text-[#d28a97] focus:bg-white"
                />
              </label>
            </form>

            <div className="relative shrink-0">
              <button
                ref={buttonRef}
                type="button"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  ref={menuRef}
                  id={menuId}
                  role="menu"
                  className="absolute top-[calc(100%+0.55rem)] right-0 z-50 w-[15.5rem] overflow-hidden rounded-2xl border border-white/15 bg-[var(--color-primary)] py-2 shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                >
                  {APP_NAV_ITEMS.map((item) => {
                    const active =
                      item.enabled &&
                      (pathname === item.href ||
                        (item.href !== "/home" &&
                          pathname.startsWith(`${item.href}/`)));
                    const className = `flex w-full items-center gap-3 px-4 py-2.5 text-left text-[0.9rem] transition ${
                      active
                        ? "bg-white/15 text-[var(--color-accent-yellow)] [font-weight:700]"
                        : "text-white/95 hover:bg-white/10 [font-weight:500]"
                    } ${!item.enabled ? "cursor-default opacity-55" : ""}`;

                    if (!item.enabled) {
                      return (
                        <span
                          key={item.label}
                          role="menuitem"
                          className={className}
                          aria-disabled
                        >
                          <span className="opacity-95">{item.icon}</span>
                          {item.label}
                        </span>
                      );
                    }

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        className={className}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="opacity-95">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </header>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
