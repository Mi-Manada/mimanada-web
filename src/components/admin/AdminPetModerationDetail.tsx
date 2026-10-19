"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { CONTENT_POLICY_PRESETS } from "@/components/admin/policy-presets";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ACTION_LABELS,
  formatAdminDate,
  MODERATION_STATUS_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminPetDetail,
  mediaUrl,
  setAdminPetStatus,
  type AdminPetDetail,
  type PetModerationStatus,
} from "@/lib/api";

type PendingAction = {
  status: PetModerationStatus;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  reasonRequired: boolean;
  usePresets?: boolean;
};

export function AdminPetModerationDetail({ petId }: { petId: string }) {
  const [data, setData] = useState<AdminPetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminPetDetail(petId);
      setData(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo cargar el detalle.",
      );
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function apply(
    status: PetModerationStatus,
    reason: string,
    policyCode: string | null,
  ) {
    setBusy(true);
    setError("");
    try {
      const res = await setAdminPetStatus(
        petId,
        status,
        reason || undefined,
        policyCode,
      );
      setData(res);
      setPending(null);
      const labels: Partial<Record<PetModerationStatus, string>> = {
        active: "Publicación aprobada/restaurada. El dueño fue notificado.",
        hidden: "Publicación ocultada. El dueño recibió tu mensaje.",
        deleted: "Publicación eliminada. El dueño recibió tu mensaje.",
        blocked: "Publicación bloqueada. El dueño recibió tu mensaje.",
      };
      setSuccess(labels[status] ?? "Acción aplicada.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo actualizar.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-[#666]">Cargando…</p>;
  if (error && !data) {
    return <p className="text-[var(--color-primary)]">{error}</p>;
  }
  if (!data) return null;

  const { pet, petFull, reports, history } = data;
  const photo = mediaUrl(pet.photoUrls[0]);
  const canRestore =
    pet.moderationStatus === "hidden" ||
    pet.moderationStatus === "deleted" ||
    pet.moderationStatus === "blocked";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/moderacion"
          className="text-[0.85rem] text-[var(--color-primary)] [font-weight:700]"
        >
          ← Moderación
        </Link>
        <StatusBadge
          kind="moderation"
          value={pet.moderationStatus}
          label={
            MODERATION_STATUS_LABELS[pet.moderationStatus] ?? pet.moderationStatus
          }
        />
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.88rem] text-emerald-800 [font-weight:600]">
          {success}
        </div>
      ) : null}
      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm">
          <div className="aspect-[4/3] bg-[#f0f0f0]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={pet.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
            <h1 className="text-[1.35rem] text-[#222] [font-weight:800]">
              {pet.name}
            </h1>
            <p className="mt-1 text-[0.85rem] text-[#777]">
              Publicado {formatAdminDate(pet.createdAt)}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[0.9rem] text-[#555]">
              {pet.description || "Sin descripción"}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-[0.82rem]">
              <div>
                <dt className="text-[#999]">Raza</dt>
                <dd className="[font-weight:700]">{petFull.breed || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#999]">Reportes</dt>
                <dd className="[font-weight:700]">{pet.reportCount}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
            <h2 className="text-[0.95rem] [font-weight:800]">Publicador</h2>
            <p className="mt-2 text-[0.9rem] text-[#333] [font-weight:700]">
              {pet.ownerName}
            </p>
            <p className="text-[0.8rem] text-[#777]">{pet.ownerEmail}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/usuarios/${pet.ownerId}`}
                className="text-[0.85rem] text-[var(--color-primary)] [font-weight:700]"
              >
                Ir al perfil
              </Link>
              <Link
                href={`/admin/usuarios/${pet.ownerId}`}
                className="text-[0.85rem] text-red-700 [font-weight:700]"
              >
                Moderar usuario
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setPending({
                  status: "active",
                  title: canRestore ? "Restaurar publicación" : "Aprobar publicación",
                  description: canRestore
                    ? "Volverá a ser visible. Puedes dejar una nota opcional."
                    : "Quedará visible en Adopta. Nota opcional para el dueño.",
                  confirmLabel: canRestore ? "Restaurar" : "Aprobar",
                  reasonRequired: false,
                })
              }
              className="rounded-full bg-emerald-600 px-4 py-2 text-[0.85rem] text-white [font-weight:700] disabled:opacity-60"
            >
              {canRestore ? "Restaurar" : "Aprobar"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setPending({
                  status: "hidden",
                  title: "Ocultar publicación",
                  description:
                    "Usa un atajo (p. ej. No es una mascota). El dueño recibe el mensaje.",
                  confirmLabel: "Ocultar",
                  reasonRequired: true,
                  usePresets: true,
                })
              }
              className="rounded-full bg-slate-600 px-4 py-2 text-[0.85rem] text-white [font-weight:700] disabled:opacity-60"
            >
              Ocultar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setPending({
                  status: "deleted",
                  title: "Eliminar publicación",
                  description:
                    "Soft delete. Elige política o escribe el motivo; el dueño lo recibe.",
                  confirmLabel: "Eliminar",
                  danger: true,
                  reasonRequired: true,
                  usePresets: true,
                })
              }
              className="rounded-full bg-red-600 px-4 py-2 text-[0.85rem] text-white [font-weight:700] disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <h2 className="text-[1rem] [font-weight:800]">Reportes recibidos</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-[0.85rem] text-[#888]">Sin reportes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f0f0f0]">
            {reports.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.9rem] [font-weight:700]">
                    {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                  </span>
                  <StatusBadge
                    kind="report"
                    value={r.status}
                    label={REPORT_STATUS_LABELS[r.status] ?? r.status}
                  />
                </div>
                <p className="mt-1 text-[0.8rem] text-[#777]">
                  {r.reporterName} · {formatAdminDate(r.createdAt)}
                </p>
                {r.details ? (
                  <p className="mt-1 text-[0.85rem] text-[#555]">{r.details}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <h2 className="text-[1rem] [font-weight:800]">
          Historial administrativo
        </h2>
        {history.length === 0 ? (
          <p className="mt-3 text-[0.85rem] text-[#888]">Sin acciones aún.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f0f0f0]">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between gap-3 py-3">
                <div>
                  <p className="text-[0.9rem] [font-weight:700]">
                    {ACTION_LABELS[h.action] ?? h.action}
                  </p>
                  <p className="text-[0.8rem] text-[#777]">
                    {h.adminName}
                    {h.reason ? ` · ${h.reason}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[0.75rem] text-[#999]">
                  {formatAdminDate(h.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdminActionModal
        open={Boolean(pending)}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel}
        danger={pending?.danger}
        reasonRequired={pending?.reasonRequired}
        reasonLabel="Mensaje para el publicador"
        presets={
          pending?.usePresets
            ? CONTENT_POLICY_PRESETS.map((p) => ({ ...p }))
            : undefined
        }
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={({ reason, policyCode }) => {
          if (pending) void apply(pending.status, reason, policyCode);
        }}
      />
    </div>
  );
}
