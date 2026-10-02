"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ACTION_LABELS,
  formatAdminDate,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminHistory,
  type AdminHistoryRow,
  type ModerationActionType,
} from "@/lib/api";

const ACTION_OPTIONS: Array<{ id: "" | ModerationActionType; label: string }> = [
  { id: "", label: "Todas las acciones" },
  { id: "POST_APPROVED", label: "Aprobaciones" },
  { id: "POST_HIDDEN", label: "Ocultaciones" },
  { id: "POST_DELETED", label: "Eliminaciones" },
  { id: "POST_RESTORED", label: "Restauraciones" },
  { id: "USER_WARNED", label: "Advertencias" },
  { id: "USER_SUSPENDED", label: "Suspensiones" },
  { id: "USER_BANNED", label: "Bloqueos" },
  { id: "REPORT_DISMISSED", label: "Reportes descartados" },
];

export function AdminHistoryScreen() {
  const [action, setAction] = useState<"" | ModerationActionType>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<AdminHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminHistory({
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo cargar el historial.",
      );
    } finally {
      setLoading(false);
    }
  }, [action, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">
          Historial de moderación
        </h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Auditoría de acciones administrativas.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
        <label className="text-[0.8rem] text-[#666]">
          Acción
          <select
            value={action}
            onChange={(e) =>
              setAction(e.target.value as "" | ModerationActionType)
            }
            className="mt-1 block h-10 min-w-[12rem] rounded-xl border border-[#e4e4e4] bg-white px-3"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[0.8rem] text-[#666]">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block h-10 rounded-xl border border-[#e4e4e4] px-3"
          />
        </label>
        <label className="text-[0.8rem] text-[#666]">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block h-10 rounded-xl border border-[#e4e4e4] px-3"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="h-10 rounded-full bg-[var(--color-primary)] px-4 text-[0.85rem] text-white [font-weight:700]"
        >
          Filtrar
        </button>
      </div>

      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[#666]">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-10 text-center text-[#888]">
          No hay registros con estos filtros.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#ececec] bg-white shadow-sm">
          <table className="min-w-full text-left text-[0.85rem]">
            <thead className="border-b border-[#ececec] bg-[#fafafa] text-[0.75rem] uppercase tracking-wide text-[#888]">
              <tr>
                <th className="px-4 py-3 [font-weight:700]">Fecha</th>
                <th className="px-4 py-3 [font-weight:700]">Admin</th>
                <th className="px-4 py-3 [font-weight:700]">Acción</th>
                <th className="px-4 py-3 [font-weight:700]">Objetivo</th>
                <th className="px-4 py-3 [font-weight:700]">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f3f3f3]">
                  <td className="px-4 py-3 whitespace-nowrap text-[#777]">
                    {formatAdminDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">{row.adminName ?? "—"}</td>
                  <td className="px-4 py-3 [font-weight:700]">
                    {ACTION_LABELS[row.action] ?? row.action}
                  </td>
                  <td className="px-4 py-3 text-[#555]">
                    {row.petName
                      ? `Pub: ${row.petName}`
                      : row.targetUserName
                        ? `User: ${row.targetUserName}`
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#777]">{row.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
