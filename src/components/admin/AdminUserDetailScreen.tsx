"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ACCOUNT_STATUS_LABELS,
  ACTION_LABELS,
  formatAdminDate,
  IDENTITY_STATUS_LABELS,
  MODERATION_STATUS_LABELS,
} from "@/components/admin/labels";
import {
  ApiError,
  getAdminUserDetail,
  mediaUrl,
  moderateAdminUser,
  setAdminUserIdentity,
  type AdminUserDetail,
} from "@/lib/api";

type PendingAction =
  | { type: "warn" | "suspend" | "ban" | "reactivate" }
  | { type: "verify" | "reject_identity" };

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUserDetail(userId);
      setData(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo cargar el usuario.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runModeration(
    type: "warn" | "suspend" | "ban" | "reactivate",
    reason: string,
    days: number | null,
  ) {
    setBusy(true);
    setError("");
    try {
      await moderateAdminUser(userId, type, {
        days: type === "suspend" ? days : undefined,
        reason: reason || undefined,
      });
      setPending(null);
      setSuccess("Acción de cuenta aplicada. El usuario fue notificado.");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo moderar al usuario.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function runIdentity(
    identityStatus: "verified" | "rejected",
    reason: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const res = await setAdminUserIdentity(
        userId,
        identityStatus,
        reason || undefined,
      );
      setData(res);
      setPending(null);
      setSuccess(
        identityStatus === "verified"
          ? "Identidad verificada. El usuario fue notificado."
          : "Identidad rechazada. El usuario fue notificado.",
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar la identidad.",
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

  const { user, stats, pets, history } = data;
  const photo = mediaUrl(user.profilePhotoUrl);
  const idCard = mediaUrl(user.idCardPhotoUrl);
  const selfie = mediaUrl(user.selfiePhotoUrl);
  const recidivist = stats.notPetFlags >= 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/usuarios"
          className="text-[0.85rem] text-[var(--color-primary)] [font-weight:700]"
        >
          ← Usuarios
        </Link>
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.88rem] text-emerald-800 [font-weight:600]">
          {success}
        </div>
      ) : null}
      {error ? (
        <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {recidivist ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.88rem] text-amber-900">
          Este usuario tiene {stats.notPetFlags} acciones por contenido que no
          es mascota. Considera advertir o suspender.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#eee] text-[1.2rem] text-[#888]">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.fullName.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[1.25rem] text-[#222] [font-weight:800]">
                  {user.fullName}
                </h1>
                <p className="text-[0.85rem] text-[#777]">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge
                    kind="account"
                    value={user.accountStatus}
                    label={
                      ACCOUNT_STATUS_LABELS[user.accountStatus] ??
                      user.accountStatus
                    }
                  />
                  <StatusBadge
                    kind="report"
                    value={user.identityStatus}
                    label={
                      IDENTITY_STATUS_LABELS[user.identityStatus] ??
                      user.identityStatus
                    }
                  />
                  {user.role === "admin" ? (
                    <span className="rounded-full bg-[#eee] px-2.5 py-1 text-[0.72rem] [font-weight:700]">
                      Admin
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[0.82rem]">
              <div>
                <dt className="text-[#999]">Teléfono</dt>
                <dd className="[font-weight:700]">{user.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#999]">Ubicación</dt>
                <dd className="[font-weight:700]">
                  {[user.municipality, user.state].filter(Boolean).join(", ") ||
                    "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#999]">Registro</dt>
                <dd className="[font-weight:700]">
                  {formatAdminDate(user.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#999]">Advertencias</dt>
                <dd className="[font-weight:700]">{user.warnCount}</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Pubs", value: stats.publications },
              { label: "Reportes", value: stats.reportsReceived },
              { label: "No mascota", value: stats.notPetFlags },
              { label: "Eliminadas", value: stats.deletedContent },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[#ececec] bg-white p-4 text-center shadow-sm"
              >
                <p className="text-[1.2rem] [font-weight:800]">{s.value}</p>
                <p className="text-[0.75rem] text-[#888]">{s.label}</p>
              </div>
            ))}
          </div>

          {user.role !== "admin" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending({ type: "warn" })}
                className="rounded-full border border-amber-200 px-3 py-1.5 text-[0.8rem] text-amber-800 [font-weight:700]"
              >
                Advertir
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending({ type: "suspend" })}
                className="rounded-full border border-orange-200 px-3 py-1.5 text-[0.8rem] text-orange-800 [font-weight:700]"
              >
                Suspender
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending({ type: "ban" })}
                className="rounded-full border border-red-200 px-3 py-1.5 text-[0.8rem] text-red-700 [font-weight:700]"
              >
                Bloquear
              </button>
              {user.accountStatus !== "active" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPending({ type: "reactivate" })}
                  className="rounded-full border border-emerald-200 px-3 py-1.5 text-[0.8rem] text-emerald-700 [font-weight:700]"
                >
                  Reactivar
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
            <h2 className="text-[1rem] [font-weight:800]">Verificación</h2>
            <p className="mt-1 text-[0.85rem] text-[#777]">
              Estado:{" "}
              {IDENTITY_STATUS_LABELS[user.identityStatus] ??
                user.identityStatus}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[0.75rem] text-[#999]">Cédula</p>
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#f0f0f0]">
                  {idCard ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={idCard}
                      alt="Cédula"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.8rem] text-[#aaa]">
                      Sin foto
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[0.75rem] text-[#999]">Selfie</p>
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#f0f0f0]">
                  {selfie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selfie}
                      alt="Selfie"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.8rem] text-[#aaa]">
                      Sin foto
                    </div>
                  )}
                </div>
              </div>
            </div>
            {user.role !== "admin" &&
            (user.identityStatus === "submitted" ||
              user.identityStatus === "rejected" ||
              user.identityStatus === "incomplete") ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPending({ type: "verify" })}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-[0.8rem] text-white [font-weight:700]"
                >
                  Verificar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPending({ type: "reject_identity" })}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-[0.8rem] text-white [font-weight:700]"
                >
                  Rechazar
                </button>
              </div>
            ) : null}
            {user.identityStatus === "verified" && user.role !== "admin" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending({ type: "reject_identity" })}
                className="mt-4 rounded-full border border-red-200 px-3 py-1.5 text-[0.8rem] text-red-700 [font-weight:700]"
              >
                Revocar verificación
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <h2 className="text-[1rem] [font-weight:800]">Publicaciones</h2>
        {pets.length === 0 ? (
          <p className="mt-3 text-[0.85rem] text-[#888]">Sin publicaciones.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f0f0f0]">
            {pets.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <Link
                    href={`/admin/moderacion/${p.id}`}
                    className="text-[0.9rem] text-[var(--color-primary)] [font-weight:700]"
                  >
                    {p.name}
                  </Link>
                  <p className="text-[0.75rem] text-[#888]">
                    {MODERATION_STATUS_LABELS[p.moderationStatus] ??
                      p.moderationStatus}{" "}
                    · {formatAdminDate(p.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  kind="moderation"
                  value={p.moderationStatus}
                  label={
                    MODERATION_STATUS_LABELS[p.moderationStatus] ??
                    p.moderationStatus
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <h2 className="text-[1rem] [font-weight:800]">Historial</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-[0.85rem] text-[#888]">Sin acciones.</p>
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
                    {h.petName ? ` · ${h.petName}` : ""}
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
        title={
          pending?.type === "warn"
            ? `Advertir a ${user.fullName}`
            : pending?.type === "ban"
              ? `Bloquear a ${user.fullName}`
              : pending?.type === "reactivate"
                ? `Reactivar a ${user.fullName}`
                : pending?.type === "suspend"
                  ? `Suspender a ${user.fullName}`
                  : pending?.type === "verify"
                    ? "Verificar identidad"
                    : pending?.type === "reject_identity"
                      ? "Rechazar identidad"
                      : ""
        }
        description={
          pending?.type === "verify"
            ? "El usuario podrá usar adopciones con el perfil activado."
            : pending?.type === "reject_identity"
              ? "Debe volver a subir documentos. Explica el motivo."
              : pending?.type === "reactivate"
                ? "La cuenta volverá a estar activa."
                : "Escribe el motivo. El usuario lo verá en notificaciones."
        }
        confirmLabel={
          pending?.type === "warn"
            ? "Advertir"
            : pending?.type === "ban"
              ? "Bloquear"
              : pending?.type === "reactivate"
                ? "Reactivar"
                : pending?.type === "suspend"
                  ? "Suspender"
                  : pending?.type === "verify"
                    ? "Verificar"
                    : "Rechazar"
        }
        danger={
          pending?.type === "ban" ||
          pending?.type === "suspend" ||
          pending?.type === "reject_identity"
        }
        reasonRequired={
          pending?.type !== "reactivate" && pending?.type !== "verify"
        }
        showDuration={pending?.type === "suspend"}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={({ reason, days }) => {
          if (!pending) return;
          if (pending.type === "verify") {
            void runIdentity("verified", reason);
          } else if (pending.type === "reject_identity") {
            void runIdentity("rejected", reason);
          } else {
            void runModeration(pending.type, reason, days);
          }
        }}
      />
    </div>
  );
}
