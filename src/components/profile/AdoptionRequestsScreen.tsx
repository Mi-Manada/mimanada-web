"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getReceivedAdoptionRequests,
  getSentAdoptionRequests,
  getToken,
  updateAdoptionRequestStatus,
  type AdoptionRequest,
  type AdoptionRequestStatus,
} from "@/lib/api";
import { petPath } from "@/lib/seo-urls";

type TabId = "received" | "sent";

function statusLabel(status: AdoptionRequestStatus) {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "accepted":
      return "Aceptada";
    case "rejected":
      return "Rechazada";
    case "closed":
      return "Cerrada";
    default:
      return status;
  }
}

function statusClass(status: AdoptionRequestStatus) {
  switch (status) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "closed":
      return "bg-[#f3f3f3] text-[#777] border-[#e4e4e4]";
    default:
      return "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20";
  }
}

function petHref(item: AdoptionRequest) {
  return petPath({ id: item.petId, name: item.petName ?? "mascota" });
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M4 8.5 12 3l8 5.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 9h5.2a2.8 2.8 0 0 0 5.6 0H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OutboxIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M12 16V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m8 9 4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdoptionRequestsScreen() {
  const [sent, setSent] = useState<AdoptionRequest[]>([]);
  const [received, setReceived] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("received");

  const reload = useCallback(async () => {
    const [sentRows, receivedRows] = await Promise.all([
      getSentAdoptionRequests(),
      getReceivedAdoptionRequests(),
    ]);
    setSent(sentRows);
    setReceived(receivedRows);
    return { sentRows, receivedRows };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }

    reload()
      .then(({ sentRows, receivedRows }) => {
        if (cancelled) return;
        const pendingIncoming = receivedRows.filter(
          (item) => item.status === "pending",
        );
        if (pendingIncoming.length > 0 || receivedRows.length > 0) {
          setTab("received");
        } else if (sentRows.length > 0) {
          setTab("sent");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar las solicitudes.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function act(
    id: string,
    status: Exclude<AdoptionRequestStatus, "pending">,
  ) {
    setActingId(id);
    setError("");
    try {
      await updateAdoptionRequestStatus(id, status);
      await reload();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar la solicitud.",
      );
    } finally {
      setActingId(null);
    }
  }

  const pendingReceived = useMemo(
    () => received.filter((item) => item.status === "pending"),
    [received],
  );
  const pendingSent = useMemo(
    () => sent.filter((item) => item.status === "pending"),
    [sent],
  );

  const empty = !loading && !error && sent.length === 0 && received.length === 0;
  const showingReceived = tab === "received";
  const activeList = showingReceived ? received : sent;

  return (
    <ProfilePageShell title="Solicitudes de adopción" backHref="/perfil">
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

      {empty ? (
        <ProfileEmptyState
          title="Sin solicitudes por ahora"
          description="Cuando alguien quiera adoptar una mascota tuya, o tú solicites adoptar, aparecerán aquí. El publicador contacta al interesado con el teléfono de su perfil."
          ctaLabel="Ver adopciones"
          ctaHref="/adopta"
        />
      ) : null}

      {!loading && !empty ? (
        <>
          <div
            role="tablist"
            aria-label="Tipo de solicitud"
            className="mb-4 grid grid-cols-2 gap-1 rounded-[14px] bg-[#efefef] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={showingReceived}
              onClick={() => setTab("received")}
              className={`flex items-center justify-center gap-2 rounded-[11px] px-3 py-2.5 text-[0.84rem] transition ${
                showingReceived
                  ? "bg-white text-[var(--color-primary)] shadow-sm [font-weight:800]"
                  : "text-[#666] hover:text-[#444] [font-weight:600]"
              }`}
            >
              <InboxIcon />
              <span>Recibidas</span>
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] [font-weight:800] ${
                  showingReceived
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[#ddd] text-[#555]"
                }`}
              >
                {received.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!showingReceived}
              onClick={() => setTab("sent")}
              className={`flex items-center justify-center gap-2 rounded-[11px] px-3 py-2.5 text-[0.84rem] transition ${
                !showingReceived
                  ? "bg-white text-[#2f6f8f] shadow-sm [font-weight:800]"
                  : "text-[#666] hover:text-[#444] [font-weight:600]"
              }`}
            >
              <OutboxIcon />
              <span>Enviadas</span>
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] [font-weight:800] ${
                  !showingReceived
                    ? "bg-[#2f6f8f] text-white"
                    : "bg-[#ddd] text-[#555]"
                }`}
              >
                {sent.length}
              </span>
            </button>
          </div>

          <div
            className={`mb-4 rounded-[14px] border px-3.5 py-3 ${
              showingReceived
                ? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.05]"
                : "border-[#2f6f8f]/20 bg-[#2f6f8f]/[0.06]"
            }`}
          >
            <p
              className={`text-[0.88rem] [font-weight:800] ${
                showingReceived ? "text-[var(--color-primary)]" : "text-[#2f6f8f]"
              }`}
            >
              {showingReceived
                ? "Solicitudes que te enviaron"
                : "Solicitudes que tú enviaste"}
            </p>
            <p className="mt-0.5 text-[0.8rem] text-[var(--color-text-muted)]">
              {showingReceived
                ? pendingReceived.length > 0
                  ? `Tienes ${pendingReceived.length} pendiente${pendingReceived.length === 1 ? "" : "s"} por responder.`
                  : "Personas interesadas en adoptar tus mascotas."
                : pendingSent.length > 0
                  ? `Tienes ${pendingSent.length} en espera de respuesta.`
                  : "Seguimiento de las adopciones que pediste."}
            </p>
          </div>

          {activeList.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#e0e0e0] bg-white px-4 py-8 text-center">
              <p className="text-[0.9rem] text-[#555] [font-weight:700]">
                {showingReceived
                  ? "Aún no recibiste solicitudes"
                  : "Aún no enviaste solicitudes"}
              </p>
              <p className="mt-1 text-[0.82rem] text-[var(--color-text-muted)]">
                {showingReceived
                  ? "Cuando alguien pulse Adóptame en una mascota tuya, aparecerá aquí."
                  : "Explora adopciones y solicita la que más te guste."}
              </p>
              {!showingReceived ? (
                <Link
                  href="/adopta"
                  className="mt-4 inline-flex h-10 items-center rounded-full bg-[var(--color-primary)] px-4 text-[0.85rem] text-white [font-weight:700]"
                >
                  Ver adopciones
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-2.5" role="tabpanel">
              {showingReceived
                ? received.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[14px] border border-[var(--color-primary)]/15 border-l-[3px] border-l-[var(--color-primary)] bg-white px-4 py-3"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[0.68rem] text-[var(--color-primary)] [font-weight:800]">
                          Recibida
                        </span>
                        <span className="text-[0.72rem] text-[#9a9a9a]">
                          {formatWhen(item.createdAt)}
                        </span>
                        <span
                          className={`ml-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[0.7rem] [font-weight:700] ${statusClass(item.status)}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      <p className="text-[0.9rem] text-[#4a4a4a] [font-weight:700]">
                        {item.requesterName ?? "Interesado"}
                        {item.petName
                          ? ` quiere adoptar a ${item.petName}`
                          : " quiere adoptar"}
                      </p>
                      {item.message ? (
                        <p className="mt-1 text-[0.82rem] text-[var(--color-text-muted)]">
                          “{item.message}”
                        </p>
                      ) : null}
                      {item.requesterPhone ? (
                        <a
                          href={`tel:${item.requesterPhone}`}
                          className="mt-1 inline-block text-[0.82rem] text-[var(--color-primary)] [font-weight:600]"
                        >
                          Contacto: {item.requesterPhone}
                        </a>
                      ) : (
                        <p className="mt-1 text-[0.78rem] text-[var(--color-text-muted)]">
                          El interesado no tiene teléfono en su perfil.
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Link
                          href={petHref(item)}
                          className="text-[0.78rem] text-[var(--color-text-muted)] underline"
                        >
                          Ver mascota
                        </Link>
                        {item.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={actingId === item.id}
                              onClick={() => void act(item.id, "accepted")}
                              className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[0.78rem] text-white [font-weight:700] disabled:opacity-60"
                            >
                              Aceptar
                            </button>
                            <button
                              type="button"
                              disabled={actingId === item.id}
                              onClick={() => void act(item.id, "rejected")}
                              className="rounded-full border border-[#e0e0e0] px-3 py-1.5 text-[0.78rem] text-[#555] [font-weight:700] disabled:opacity-60"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : item.status !== "closed" ? (
                          <button
                            type="button"
                            disabled={actingId === item.id}
                            onClick={() => void act(item.id, "closed")}
                            className="rounded-full border border-[#e0e0e0] px-3 py-1.5 text-[0.78rem] text-[#555] [font-weight:700] disabled:opacity-60"
                          >
                            Cerrar
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))
                : sent.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[14px] border border-[#2f6f8f]/15 border-l-[3px] border-l-[#2f6f8f] bg-white px-4 py-3"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#2f6f8f]/10 px-2 py-0.5 text-[0.68rem] text-[#2f6f8f] [font-weight:800]">
                          Enviada
                        </span>
                        <span className="text-[0.72rem] text-[#9a9a9a]">
                          {formatWhen(item.createdAt)}
                        </span>
                        <span
                          className={`ml-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[0.7rem] [font-weight:700] ${statusClass(item.status)}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      <p className="text-[0.9rem] text-[#4a4a4a] [font-weight:700]">
                        Tú solicitaste adoptar
                        {item.petName ? ` a ${item.petName}` : ""}
                      </p>
                      {item.message ? (
                        <p className="mt-1 text-[0.82rem] text-[var(--color-text-muted)]">
                          Tu mensaje: “{item.message}”
                        </p>
                      ) : null}
                      <p className="mt-1 text-[0.78rem] text-[var(--color-text-muted)]">
                        El publicador te contactará si acepta tu solicitud.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Link
                          href={petHref(item)}
                          className="text-[0.78rem] text-[var(--color-text-muted)] underline"
                        >
                          Ver mascota
                        </Link>
                        {item.status === "pending" ||
                        item.status === "accepted" ? (
                          <button
                            type="button"
                            disabled={actingId === item.id}
                            onClick={() => void act(item.id, "closed")}
                            className="rounded-full border border-[#e0e0e0] px-3 py-1.5 text-[0.78rem] text-[#555] [font-weight:700] disabled:opacity-60"
                          >
                            Cerrar solicitud
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
            </ul>
          )}
        </>
      ) : null}
    </ProfilePageShell>
  );
}
