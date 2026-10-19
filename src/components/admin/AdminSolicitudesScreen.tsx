"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ADOPTION_STATUS_LABELS,
  formatAdminDate,
} from "@/components/admin/labels";
import {
  ApiError,
  closeAdminAdoptionRequest,
  getAdminAdoptionRequests,
  mediaUrl,
  type AdminAdoptionRequest,
} from "@/lib/api";

const FILTERS = [
  { id: "", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "accepted", label: "Aceptadas" },
  { id: "rejected", label: "Rechazadas" },
  { id: "closed", label: "Cerradas" },
] as const;

export function AdminSolicitudesScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status") ?? "";
  const [items, setItems] = useState<AdminAdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<AdminAdoptionRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAdminAdoptionRequests(
        status
          ? (status as "pending" | "accepted" | "rejected" | "closed")
          : undefined,
      );
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las solicitudes.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function closeRequest(row: AdminAdoptionRequest, reason: string) {
    setBusyId(row.id);
    setError("");
    try {
      await closeAdminAdoptionRequest(row.id, reason || undefined);
      setPending(null);
      setSuccess(`Solicitud de “${row.petName ?? "mascota"}” cerrada.`);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo cerrar.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">
          Solicitudes de adopción
        </h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Vista global de solicitudes. Puedes cerrarlas como administrador si
          hace falta.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.id;
          return (
            <button
              key={f.id || "all"}
              type="button"
              onClick={() => {
                setSuccess("");
                router.replace(
                  f.id
                    ? `/admin/solicitudes?status=${f.id}`
                    : "/admin/solicitudes",
                );
              }}
              className={`rounded-full px-3.5 py-1.5 text-[0.8rem] [font-weight:700] ${
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
          No hay solicitudes en este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((row) => {
            const photo = mediaUrl(row.petPhotoUrl);
            return (
              <article
                key={row.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm sm:flex-row sm:items-start"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[1rem] [font-weight:800]">
                      {row.petName ?? "Mascota"}
                    </h2>
                    <StatusBadge
                      kind="report"
                      value={row.status}
                      label={
                        ADOPTION_STATUS_LABELS[row.status] ?? row.status
                      }
                    />
                  </div>
                  <p className="text-[0.82rem] text-[#777]">
                    Solicitante:{" "}
                    <Link
                      href={`/admin/usuarios/${row.requesterId}`}
                      className="text-[var(--color-primary)] [font-weight:700]"
                    >
                      {row.requesterName ?? "Usuario"}
                    </Link>
                    {" · "}
                    Dueño:{" "}
                    <Link
                      href={`/admin/usuarios/${row.ownerId}`}
                      className="text-[var(--color-primary)] [font-weight:700]"
                    >
                      {row.ownerName ?? "Usuario"}
                    </Link>
                  </p>
                  <p className="text-[0.78rem] text-[#999]">
                    {formatAdminDate(row.createdAt)}
                  </p>
                  {row.message ? (
                    <p className="rounded-xl bg-[#fafafa] px-3 py-2 text-[0.85rem] text-[#555]">
                      {row.message}
                    </p>
                  ) : null}
                  {row.responseMessage ? (
                    <p className="text-[0.82rem] text-[#666]">
                      Respuesta: {row.responseMessage}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/admin/moderacion/${row.petId}`}
                      className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.78rem] [font-weight:700]"
                    >
                      Ver publicación
                    </Link>
                    {row.status !== "closed" ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => setPending(row)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-[0.78rem] text-red-700 [font-weight:700] disabled:opacity-60"
                      >
                        Cerrar
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AdminActionModal
        open={Boolean(pending)}
        title="Cerrar solicitud"
        description="La solicitud quedará cerrada. Puedes dejar un motivo opcional."
        confirmLabel="Cerrar solicitud"
        danger
        reasonRequired={false}
        reasonLabel="Motivo / nota"
        busy={Boolean(pending && busyId === pending.id)}
        onCancel={() => setPending(null)}
        onConfirm={({ reason }) => {
          if (pending) void closeRequest(pending, reason);
        }}
      />
    </div>
  );
}
