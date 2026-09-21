"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NotificationListItem } from "@/components/notifications/NotificationListItem";
import {
  ApiError,
  getNotifications,
  getToken,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";
import { subscribeNotifications } from "@/lib/notifications-socket";

export function NotificationBell({
  unreadCount,
  onUnreadChange,
}: {
  unreadCount: number;
  onUnreadChange: (count: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    if (!getToken()) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await getNotifications(12);
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las notificaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    return subscribeNotifications((notification) => {
      setItems((prev) => {
        if (prev.some((row) => row.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 12);
      });
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function markAll() {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) =>
          item.readAt ? item : { ...item, readAt: new Date().toISOString() },
        ),
      );
      onUnreadChange(0);
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
        onUnreadChange(Math.max(0, unreadCount - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 4.5a5 5 0 0 1 5 5v2.2c0 .8.3 1.5.8 2.1l.9 1.1c.7.8.1 2.1-1 2.1H6.3c-1.1 0-1.7-1.3-1-2.1l.9-1.1c.5-.6.8-1.3.8-2.1V9.5a5 5 0 0 1 5-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 18.8a2.2 2.2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent-yellow)] px-1 text-[0.62rem] text-[var(--color-primary)] [font-weight:800]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notificaciones"
          className="absolute top-[calc(100%+0.55rem)] right-0 z-50 w-[min(22.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#f0f0f0] px-4 py-3">
            <p className="text-[1rem] text-[#3f3f3f] [font-weight:800]">
              Notificaciones
            </p>
            {unread > 0 ? (
              <button
                type="button"
                disabled={marking}
                onClick={() => void markAll()}
                className="text-[0.75rem] text-[var(--color-primary)] [font-weight:700] disabled:opacity-60"
              >
                Marcar todas
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-[0.85rem] text-[var(--color-text-muted)]">
                Cargando...
              </p>
            ) : null}

            {error ? (
              <p className="px-4 py-4 text-[0.82rem] text-[var(--color-primary)]">
                {error}
              </p>
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[0.85rem] text-[var(--color-text-muted)]">
                No tienes notificaciones todavía.
              </p>
            ) : null}

            {!loading && items.length > 0 ? (
              <ul className="divide-y divide-[#f0f0f0]">
                {items.map((item) => (
                  <li key={item.id}>
                    <NotificationListItem
                      item={item}
                      dense
                      onOpen={(row) => void openNotification(row)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="border-t border-[#f0f0f0] bg-[#fafafa]">
            <Link
              href="/perfil/notificaciones"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-[0.82rem] text-[var(--color-primary)] [font-weight:800] transition hover:bg-[#f3f3f3]"
            >
              Ver todas
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
