"use client";

import Link from "next/link";
import {
  isAccountWarningNotification,
  mediaUrl,
  type AppNotification,
} from "@/lib/api";

export function formatNotificationWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PetThumb({
  photoUrl,
  size = "md",
}: {
  photoUrl: string | null | undefined;
  size?: "sm" | "md";
}) {
  const src = mediaUrl(photoUrl);
  const box =
    size === "sm"
      ? "h-12 w-12 rounded-[10px]"
      : "h-14 w-14 rounded-[12px]";

  return (
    <span
      className={`relative shrink-0 overflow-hidden border border-[#ececec] bg-[#f3f3f3] ${box}`}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[#c4c4c4]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12c1.8 0 3.2-1.5 3.2-3.3S13.8 5.4 12 5.4 8.8 6.9 8.8 8.7 10.2 12 12 12Zm0 1.7c-2.5 0-7.5 1.3-7.5 3.8v1.1h15v-1.1c0-2.5-5-3.8-7.5-3.8Z"
              fill="currentColor"
              opacity="0.55"
            />
          </svg>
        </span>
      )}
    </span>
  );
}

function canAppeal(item: AppNotification) {
  if (item.type !== "moderation" || !item.petId) return false;
  const title = item.title.toLowerCase();
  return (
    title.includes("ocultada") ||
    title.includes("eliminada") ||
    title.includes("bloqueada")
  );
}

export function NotificationListItem({
  item,
  onOpen,
  dense = false,
}: {
  item: AppNotification;
  onOpen?: (item: AppNotification) => void;
  dense?: boolean;
}) {
  const href =
    item.linkHref ||
    (isAccountWarningNotification(item)
      ? "/perfil/advertencias"
      : item.type === "moderation"
        ? "/adopta/puestos"
        : "/adopta/solicitudes");
  const unread = !item.readAt;
  const appealHref = item.petId
    ? `/perfil/apelaciones?petId=${item.petId}`
    : "/perfil/apelaciones";
  const showAppeal = canAppeal(item);

  return (
    <div
      className={`transition ${
        dense
          ? `px-3.5 py-2.5 hover:bg-[#f6f6f6] ${
              unread ? "bg-[var(--color-primary)]/[0.06]" : "bg-white"
            }`
          : `rounded-[14px] border px-3.5 py-3 hover:border-[var(--color-primary)]/35 ${
              unread
                ? "border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.04]"
                : "border-[#ececec] bg-white"
            }`
      }`}
    >
      <Link
        href={href}
        onClick={() => onOpen?.(item)}
        className="flex items-start gap-3"
      >
        <PetThumb photoUrl={item.petPhotoUrl} size={dense ? "sm" : "md"} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span
              className={`block text-[#4a4a4a] ${
                dense ? "text-[0.84rem]" : "text-[0.9rem]"
              } ${unread ? "[font-weight:800]" : "[font-weight:700]"}`}
            >
              {item.title}
            </span>
            {unread ? (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
            ) : null}
          </span>
          <span
            className={`mt-0.5 block text-[var(--color-text-muted)] ${
              dense ? "line-clamp-2 text-[0.78rem]" : "text-[0.85rem]"
            }`}
          >
            {item.body}
          </span>
          <span className="mt-1 block text-[0.7rem] text-[#9a9a9a]">
            {formatNotificationWhen(item.createdAt)}
          </span>
        </span>
      </Link>
      {showAppeal ? (
        <div className={dense ? "mt-2 pl-[3.75rem]" : "mt-2.5 pl-[4.25rem]"}>
          <Link
            href={appealHref}
            onClick={() => onOpen?.(item)}
            className="inline-flex rounded-full border border-[var(--color-primary)] px-3 py-1 text-[0.75rem] text-[var(--color-primary)] [font-weight:800] hover:bg-[var(--color-primary)]/5"
          >
            Apelar decisión
          </Link>
        </div>
      ) : null}
    </div>
  );
}
