"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfilePageShell } from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getFoundationMembers,
  getMyFoundations,
  mediaUrl,
  rotateFoundationInviteCode,
  updateFoundationMember,
  type Foundation,
  type FoundationMember,
} from "@/lib/api";

function roleLabel(role: FoundationMember["role"]) {
  if (role === "owner") return "Propietario";
  if (role === "admin") return "Admin";
  return "Miembro";
}

export function FoundationMembersScreen({
  foundationId,
}: {
  foundationId: string;
}) {
  const [foundation, setFoundation] = useState<Foundation | null>(null);
  const [members, setMembers] = useState<FoundationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const [mine, rows] = await Promise.all([
      getMyFoundations(),
      getFoundationMembers(foundationId),
    ]);
    const found = mine.find((f) => f.id === foundationId) ?? null;
    if (!found) throw new ApiError(404, "Fundación no encontrada.");
    setFoundation(found);
    setMembers(rows);
  }, [foundationId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar los miembros.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function act(
    memberId: string,
    input: Parameters<typeof updateFoundationMember>[2],
  ) {
    setBusyId(memberId);
    setError("");
    try {
      await updateFoundationMember(foundationId, memberId, input);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo actualizar.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function copyInvite() {
    if (!foundation?.inviteCode) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/fundaciones/${encodeURIComponent(foundation.slug)}?invite=${foundation.inviteCode}`
        : foundation.inviteCode;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar el enlace.");
    }
  }

  async function rotateCode() {
    setBusyId("rotate");
    try {
      const updated = await rotateFoundationInviteCode(foundationId);
      setFoundation(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo renovar el código.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");

  return (
    <ProfilePageShell
      title="Miembros"
      backHref={`/perfil/fundaciones/${foundationId}/editar`}
    >
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">
          Cargando…
        </p>
      ) : null}

      {error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
          {error}
        </p>
      ) : null}

      {foundation ? (
        <div className="mb-5 rounded-[14px] border border-[#ececec] bg-white p-4">
          <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#999] [font-weight:800]">
            Invitación
          </p>
          <p className="mt-1 text-[0.9rem] text-[#333] [font-weight:700]">
            {foundation.name}
          </p>
          <p className="mt-2 font-mono text-[1.1rem] tracking-wider text-[#333] [font-weight:800]">
            {foundation.inviteCode ?? "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-[0.8rem] text-white [font-weight:800]"
            >
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            <button
              type="button"
              disabled={busyId === "rotate"}
              onClick={() => void rotateCode()}
              className="rounded-full border border-[#e4e4e4] px-4 py-2 text-[0.8rem] text-[#555] [font-weight:700] disabled:opacity-60"
            >
              Renovar código
            </button>
          </div>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-2 text-[0.75rem] uppercase tracking-[0.1em] text-[#999] [font-weight:800]">
            Solicitudes ({pending.length})
          </h2>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-[14px] border border-[#ececec] bg-white px-3.5 py-3"
              >
                <MemberAvatar member={m} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9rem] text-[#333] [font-weight:800]">
                    {m.fullName || "Usuario"}
                  </p>
                  <p className="text-[0.75rem] text-[#888]">Pendiente</p>
                </div>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void act(m.id, { status: "active" })}
                  className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[0.75rem] text-white [font-weight:800] disabled:opacity-60"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void act(m.id, { status: "rejected" })}
                  className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.75rem] text-[#555] [font-weight:700] disabled:opacity-60"
                >
                  Rechazar
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-[0.75rem] uppercase tracking-[0.1em] text-[#999] [font-weight:800]">
          Activos ({active.length})
        </h2>
        <ul className="space-y-2">
          {active.map((m) => (
            <li
              key={m.id}
              className="rounded-[14px] border border-[#ececec] bg-white px-3.5 py-3"
            >
              <div className="flex items-center gap-3">
                <MemberAvatar member={m} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9rem] text-[#333] [font-weight:800]">
                    {m.fullName || "Usuario"}
                  </p>
                  <p className="text-[0.75rem] text-[#888]">
                    {roleLabel(m.role)}
                    {m.role === "member"
                      ? m.canPublish
                        ? " · Publicador"
                        : " · Sin publicar"
                      : " · Publicador"}
                  </p>
                </div>
              </div>
              {m.role !== "owner" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.role === "member" ? (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void act(m.id, { role: "admin" })}
                      className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.72rem] text-[#555] [font-weight:700] disabled:opacity-60"
                    >
                      Hacer admin
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void act(m.id, { role: "member" })}
                      className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.72rem] text-[#555] [font-weight:700] disabled:opacity-60"
                    >
                      Quitar admin
                    </button>
                  )}
                  {m.role === "member" ? (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() =>
                        void act(m.id, { canPublish: !m.canPublish })
                      }
                      className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-[0.72rem] text-[#555] [font-weight:700] disabled:opacity-60"
                    >
                      {m.canPublish ? "Quitar publicador" : "Hacer publicador"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() => void act(m.id, { status: "removed" })}
                    className="rounded-full border border-[var(--color-primary)]/30 px-3 py-1.5 text-[0.72rem] text-[var(--color-primary)] [font-weight:700] disabled:opacity-60"
                  >
                    Expulsar
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </ProfilePageShell>
  );
}

function MemberAvatar({ member }: { member: FoundationMember }) {
  const photo = mediaUrl(member.profilePhotoUrl);
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0] text-[0.75rem] text-[#888] [font-weight:800]">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        (member.fullName || "?").slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
