"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfilePageShell } from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  bulkFoundationPetStatus,
  getFoundationPanel,
  mediaUrl,
  type FoundationPanel,
} from "@/lib/api";
import { petPath } from "@/lib/seo-urls";

export function FoundationPanelScreen({
  foundationId,
}: {
  foundationId: string;
}) {
  const [panel, setPanel] = useState<FoundationPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await getFoundationPanel(foundationId);
    setPanel(data);
    setSelected(new Set());
  }, [foundationId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar el panel.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!panel) return;
    if (selected.size === panel.pets.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(panel.pets.map((p) => p.id)));
  }

  async function applyBulk(status: "published" | "closed") {
    if (selected.size === 0) {
      setError("Selecciona al menos una mascota.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await bulkFoundationPetStatus(
        foundationId,
        [...selected],
        status,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo aplicar la acción.",
      );
    } finally {
      setBusy(false);
    }
  }

  const kpis = panel?.kpis;

  return (
    <ProfilePageShell
      title="Panel fundación"
      backHref="/perfil/fundaciones"
    >
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">
          Cargando…
        </p>
      ) : null}

      {error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
          {error}
        </p>
      ) : null}

      {panel ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[1.05rem] text-[#333] [font-weight:800]">
                {panel.foundation.name}
              </p>
              <p className="text-[0.8rem] text-[#888]">
                Gestión de publicaciones y equipo
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/perfil/fundaciones/${foundationId}/miembros`}
                className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.75rem] text-[#555] [font-weight:700]"
              >
                Miembros
              </Link>
              <Link
                href={`/perfil/fundaciones/${foundationId}/editar`}
                className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.75rem] text-[#555] [font-weight:700]"
              >
                Editar datos
              </Link>
              <Link
                href="/adopta/nueva"
                className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[0.75rem] text-white [font-weight:800]"
              >
                Publicar
              </Link>
            </div>
          </div>

          {kpis ? (
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Publicadas", value: kpis.petsPublished },
                { label: "Cerradas", value: kpis.petsClosed },
                { label: "Total pubs", value: kpis.petsTotal },
                {
                  label: "Solicitudes",
                  value: kpis.pendingAdoptionRequests,
                },
                { label: "Miembros", value: kpis.membersActive },
                { label: "Pendientes", value: kpis.membersPending },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[12px] border border-[#ececec] bg-white px-3 py-2.5"
                >
                  <p className="text-[1.25rem] text-[#333] [font-weight:800]">
                    {item.value}
                  </p>
                  <p className="text-[0.7rem] text-[#888] [font-weight:600]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.75rem] text-[#555] [font-weight:700]"
            >
              {selected.size === panel.pets.length && panel.pets.length > 0
                ? "Quitar selección"
                : "Seleccionar todas"}
            </button>
            <button
              type="button"
              disabled={busy || selected.size === 0}
              onClick={() => void applyBulk("closed")}
              className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[0.75rem] text-white [font-weight:800] disabled:opacity-50"
            >
              Marcar adoptadas/cerradas ({selected.size})
            </button>
            <button
              type="button"
              disabled={busy || selected.size === 0}
              onClick={() => void applyBulk("published")}
              className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.75rem] text-[#555] [font-weight:700] disabled:opacity-50"
            >
              Reabrir
            </button>
            <Link
              href="/adopta/solicitudes"
              className="ml-auto text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
            >
              Ver solicitudes →
            </Link>
          </div>

          {panel.pets.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-[#ddd] bg-white p-8 text-center text-[0.85rem] text-[#888]">
              Aún no hay mascotas publicadas a nombre de esta fundación.
            </p>
          ) : (
            <ul className="space-y-2">
              {panel.pets.map((pet) => {
                const photo = mediaUrl(pet.photoUrl);
                const checked = selected.has(pet.id);
                return (
                  <li
                    key={pet.id}
                    className="flex items-center gap-3 rounded-[14px] border border-[#ececec] bg-white px-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(pet.id)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      aria-label={`Seleccionar ${pet.name}`}
                    />
                    <Link
                      href={petPath({ id: pet.id, name: pet.name })}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#f0f0f0]">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.9rem] text-[#333] [font-weight:800]">
                          {pet.name}
                        </span>
                        <span className="text-[0.72rem] text-[#888]">
                          {pet.species === "cat" ? "Gato" : "Perro"} ·{" "}
                          {pet.status === "published"
                            ? "Publicada"
                            : "Cerrada"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </ProfilePageShell>
  );
}
