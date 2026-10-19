"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  APPEAL_STATUS_LABELS,
  formatAdminDate,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminAppeals,
  mediaUrl,
  resolveAdminAppeal,
  type ModerationAppeal,
} from "@/lib/api";

const FILTERS = [
  { id: "pending", label: "Pendientes" },
  { id: "accepted", label: "Aceptadas" },
  { id: "rejected", label: "Rechazadas" },
  { id: "", label: "Todas" },
] as const;

export function AdminAppealsScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status") ?? "pending";
  const [items, setItems] = useState<ModerationAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    appeal: ModerationAppeal;
    action: "accept" | "reject";
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAdminAppeals(
        status
          ? (status as "pending" | "accepted" | "rejected")
          : undefined,
      );
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las apelaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(
    appeal: ModerationAppeal,
    action: "accept" | "reject",
    response: string,
  ) {
    setBusyId(appeal.id);
    setError("");
    try {
      await resolveAdminAppeal(appeal.id, action, response || undefined);
      setPending(null);
      setSuccess(
        action === "accept"
          ? `Apelación de “${appeal.petName}” aceptada. Publicación restaurada.`
          : `Apelación de “${appeal.petName}” rechazada.`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo resolver.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[1.25rem] text-[#222] [font-weight:800]">
          Apelaciones
        </h1>
        <p className="mt-0.5 text-[0.82rem] text-[#777]">
          Revisa los argumentos del usuario. Aceptar restaura la publicación.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = status === f.id;
          return (
            <button
              key={f.id || "all"}
              type="button"
              onClick={() => {
                setSuccess("");
                router.replace(
                  f.id ? `/admin/apelaciones?status=${f.id}` : "/admin/apelaciones",
                );
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
          No hay apelaciones en este filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((row) => {
            const photo = mediaUrl(row.petPhotoUrl);
            return (
              <article
                key={row.id}
                className="rounded-xl border border-[#ececec] bg-white p-3.5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f0f0f0]">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[0.95rem] [font-weight:800]">
                        {row.petName ?? "Publicación"}
                      </h2>
                      <StatusBadge
                        kind="report"
                        value={row.status}
                        label={
                          APPEAL_STATUS_LABELS[row.status] ?? row.status
                        }
                      />
                    </div>
                    <p className="text-[0.8rem] text-[#777]">
                      De{" "}
                      <Link
                        href={`/admin/usuarios/${row.userId}`}
                        className="text-[var(--color-primary)] [font-weight:700]"
                      >
                        {row.userName ?? "Usuario"}
                      </Link>{" "}
                      · {formatAdminDate(row.createdAt)}
                    </p>
                    <p className="rounded-lg bg-[#fafafa] px-3 py-2 text-[0.85rem] text-[#444]">
                      {row.message}
                    </p>
                    {row.adminResponse && row.status !== "pending" ? (
                      <p className="text-[0.8rem] text-[#666]">
                        Respuesta: {row.adminResponse}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Link
                        href={`/admin/moderacion/${row.petId}`}
                        className="rounded-md border border-[#e4e4e4] px-2 py-0.5 text-[0.7rem] [font-weight:700]"
                      >
                        Ver pub
                      </Link>
                      {row.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() =>
                              setPending({ appeal: row, action: "accept" })
                            }
                            className="rounded-md bg-emerald-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                          >
                            Aceptar
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() =>
                              setPending({ appeal: row, action: "reject" })
                            }
                            className="rounded-md bg-red-600 px-2 py-0.5 text-[0.7rem] text-white [font-weight:700] disabled:opacity-60"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AdminActionModal
        open={Boolean(pending)}
        title={
          pending?.action === "accept"
            ? "Aceptar apelación"
            : "Rechazar apelación"
        }
        description={
          pending?.action === "accept"
            ? "La publicación se restaurará y el usuario será notificado."
            : "El usuario recibirá tu respuesta. La publicación seguirá oculta/eliminada."
        }
        confirmLabel={
          pending?.action === "accept" ? "Aceptar y restaurar" : "Rechazar"
        }
        danger={pending?.action === "reject"}
        reasonRequired={pending?.action === "reject"}
        reasonLabel="Mensaje para el usuario"
        reasonPlaceholder={
          pending?.action === "accept"
            ? "Nota opcional…"
            : "Explica por qué se mantiene la decisión…"
        }
        busy={Boolean(pending && busyId === pending.appeal.id)}
        onCancel={() => setPending(null)}
        onConfirm={({ reason }) => {
          if (pending) {
            void resolve(pending.appeal, pending.action, reason);
          }
        }}
      />
    </div>
  );
}
