"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const PANEL_WIDTH = 360;
const PANEL_GAP = 8;
const VIEWPORT_PAD = 12;

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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const isMobile = viewportW < 640;

    const width = isMobile
      ? Math.min(viewportW - VIEWPORT_PAD * 2, PANEL_WIDTH)
      : Math.min(PANEL_WIDTH, viewportW - VIEWPORT_PAD * 2);

    let left = isMobile
      ? (viewportW - width) / 2
      : rect.right - width;
    left = Math.max(
      VIEWPORT_PAD,
      Math.min(left, viewportW - width - VIEWPORT_PAD),
    );

    const top = rect.bottom + PANEL_GAP;
    const bottomNavReserve = isMobile ? 72 : 16;
    const maxHeight = Math.max(
      180,
      viewportH - top - VIEWPORT_PAD - bottomNavReserve,
    );

    setCoords({ top, left, width, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

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
  }, []);

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
        panelRef.current?.contains(target) ||
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

  const panel =
    open && mounted && coords
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Notificaciones"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
            }}
            className="fixed z-[60] overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#f0f0f0] px-3.5 py-3 sm:gap-3 sm:px-4">
              <p className="min-w-0 truncate text-[1rem] text-[#3f3f3f] [font-weight:800]">
                Notificaciones
              </p>
              {unread > 0 ? (
                <button
                  type="button"
                  disabled={marking}
                  onClick={() => void markAll()}
                  className="shrink-0 text-[0.75rem] text-[var(--color-primary)] [font-weight:700] disabled:opacity-60"
                >
                  Marcar todas
                </button>
              ) : null}
            </div>

            <div
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: Math.max(120, coords.maxHeight - 108) }}
            >
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0">
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

      {panel}
    </div>
  );
}
