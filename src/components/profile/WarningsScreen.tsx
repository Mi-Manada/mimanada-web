"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatNotificationWhen,
} from "@/components/notifications/NotificationListItem";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getMe,
  getNotifications,
  getToken,
  isAccountWarningNotification,
  markNotificationRead,
  type AppNotification,
  type AuthUser,
} from "@/lib/api";
import { subscribeNotifications } from "@/lib/notifications-socket";

function WarningIcon() {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
    </span>
  );
}

export function WarningsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }

    Promise.all([getMe().catch(() => null), getNotifications(100)])
      .then(([me, rows]) => {
        if (cancelled) return;
        setUser(me);
        setItems(rows.filter(isAccountWarningNotification));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar las advertencias.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeNotifications((notification) => {
      if (cancelled || !isAccountWarningNotification(notification)) return;
      setItems((prev) => {
        if (prev.some((row) => row.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function openItem(item: AppNotification) {
    if (item.readAt) return;
    try {
      await markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, readAt: new Date().toISOString() }
            : row,
        ),
      );
    } catch {
      /* ignore */
    }
  }

  const warnCount = user?.warnCount ?? items.filter((i) =>
    i.title.toLowerCase().includes("advertencia"),
  ).length;

  const statusLabel = useMemo(() => {
    const status = user?.accountStatus;
    if (status === "banned") return "Cuenta bloqueada";
    if (status === "suspended") return "Cuenta suspendida";
    if (status === "warned") return "Cuenta con advertencia";
    return null;
  }, [user?.accountStatus]);

  return (
    <ProfilePageShell title="Advertencias" backHref="/perfil">
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">
          Cargando...
        </p>
      ) : null}

      {error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)]">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <div className="mb-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[0.9rem] text-amber-950 [font-weight:800]">
            {warnCount === 0
              ? "Sin advertencias activas"
              : warnCount === 1
                ? "1 advertencia registrada"
                : `${warnCount} advertencias registradas`}
          </p>
          {statusLabel ? (
            <p className="mt-1 text-[0.82rem] text-amber-900/80">
              Estado actual: {statusLabel}
              {user?.suspendedUntil
                ? ` · hasta ${new Date(user.suspendedUntil).toLocaleString("es-VE")}`
                : ""}
            </p>
          ) : (
            <p className="mt-1 text-[0.82rem] text-amber-900/80">
              Aquí verás mensajes del equipo de moderación sobre tu cuenta.
            </p>
          )}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <ProfileEmptyState
          title="Sin advertencias"
          description="Si el equipo de moderación te envía una advertencia o sanción, aparecerá en esta lista."
          ctaLabel="Volver al perfil"
          ctaHref="/perfil"
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void openItem(item)}
                  className={`flex w-full items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition hover:border-amber-300 ${
                    unread
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-[#ececec] bg-white"
                  }`}
                >
                  <WarningIcon />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={`block text-[0.9rem] text-[#4a4a4a] ${
                          unread ? "[font-weight:800]" : "[font-weight:700]"
                        }`}
                      >
                        {item.title}
                      </span>
                      {unread ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[0.85rem] text-[#555]">
                      {item.body}
                    </span>
                    <span className="mt-1.5 block text-[0.7rem] text-[#9a9a9a]">
                      {formatNotificationWhen(item.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </ProfilePageShell>
  );
}
