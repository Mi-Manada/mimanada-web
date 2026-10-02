"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MobileBottomNav } from "@/components/app/MobileBottomNav";
import { SiteFooter } from "@/components/app/SiteFooter";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getToken, getUnreadNotificationCount } from "@/lib/api";
import { subscribeNotifications } from "@/lib/notifications-socket";

function LogoMark() {
  return (
    <Link
      href="/home"
      className="hidden shrink-0 items-center sm:flex"
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const handleUnreadChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setUnreadCount(0);
      return;
    }

    function refresh() {
      getUnreadNotificationCount()
        .then((data) => {
          if (!cancelled) setUnreadCount(data.count);
        })
        .catch(() => {
          if (!cancelled) setUnreadCount(0);
        });
    }

    refresh();
    const timer = window.setInterval(refresh, 90000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    const unsubscribe = subscribeNotifications(() => {
      if (!cancelled) {
        setUnreadCount((count) => count + 1);
      }
    });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      unsubscribe();
    };
  }, [pathname]);

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
                const q = query.trim();
                router.push(q ? `/adopta?q=${encodeURIComponent(q)}` : "/adopta");
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

            <NotificationBell
              unreadCount={unreadCount}
              onUnreadChange={handleUnreadChange}
            />

            <Link
              href="/perfil"
              aria-label="Ir a perfil"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="9.2" r="3" fill="currentColor" />
                <path
                  d="M6.2 18.4c1.3-2.6 3.5-3.9 5.8-3.9s4.5 1.3 5.8 3.9"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </div>
        </header>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
        <SiteFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
