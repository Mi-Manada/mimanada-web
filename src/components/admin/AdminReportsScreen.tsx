"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatAdminDate,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from "@/components/admin/labels";
import {
  ApiError,
  dismissAdminReport,
  getAdminReports,
  mediaUrl,
  type AdminReport,
  type ReportStatus,
} from "@/lib/api";

const STATUS_FILTERS: Array<{ id: "" | ReportStatus; label: string }> = [
  { id: "", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "action_taken", label: "Con acción" },
  { id: "dismissed", label: "Descartados" },
];

export function AdminReportsScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") ?? "") as "" | ReportStatus;
  const [rows, setRows] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminReports(status || undefined);
      setRows(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudieron cargar reportes.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function dismiss(id: string) {
    setBusyId(id);
    try {
      await dismissAdminReport(id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo descartar el reporte.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">Reportes</h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Reportes enviados por usuarios sobre publicaciones.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = status === f.id;
          const href = f.id
            ? `/admin/reportes?status=${f.id}`
            : "/admin/reportes";
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => router.replace(href)}
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

      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[#666]">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-10 text-center text-[#888]">
          No hay reportes en este filtro.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#ececec] bg-white shadow-sm">
          <table className="min-w-full text-left text-[0.85rem]">
            <thead className="border-b border-[#ececec] bg-[#fafafa] text-[0.75rem] uppercase tracking-wide text-[#888]">
              <tr>
                <th className="px-4 py-3 [font-weight:700]">Publicación</th>
                <th className="px-4 py-3 [font-weight:700]">Motivo</th>
                <th className="px-4 py-3 [font-weight:700]">Reportero</th>
                <th className="px-4 py-3 [font-weight:700]">Estado</th>
                <th className="px-4 py-3 [font-weight:700]">Fecha</th>
                <th className="px-4 py-3 [font-weight:700]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const photo = mediaUrl(r.petPhotoUrl);
                return (
                  <tr key={r.id} className="border-b border-[#f3f3f3]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#f0f0f0]">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <Link
                            href={`/admin/moderacion/${r.petId}`}
                            className="text-[var(--color-primary)] [font-weight:700]"
                          >
                            {r.petName ?? "Publicación"}
                          </Link>
                          <p className="text-[0.75rem] text-[#999]">
                            Dueño: {r.ownerName ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="[font-weight:700]">
                        {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                      </p>
                      {r.details ? (
                        <p className="mt-0.5 max-w-xs text-[0.78rem] text-[#777]">
                          {r.details}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{r.reporterName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        kind="report"
                        value={r.status}
                        label={REPORT_STATUS_LABELS[r.status] ?? r.status}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#777]">
                      {formatAdminDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/moderacion/${r.petId}`}
                          className="rounded-full border border-[#e4e4e4] px-2.5 py-1 text-[0.75rem] [font-weight:700]"
                        >
                          Revisar
                        </Link>
                        {r.status === "pending" ? (
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => void dismiss(r.id)}
                            className="rounded-full border border-[#e4e4e4] px-2.5 py-1 text-[0.75rem] [font-weight:700] disabled:opacity-60"
                          >
                            Descartar
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
    </div>
  );
}
