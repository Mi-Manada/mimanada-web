"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ACCOUNT_STATUS_LABELS,
  formatAdminDate,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminUsers,
  mediaUrl,
  moderateAdminUser,
  type AdminUserRow,
} from "@/lib/api";

type PendingAction =
  | { type: "warn" | "ban" | "reactivate"; user: AdminUserRow }
  | { type: "suspend"; user: AdminUserRow; days: number | null };

export function AdminUsersScreen() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [suspendUser, setSuspendUser] = useState<AdminUserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers(query || undefined);
      setRows(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudieron cargar usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: PendingAction) {
    setBusyId(action.user.id);
    try {
      await moderateAdminUser(
        action.user.id,
        action.type,
        action.type === "suspend" ? { days: action.days } : undefined,
      );
      setPending(null);
      setSuspendUser(null);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo moderar al usuario.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">Usuarios</h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Consulta y modera cuentas de la plataforma.
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
          placeholder="Buscar por nombre o correo"
          className="h-11 min-w-[16rem] flex-1 rounded-full border border-[#e4e4e4] bg-white px-4 text-[0.9rem] outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="h-11 rounded-full bg-[var(--color-primary)] px-5 text-[0.9rem] text-white [font-weight:700]"
        >
          Buscar
        </button>
      </form>

      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[#666]">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-10 text-center text-[#888]">
          No se encontraron usuarios.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#ececec] bg-white shadow-sm">
          <table className="min-w-full text-left text-[0.85rem]">
            <thead className="border-b border-[#ececec] bg-[#fafafa] text-[0.75rem] uppercase tracking-wide text-[#888]">
              <tr>
                <th className="px-4 py-3 [font-weight:700]">Usuario</th>
                <th className="px-4 py-3 [font-weight:700]">Registro</th>
                <th className="px-4 py-3 [font-weight:700]">Pubs</th>
                <th className="px-4 py-3 [font-weight:700]">Reportes</th>
                <th className="px-4 py-3 [font-weight:700]">Eliminadas</th>
                <th className="px-4 py-3 [font-weight:700]">Estado</th>
                <th className="px-4 py-3 [font-weight:700]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const photo = mediaUrl(u.profilePhotoUrl);
                const highlight = focus === u.id;
                return (
                  <tr
                    key={u.id}
                    id={`user-${u.id}`}
                    className={`border-b border-[#f3f3f3] ${
                      highlight ? "bg-[var(--color-primary)]/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#eee] text-[#888]">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            u.fullName.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="[font-weight:700]">{u.fullName}</p>
                          <p className="text-[0.75rem] text-[#999]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#777]">
                      {formatAdminDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">{u.publications}</td>
                    <td className="px-4 py-3">{u.reportsReceived}</td>
                    <td className="px-4 py-3">{u.deletedContent}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        kind="account"
                        value={u.accountStatus}
                        label={
                          ACCOUNT_STATUS_LABELS[u.accountStatus] ??
                          u.accountStatus
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/usuarios/${u.id}`}
                          className="rounded-full border border-[#e4e4e4] px-2.5 py-1 text-[0.72rem] [font-weight:700]"
                        >
                          Perfil
                        </Link>
                        {u.role !== "admin" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() =>
                                setPending({ type: "warn", user: u })
                              }
                              className="rounded-full border border-amber-200 px-2.5 py-1 text-[0.72rem] text-amber-800 [font-weight:700]"
                            >
                              Advertir
                            </button>
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() => setSuspendUser(u)}
                              className="rounded-full border border-orange-200 px-2.5 py-1 text-[0.72rem] text-orange-800 [font-weight:700]"
                            >
                              Suspender
                            </button>
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() =>
                                setPending({ type: "ban", user: u })
                              }
                              className="rounded-full border border-red-200 px-2.5 py-1 text-[0.72rem] text-red-700 [font-weight:700]"
                            >
                              Bloquear
                            </button>
                            {u.accountStatus !== "active" ? (
                              <button
                                type="button"
                                disabled={busyId === u.id}
                                onClick={() =>
                                  setPending({ type: "reactivate", user: u })
                                }
                                className="rounded-full border border-emerald-200 px-2.5 py-1 text-[0.72rem] text-emerald-700 [font-weight:700]"
                              >
                                Reactivar
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-[0.72rem] text-[#999]">Admin</span>
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

      {suspendUser ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-[1.05rem] [font-weight:800]">
              Suspender a {suspendUser.fullName}
            </h2>
            <p className="mt-2 text-[0.9rem] text-[#666]">
              Elige la duración de la suspensión.
            </p>
            <div className="mt-4 grid gap-2">
              {[
                { days: 1, label: "24 horas" },
                { days: 7, label: "7 días" },
                { days: 30, label: "30 días" },
                { days: null, label: "Indefinidamente" },
              ].map((opt) => (
                <button
                  key={String(opt.days)}
                  type="button"
                  disabled={busyId === suspendUser.id}
                  onClick={() =>
                    setPending({
                      type: "suspend",
                      user: suspendUser,
                      days: opt.days,
                    })
                  }
                  className="rounded-xl border border-[#e8e8e8] px-4 py-3 text-left text-[0.9rem] [font-weight:700] hover:border-[var(--color-primary)]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-full border border-[#e0e0e0] py-2.5 text-[0.9rem] [font-weight:700]"
              onClick={() => setSuspendUser(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        open={Boolean(pending)}
        title={
          pending?.type === "warn"
            ? "Advertir usuario"
            : pending?.type === "ban"
              ? "Bloquear usuario"
              : pending?.type === "reactivate"
                ? "Reactivar usuario"
                : "Confirmar suspensión"
        }
        message={
          pending
            ? `¿Confirmas la acción sobre ${pending.user.fullName}?`
            : ""
        }
        danger={pending?.type === "ban" || pending?.type === "suspend"}
        busy={Boolean(pending && busyId === pending.user.id)}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) void runAction(pending);
        }}
      />
    </div>
  );
}
