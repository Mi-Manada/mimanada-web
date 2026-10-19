"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatAdminDate,
  MODERATION_STATUS_LABELS,
  PET_STATUS_LABELS,
} from "@/components/admin/labels";
import {
  ApiError,
  flagAdminPet,
  getAdminPets,
  mediaUrl,
  setAdminPetPublicationStatus,
  type AdminPet,
  type PetStatus,
} from "@/lib/api";

type PendingAction =
  | { type: "close" | "reopen"; pet: AdminPet }
  | { type: "flag"; pet: AdminPet };

export function AdminPublicationsScreen() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAdminPets(query || undefined);
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las publicaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyPublicationStatus(
    pet: AdminPet,
    status: PetStatus,
    reason: string,
  ) {
    setBusyId(pet.id);
    setError("");
    try {
      await setAdminPetPublicationStatus(pet.id, status, reason || undefined);
      setPending(null);
      setSuccess(
        status === "closed"
          ? `“${pet.name}” cerrada.`
          : `“${pet.name}” reabierta.`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo actualizar.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function applyFlag(pet: AdminPet, reason: string) {
    setBusyId(pet.id);
    setError("");
    try {
      await flagAdminPet(pet.id, reason || undefined);
      setPending(null);
      setSuccess(`“${pet.name}” marcada para revisión en Moderación.`);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo marcar.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">
          Publicaciones
        </h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Todas las publicaciones. Cierra, reabre o envía a la cola de
          moderación.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, dueño o correo"
          className="h-11 min-w-[16rem] flex-1 rounded-full border border-[#e4e4e4] bg-white px-4 text-[0.9rem] outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="h-11 rounded-full bg-[var(--color-primary)] px-5 text-[0.9rem] text-white [font-weight:700]"
        >
          Buscar
        </button>
      </form>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.88rem] text-emerald-800 [font-weight:600]">
          {success}
        </div>
      ) : null}
      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[#666]">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-10 text-center text-[#888]">
          No hay publicaciones.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#ececec] bg-white shadow-sm">
          <table className="min-w-full text-left text-[0.85rem]">
            <thead className="border-b border-[#ececec] bg-[#fafafa] text-[0.75rem] uppercase tracking-wide text-[#888]">
              <tr>
                <th className="px-4 py-3 [font-weight:700]">Publicación</th>
                <th className="px-4 py-3 [font-weight:700]">Dueño</th>
                <th className="px-4 py-3 [font-weight:700]">Estado</th>
                <th className="px-4 py-3 [font-weight:700]">Moderación</th>
                <th className="px-4 py-3 [font-weight:700]">Actualizada</th>
                <th className="px-4 py-3 [font-weight:700]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((pet) => {
                const photo = mediaUrl(pet.photoUrls[0]);
                return (
                  <tr key={pet.id} className="border-b border-[#f3f3f3]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#eee]">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate [font-weight:700]">{pet.name}</p>
                          <p className="text-[0.75rem] text-[#999]">
                            Reportes: {pet.reportCount}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/usuarios/${pet.ownerId}`}
                        className="text-[var(--color-primary)] [font-weight:700]"
                      >
                        {pet.ownerName ?? "Usuario"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        kind="account"
                        value={pet.status}
                        label={PET_STATUS_LABELS[pet.status] ?? pet.status}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        kind="moderation"
                        value={pet.moderationStatus}
                        label={
                          MODERATION_STATUS_LABELS[pet.moderationStatus] ??
                          pet.moderationStatus
                        }
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#777]">
                      {formatAdminDate(pet.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/admin/moderacion/${pet.id}`}
                          className="rounded-full border border-[#e4e4e4] px-2.5 py-1 text-[0.72rem] [font-weight:700]"
                        >
                          Ver
                        </Link>
                        {pet.status === "published" ? (
                          <button
                            type="button"
                            disabled={busyId === pet.id}
                            onClick={() =>
                              setPending({ type: "close", pet })
                            }
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-[0.72rem] text-slate-700 [font-weight:700]"
                          >
                            Cerrar
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === pet.id}
                            onClick={() =>
                              setPending({ type: "reopen", pet })
                            }
                            className="rounded-full border border-emerald-200 px-2.5 py-1 text-[0.72rem] text-emerald-700 [font-weight:700]"
                          >
                            Reabrir
                          </button>
                        )}
                        {pet.moderationStatus !== "needs_review" ? (
                          <button
                            type="button"
                            disabled={busyId === pet.id}
                            onClick={() =>
                              setPending({ type: "flag", pet })
                            }
                            className="rounded-full border border-amber-200 px-2.5 py-1 text-[0.72rem] text-amber-800 [font-weight:700]"
                          >
                            A moderación
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminActionModal
        open={Boolean(pending)}
        title={
          pending?.type === "close"
            ? `Cerrar “${pending.pet.name}”`
            : pending?.type === "reopen"
              ? `Reabrir “${pending.pet.name}”`
              : pending
                ? `Enviar “${pending.pet.name}” a moderación`
                : ""
        }
        description={
          pending?.type === "flag"
            ? "Entrará en la cola de Pendientes para revisión de contenido."
            : pending?.type === "close"
              ? "Dejará de mostrarse como disponible. Puedes dejar una nota."
              : "Volverá a estado publicada."
        }
        confirmLabel={
          pending?.type === "close"
            ? "Cerrar"
            : pending?.type === "reopen"
              ? "Reabrir"
              : "Marcar"
        }
        reasonRequired={false}
        reasonLabel="Nota interna"
        busy={Boolean(pending && busyId === pending.pet.id)}
        onCancel={() => setPending(null)}
        onConfirm={({ reason }) => {
          if (!pending) return;
          if (pending.type === "flag") {
            void applyFlag(pending.pet, reason);
          } else {
            void applyPublicationStatus(
              pending.pet,
              pending.type === "close" ? "closed" : "published",
              reason,
            );
          }
        }}
      />
    </div>
  );
}
