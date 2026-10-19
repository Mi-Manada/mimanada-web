"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ACTION_LABELS,
  formatAdminDate,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminDashboard,
  type AdminDashboard,
} from "@/lib/api";

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-[#ececec] bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[0.7rem] leading-tight text-[#888] [font-weight:600]">
        {label}
      </p>
      <p className="mt-1 text-[1.25rem] leading-none text-[#222] [font-weight:800]">
        {value}
      </p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AdminDashboardScreen() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudo cargar el dashboard.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-[#666]">Cargando métricas…</p>;
  }
  if (error || !data) {
    return <p className="text-[var(--color-primary)]">{error || "Sin datos."}</p>;
  }

  const t = data.totals;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[1.4rem] text-[#222] [font-weight:800]">Dashboard</h1>
        <p className="mt-1 text-[0.9rem] text-[#777]">
          Resumen de moderación y actividad de la plataforma.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Publicaciones totales"
          value={t.totalPets}
          href="/admin/publicaciones"
        />
        <MetricCard
          label="Pendientes de revisión"
          value={t.needsReview}
          href="/admin/moderacion?filter=pending"
        />
        <MetricCard
          label="Publicaciones reportadas"
          value={t.reported}
          href="/admin/moderacion?filter=reported"
        />
        <MetricCard
          label="Publicaciones eliminadas"
          value={t.deleted}
          href="/admin/moderacion?filter=deleted"
        />
        <MetricCard label="Usuarios activos" value={t.activeUsers} href="/admin/usuarios" />
        <MetricCard
          label="Usuarios suspendidos / bloqueados"
          value={t.suspendedUsers}
          href="/admin/usuarios"
        />
        <MetricCard
          label="Reportes pendientes"
          value={t.pendingReports}
          href="/admin/reportes?status=pending"
        />
      </div>

      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.05rem] text-[#333] [font-weight:800]">
            Actividad reciente
          </h2>
          <Link
            href="/admin/historial"
            className="text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
          >
            Ver historial
          </Link>
        </div>
        {data.recentActivity.length === 0 ? (
          <p className="mt-4 text-[0.9rem] text-[#888]">
            Aún no hay acciones de moderación registradas.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#f0f0f0]">
            {data.recentActivity.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-[0.9rem] text-[#333] [font-weight:700]">
                    {row.adminName ?? "Admin"} ·{" "}
                    {ACTION_LABELS[row.action] ?? row.action}
                  </p>
                  <p className="mt-0.5 text-[0.8rem] text-[#777]">
                    {row.petName
                      ? `Publicación: ${row.petName}`
                      : row.targetUserName
                        ? `Usuario: ${row.targetUserName}`
                        : "—"}
                    {row.reason ? ` · ${row.reason}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[0.75rem] text-[#999]">
                  {formatAdminDate(row.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
