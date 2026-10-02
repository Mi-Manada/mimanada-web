"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
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

export function AdminPetModerationDetail({ petId }: { petId: string }) {
  const [data, setData] = useState<AdminPetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{
    status: PetModerationStatus;
    title: string;
    message: string;
  } | null>(null);

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

  async function apply(status: PetModerationStatus) {
    setBusy(true);
    try {
      const res = await setAdminPetStatus(petId, status);
      setData(res);
      setConfirm(null);
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
          {pet.photoUrls.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto p-3">
              {pet.photoUrls.map((url) => {
                const src = mediaUrl(url);
                return src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={src}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : null;
              })}
            </div>
          ) : null}
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
                <dt className="text-[#999]">Sexo</dt>
                <dd className="[font-weight:700]">{petFull.sex}</dd>
              </div>
              <div>
                <dt className="text-[#999]">Tamaño</dt>
                <dd className="[font-weight:700]">{petFull.size}</dd>
              </div>
              <div>
                <dt className="text-[#999]">Reportes</dt>
                <dd className="[font-weight:700]">{pet.reportCount}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.8rem] text-[#888]">
              Moderación automática: {pet.moderationScanStatus}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
            <h2 className="text-[0.95rem] [font-weight:800]">Publicador</h2>
            <p className="mt-2 text-[0.9rem] text-[#333] [font-weight:700]">
              {pet.ownerName}
            </p>
            <p className="text-[0.8rem] text-[#777]">{pet.ownerEmail}</p>
            <Link
              href={`/usuarios/${pet.ownerId}`}
              className="mt-3 inline-block text-[0.85rem] text-[var(--color-primary)] [font-weight:700]"
            >
              Ir al perfil
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void apply("active")}
              className="rounded-full bg-emerald-600 px-4 py-2 text-[0.85rem] text-white [font-weight:700] disabled:opacity-60"
            >
              Aprobar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void apply("hidden")}
              className="rounded-full bg-slate-600 px-4 py-2 text-[0.85rem] text-white [font-weight:700] disabled:opacity-60"
            >
              Ocultar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  status: "deleted",
                  title: "Eliminar publicación",
                  message: "La publicación se marcará como eliminada (soft delete).",
                })
              }
              className="rounded-full bg-red-600 px-4 py-2 text-[0.85rem] text-white [font-weight:700] disabled:opacity-60"
            >
              Eliminar
            </button>
            {canRestore ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void apply("active")}
                className="rounded-full border border-emerald-600 px-4 py-2 text-[0.85rem] text-emerald-700 [font-weight:700] disabled:opacity-60"
              >
                Restaurar
              </button>
            ) : null}
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

      <ConfirmationModal
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void apply(confirm.status);
        }}
      />
    </div>
  );
}
