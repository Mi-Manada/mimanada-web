"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { CONTENT_POLICY_PRESETS } from "@/components/admin/policy-presets";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatAdminDate,
  MODERATION_STATUS_LABELS,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminModerationPets,
  mediaUrl,
  setAdminPetStatus,
  type AdminPet,
  type PetModerationStatus,
} from "@/lib/api";

const FILTERS = [
  { id: "pending", label: "Pendientes" },
  { id: "reported", label: "Reportadas" },
  { id: "all", label: "Todas" },
  { id: "approved", label: "Aprobadas" },
  { id: "hidden", label: "Ocultas" },
  { id: "deleted", label: "Eliminadas" },
];

type PendingAction = {
  pet: AdminPet;
  status: PetModerationStatus;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  reasonRequired: boolean;
  usePresets?: boolean;
};

export function AdminModerationScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter") ?? "pending";
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
      const rows = await getAdminModerationPets(filter);
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo cargar la cola.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function askAction(action: PendingAction) {
    setSuccess("");
    setPending(action);
  }

  async function applyStatus(
    pet: AdminPet,
    status: PetModerationStatus,
    reason: string,
    policyCode: string | null,
  ) {
    setBusyId(pet.id);
    setError("");
    try {
      await setAdminPetStatus(
        pet.id,
        status,
        reason || undefined,
        policyCode,
      );
      setPending(null);
      const labels: Partial<Record<PetModerationStatus, string>> = {
        active: `“${pet.name}” aprobada. Ya es visible públicamente y salió de Pendientes.`,
        hidden: `“${pet.name}” ocultada. El dueño recibió el motivo.`,
        deleted: `“${pet.name}” eliminada. El dueño recibió el motivo.`,
        blocked: `“${pet.name}” bloqueada. El dueño recibió el motivo.`,
      };
      setSuccess(labels[status] ?? "Acción aplicada.");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.25rem] text-[#222] [font-weight:800]">
            Cola de moderación
          </h1>
          <p className="mt-0.5 text-[0.82rem] text-[#777]">
            Ordenadas por prioridad (más reportes primero). Abre el detalle si
            necesitas la imagen grande.
          </p>
        </div>
        {!loading && items.length > 0 ? (
          <p className="text-[0.78rem] text-[#888] [font-weight:600]">
            {items.length} en este filtro
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setSuccess("");
                router.replace(`/admin/moderacion?filter=${f.id}`);
              }}
              className={`rounded-full px-3 py-1 text-[0.75rem] [font-weight:700] ${
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[#e4e4e4] bg-white text-[#555]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[0.82rem] text-emerald-800 [font-weight:600]">
          {success}
        </div>
      ) : null}

      {error ? (
        <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[0.9rem] text-[#666]">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ddd] bg-white p-8 text-center text-[0.9rem] text-[#888]">
          No hay publicaciones en este filtro.
          {filter === "pending" ? (
            <p className="mt-1 text-[0.8rem]">
              Aparecen por reportes o revisión manual.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#ececec] bg-white">
          <table className="min-w-full text-left text-[0.82rem]">
            <thead className="border-b border-[#ececec] bg-[#fafafa] text-[0.7rem] uppercase tracking-wide text-[#888]">
              <tr>
                <th className="px-3 py-2 [font-weight:700]">Pub</th>
                <th className="px-3 py-2 [font-weight:700]">Dueño</th>
                <th className="px-3 py-2 [font-weight:700]">Motivo</th>
                <th className="px-3 py-2 [font-weight:700]">Estado</th>
                <th className="px-3 py-2 [font-weight:700]">Fecha</th>
                <th className="px-3 py-2 [font-weight:700]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((pet) => {
                const photo = mediaUrl(pet.photoUrls[0]);
                const busy = busyId === pet.id;
                return (
                  <tr
                    key={pet.id}
                    className="border-b border-[#f3f3f3] hover:bg-[#fafafa]"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/moderacion/${pet.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#eee]">
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
                          <p className="truncate text-[#222] [font-weight:700]">
                            {pet.name}
                          </p>
                          <p className="truncate text-[0.72rem] text-[#999]">
                            {pet.reportCount} reporte
                            {pet.reportCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/usuarios/${pet.ownerId}`}
                        className="text-[var(--color-primary)] [font-weight:600] hover:underline"
                      >
                        {pet.ownerName ?? "Usuario"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[#666]">
                      {pet.queueReason ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        kind="moderation"
                        value={pet.moderationStatus}
                        label={
                          MODERATION_STATUS_LABELS[pet.moderationStatus] ??
                          pet.moderationStatus
                        }
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[#777]">
                      {formatAdminDate(pet.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          href={`/admin/moderacion/${pet.id}`}
                          className="rounded-md border border-[#e4e4e4] px-2 py-0.5 text-[0.7rem] text-[#444] [font-weight:700]"
                        >
                          Ver
                        </Link>
                        {pet.moderationStatus === "hidden" ||
                        pet.moderationStatus === "deleted" ||
                        pet.moderationStatus === "blocked" ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                askAction({
                                  pet,
                                  status: "active",
                                  title: "Mostrar publicación",
                                  description:
                                    "Volverá a ser visible en Adopta.",
                                  confirmLabel: "Mostrar",
                                  reasonRequired: false,
                                })
                              }
                              className="rounded-md bg-emerald-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                            >
                              Mostrar
                            </button>
                            {pet.moderationStatus !== "deleted" &&
                            pet.moderationStatus !== "blocked" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  askAction({
                                    pet,
                                    status: "deleted",
                                    title: "Eliminar publicación",
                                    description:
                                      "Soft delete. Elige un motivo; el dueño lo recibe.",
                                    confirmLabel: "Eliminar",
                                    danger: true,
                                    reasonRequired: true,
                                    usePresets: true,
                                  })
                                }
                                className="rounded-md bg-red-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                              >
                                Eliminar
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                askAction({
                                  pet,
                                  status: "active",
                                  title: "Aprobar publicación",
                                  description:
                                    "Volverá a ser visible en Adopta y saldrá de Pendientes.",
                                  confirmLabel: "Aprobar",
                                  reasonRequired: false,
                                })
                              }
                              className="rounded-md bg-emerald-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                askAction({
                                  pet,
                                  status: "hidden",
                                  title: "Ocultar publicación",
                                  description:
                                    "Usa un atajo de política o escribe el motivo.",
                                  confirmLabel: "Ocultar",
                                  reasonRequired: true,
                                  usePresets: true,
                                })
                              }
                              className="rounded-md bg-slate-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                            >
                              Ocultar
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                askAction({
                                  pet,
                                  status: "deleted",
                                  title: "Eliminar publicación",
                                  description:
                                    "Soft delete. Elige “No es una mascota” u otro motivo.",
                                  confirmLabel: "Eliminar",
                                  danger: true,
                                  reasonRequired: true,
                                  usePresets: true,
                                })
                              }
                              className="rounded-md bg-red-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
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
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel}
        danger={pending?.danger}
        reasonRequired={pending?.reasonRequired}
        reasonLabel="Mensaje para el publicador"
        reasonPlaceholder={
          pending?.reasonRequired
            ? "Elige un atajo o escribe el motivo…"
            : "Nota opcional para el publicador"
        }
        presets={
          pending?.usePresets
            ? CONTENT_POLICY_PRESETS.map((p) => ({ ...p }))
            : undefined
        }
        busy={Boolean(pending && busyId === pending.pet.id)}
        onCancel={() => setPending(null)}
        onConfirm={({ reason, policyCode }) => {
          if (pending) {
            void applyStatus(
              pending.pet,
              pending.status,
              reason,
              policyCode,
            );
          }
        }}
      />
    </div>
  );
}
