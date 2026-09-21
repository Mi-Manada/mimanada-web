"use client";

import { useEffect, useState } from "react";
import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getNotifications,
  getToken,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";
import { subscribeNotifications } from "@/lib/notifications-socket";

export function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }

    getNotifications()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar las notificaciones.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeNotifications((notification) => {
      if (cancelled) return;
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

  async function markAll() {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) =>
          item.readAt ? item : { ...item, readAt: new Date().toISOString() },
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron marcar como leídas.",
      );
    } finally {
      setMarking(false);
    }
  }

  async function openNotification(item: AppNotification) {
    if (!item.readAt) {
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
  }

  const unread = items.filter((item) => !item.readAt).length;

  return (
    <ProfilePageShell title="Notificaciones" backHref="/perfil">
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

      {!loading && items.length === 0 ? (
        <ProfileEmptyState
          title="Sin notificaciones"
          description="Cuando alguien solicite adoptar una mascota tuya, te avisaremos aquí."
          ctaLabel="Ir a solicitudes"
          ctaHref="/adopta/solicitudes"
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <>
          {unread > 0 ? (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                disabled={marking}
                onClick={() => void markAll()}
                className="text-[0.8rem] text-[var(--color-primary)] [font-weight:700] disabled:opacity-60"
              >
                Marcar todas como leídas
              </button>
            </div>
          ) : null}
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationListItem
                  item={item}
                  onOpen={(row) => void openNotification(row)}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </ProfilePageShell>
  );
}
