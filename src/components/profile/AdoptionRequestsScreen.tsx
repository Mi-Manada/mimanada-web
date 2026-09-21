"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

export function AdoptionRequestsScreen() {
  const [sent, setSent] = useState<AdoptionRequest[]>([]);
  const [received, setReceived] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [sentRows, receivedRows] = await Promise.all([
      getSentAdoptionRequests(),
      getReceivedAdoptionRequests(),
    ]);
    setSent(sentRows);
    setReceived(receivedRows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }

    reload()
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

  const empty =
    !loading && !error && sent.length === 0 && received.length === 0;
  const pendingReceived = received.filter((item) => item.status === "pending");

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
          description="Cuando alguien quiera adoptar una mascota tuya, o tú solicites adoptar, aparecerán aquí. Al solicitar se liberan los datos de contacto para coordinar."
          ctaLabel="Ver adopciones"
          ctaHref="/adopta"
        />
      ) : null}

      {!loading && received.length > 0 ? (
        <section className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="text-[0.95rem] text-[#555] [font-weight:800]">
              Recibidas
            </h2>
            {pendingReceived.length > 0 ? (
              <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[0.72rem] text-white [font-weight:700]">
                {pendingReceived.length} pendiente
                {pendingReceived.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <ul className="space-y-2">
            {received.map((item) => (
              <li
                key={item.id}
                className="rounded-[14px] border border-[#ececec] bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.9rem] text-[#4a4a4a] [font-weight:700]">
                      {item.requesterName ?? "Interesado"}
                      {item.petName ? ` quiere adoptar a ${item.petName}` : ""}
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
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[0.7rem] [font-weight:700] ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>

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
            ))}
          </ul>
        </section>
      ) : null}

      {!loading && sent.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[0.95rem] text-[#555] [font-weight:800]">
            Enviadas
          </h2>
          <ul className="space-y-2">
            {sent.map((item) => (
              <li
                key={item.id}
                className="rounded-[14px] border border-[#ececec] bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.9rem] text-[#4a4a4a] [font-weight:700]">
                      Solicitud
                      {item.petName ? ` · ${item.petName}` : ""}
                    </p>
                    {item.message ? (
                      <p className="mt-1 text-[0.82rem] text-[var(--color-text-muted)]">
                        Tu mensaje: “{item.message}”
                      </p>
                    ) : null}
                    {item.contactPhone ? (
                      <a
                        href={`tel:${item.contactPhone}`}
                        className="mt-1 inline-block text-[0.82rem] text-[var(--color-primary)] [font-weight:600]"
                      >
                        Contacto del publicador: {item.contactPhone}
                      </a>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[0.7rem] [font-weight:700] ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={petHref(item)}
                    className="text-[0.78rem] text-[var(--color-text-muted)] underline"
                  >
                    Ver mascota
                  </Link>
                  {item.status === "pending" || item.status === "accepted" ? (
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
        </section>
      ) : null}
    </ProfilePageShell>
  );
}
