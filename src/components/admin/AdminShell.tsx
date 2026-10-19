"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError, clearSession, getMe, getToken, type AuthUser } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/moderacion", label: "Moderación" },
  { href: "/admin/apelaciones", label: "Apelaciones" },
  { href: "/admin/publicaciones", label: "Publicaciones" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/historial", label: "Historial" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!getToken()) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      try {
        const me = await getMe();
        if (cancelled) return;
        if (me.role !== "admin") {
          setDenied(true);
          setChecking(false);
          return;
        }
        setUser(me);
        setChecking(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        setDenied(true);
        setChecking(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-[#666]">
        Verificando acceso…
      </div>
    );
  }

  if (denied || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7f9] px-4 text-center">
        <p className="text-[1.1rem] text-[#333] [font-weight:800]">
          Acceso restringido
        </p>
        <p className="max-w-md text-[0.9rem] text-[#666]">
          Necesitas una cuenta de administrador para entrar al panel.
        </p>
        <Link
          href="/home"
          className="mt-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[0.9rem] text-white [font-weight:700]"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f9] text-[#2a2a2a]">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--color-primary)] text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/15 px-5 py-4">
          <Link href="/admin" className="block">
            <p className="text-[0.7rem] uppercase tracking-[0.14em] text-white/70 [font-weight:700]">
              Mi Manada
            </p>
            <p className="text-[1.05rem] text-white [font-weight:800]">
              Panel admin
            </p>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 text-[0.9rem] transition ${
                  active
                    ? "bg-white text-[var(--color-primary)] [font-weight:800]"
                    : "text-white/90 hover:bg-white/10 [font-weight:600]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/15 p-4">
          <p className="truncate text-[0.85rem] text-white [font-weight:700]">
            {user.fullName}
          </p>
          <p className="truncate text-[0.75rem] text-white/70">{user.email}</p>
          <Link
            href="/home"
            className="mt-3 inline-block text-[0.8rem] text-[var(--color-accent-yellow)] [font-weight:700]"
          >
            Ir a la app
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e8e8e8] bg-white/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            className="rounded-lg border border-[#e8e8e8] px-3 py-2 text-[0.85rem] text-[#555] [font-weight:700] lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            Menú
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem] text-[#333] [font-weight:800]">
              Administración
            </p>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
