"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getReceivedAdoptionRequests,
  getSentAdoptionRequests,
  getToken,
  type AdoptionRequest,
} from "@/lib/api";

export function AdoptionRequestsScreen() {
  const [sent, setSent] = useState<AdoptionRequest[]>([]);
  const [received, setReceived] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }

    Promise.all([getSentAdoptionRequests(), getReceivedAdoptionRequests()])
      .then(([sentRows, receivedRows]) => {
        if (cancelled) return;
        setSent(sentRows);
        setReceived(receivedRows);
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
  }, []);

  const empty =
    !loading && !error && sent.length === 0 && received.length === 0;

  return (
    <ProfilePageShell title="Solicitudes" backHref="/adopta">
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
      ) : null}

      {error ? (
        <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {empty ? (
        <ProfileEmptyState
          title="Sin solicitudes por ahora"
          description="Cuando envíes o recibas solicitudes de adopción, aparecerán aquí. El teléfono del publicador solo se revela al solicitar adoptar."
          ctaLabel="Ver adopciones"
          ctaHref="/adopta"
        />
      ) : null}

      {!loading && received.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-[0.95rem] text-[#555] [font-weight:800]">
            Recibidas
          </h2>
          <ul className="space-y-2">
            {received.map((item) => (
              <li
                key={item.id}
                className="rounded-[14px] border border-[#ececec] bg-white px-4 py-3"
              >
                <p className="text-[0.9rem] text-[#4a4a4a] [font-weight:700]">
                  {item.requesterName ?? "Interesado"}
                  {item.petName ? ` · ${item.petName}` : ""}
                </p>
                {item.requesterPhone ? (
                  <a
                    href={`tel:${item.requesterPhone}`}
                    className="mt-1 inline-block text-[0.82rem] text-[var(--color-primary)] [font-weight:600]"
                  >
                    {item.requesterPhone}
                  </a>
                ) : null}
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
                <p className="text-[0.9rem] text-[#4a4a4a] [font-weight:700]">
                  Solicitud enviada
                  {item.petName ? ` · ${item.petName}` : ""}
                </p>
                {item.contactPhone ? (
                  <a
                    href={`tel:${item.contactPhone}`}
                    className="mt-1 inline-block text-[0.82rem] text-[var(--color-primary)] [font-weight:600]"
                  >
                    Contacto: {item.contactPhone}
                  </a>
                ) : null}
                <div className="mt-2">
                  <Link
                    href="/adopta"
                    className="text-[0.78rem] text-[var(--color-text-muted)] underline"
                  >
                    Ver adopciones
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ProfilePageShell>
  );
}
