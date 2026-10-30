"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getMyFoundations,
  getToken,
  joinFoundation,
  mediaUrl,
  type Foundation,
} from "@/lib/api";
import { foundationPath } from "@/lib/seo-urls";

function roleLabel(role: Foundation["myRole"]) {
  switch (role) {
    case "owner":
      return "Propietario";
    case "admin":
      return "Administrador";
    case "member":
      return "Miembro";
    default:
      return "";
  }
}

export function MyFoundationsScreen() {
  const [items, setItems] = useState<Foundation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }
    getMyFoundations()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar tus fundaciones.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onJoinWithCode() {
    const code = inviteCode.trim().toUpperCase();
    if (code.length < 4) {
      setJoinMsg("Escribe el código de invitación.");
      return;
    }
    setJoining(true);
    setJoinMsg("");
    setError("");
    try {
      await joinFoundation({ inviteCode: code });
      setInviteCode("");
      setJoinMsg(
        "Solicitud enviada. Un admin de la fundación debe aceptarte.",
      );
      const rows = await getMyFoundations();
      setItems(rows);
    } catch (err) {
      setJoinMsg(
        err instanceof ApiError
          ? err.message
          : "No se pudo unir con ese código.",
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <ProfilePageShell
      title="Mis fundaciones"
      action={
        <Link
          href="/perfil/fundaciones/nueva"
          className="rounded-full bg-white px-3.5 py-1.5 text-[0.8rem] text-[var(--color-primary)] [font-weight:800]"
        >
          Crear
        </Link>
      }
    >
      <div className="mb-4 rounded-[14px] border border-[#ececec] bg-white p-4">
        <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#999] [font-weight:800]">
          Unirme con código
        </p>
        <p className="mt-1 text-[0.8rem] text-[#888]">
          Pega el código que te compartió la fundación (ej. S2BGWQJH).
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(e.target.value.toUpperCase().slice(0, 16))
            }
            placeholder="Código de invitación"
            className="h-11 flex-1 rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 font-mono text-[0.95rem] tracking-wider outline-none focus:border-[var(--color-primary)] focus:bg-white"
          />
          <button
            type="button"
            disabled={joining}
            onClick={() => void onJoinWithCode()}
            className="h-11 shrink-0 rounded-full bg-[var(--color-primary)] px-5 text-[0.85rem] text-white [font-weight:800] disabled:opacity-60"
          >
            {joining ? "Enviando…" : "Solicitar unirme"}
          </button>
        </div>
        {joinMsg ? (
          <p className="mt-2 text-[0.8rem] text-[var(--color-primary)] [font-weight:600]">
            {joinMsg}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">
          Cargando...
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)]">
          {error}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <ProfileEmptyState
          title="Aún no tienes fundaciones"
          description="Crea una fundación o refugio para publicar mascotas en equipo y tener un perfil público."
          ctaLabel="Crear fundación"
          ctaHref="/perfil/fundaciones/nueva"
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((f) => {
            const logo = mediaUrl(f.logoUrl);
            return (
              <li key={f.id}>
                <div className="flex items-center gap-3 rounded-[14px] border border-[#ececec] bg-white px-3.5 py-3">
                  <Link
                    href={foundationPath(f)}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0] text-[0.85rem] text-[#888] [font-weight:800]">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        f.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] text-[#333] [font-weight:800]">
                        {f.name}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] text-[#888]">
                        {roleLabel(f.myRole)}
                        {f.myCanPublish ? " · Publicador" : ""}
                        {f.municipality || f.state
                          ? ` · ${[f.municipality, f.state].filter(Boolean).join(", ")}`
                          : ""}
                      </span>
                    </span>
                  </Link>
                  {(f.myRole === "owner" || f.myRole === "admin") && (
                    <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                      <Link
                        href={`/perfil/fundaciones/${f.id}/panel`}
                        className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-center text-[0.75rem] text-white [font-weight:800]"
                      >
                        Panel
                      </Link>
                      <Link
                        href={`/perfil/fundaciones/${f.id}/miembros`}
                        className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-center text-[0.75rem] text-[#555] [font-weight:700]"
                      >
                        Miembros
                      </Link>
                      <Link
                        href={`/perfil/fundaciones/${f.id}/editar`}
                        className="rounded-full border border-[#e4e4e4] px-3 py-1.5 text-center text-[0.75rem] text-[#555] [font-weight:700]"
                      >
                        Editar
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </ProfilePageShell>
  );
}
