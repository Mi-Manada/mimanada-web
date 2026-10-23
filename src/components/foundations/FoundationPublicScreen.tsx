"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { PetCard } from "@/components/pets/PetCard";
import {
  ApiError,
  getFoundationBySlug,
  getPetsByFoundation,
  getToken,
  joinFoundation,
  mediaUrl,
  type Foundation,
  type Pet,
} from "@/lib/api";

export function FoundationPublicScreen({
  slug,
  backHref = "/home",
}: {
  slug: string;
  backHref?: string;
}) {
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite");

  const [foundation, setFoundation] = useState<Foundation | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFoundationBySlug(slug)
      .then(async (row) => {
        if (cancelled) return;
        setFoundation(row);
        try {
          const list = await getPetsByFoundation(row.id);
          if (!cancelled) setPets(list);
        } catch {
          if (!cancelled) setPets([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar la fundación.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function onJoin() {
    if (!foundation) return;
    if (!getToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/fundaciones/${slug}${inviteFromUrl ? `?invite=${inviteFromUrl}` : ""}`)}`;
      return;
    }
    setJoining(true);
    setJoinMsg("");
    try {
      await joinFoundation(
        inviteFromUrl
          ? { inviteCode: inviteFromUrl }
          : { foundationId: foundation.id },
      );
      const refreshed = await getFoundationBySlug(slug);
      setFoundation(refreshed);
      setJoinMsg("Solicitud enviada. Un admin debe aprobarte.");
    } catch (err) {
      setJoinMsg(
        err instanceof ApiError ? err.message : "No se pudo enviar la solicitud.",
      );
    } finally {
      setJoining(false);
    }
  }

  const logo = mediaUrl(foundation?.logoUrl);
  const canManage =
    foundation?.myRole === "owner" || foundation?.myRole === "admin";
  const isMember = foundation?.myMembershipStatus === "active";
  const isPending = foundation?.myMembershipStatus === "pending";

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[#f5f5f5]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-4 pb-10 pt-5 text-white sm:px-6 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage: "url(/brand/paw-texture.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "420px auto",
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto w-full max-w-[80rem]">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-[0.85rem] text-white/90 [font-weight:700]"
            >
              ← Volver
            </Link>

            {loading ? (
              <p className="mt-8 text-white/80">Cargando…</p>
            ) : error || !foundation ? (
              <p className="mt-8 text-white">{error || "No encontrada."}</p>
            ) : (
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white/20 text-[1.4rem] [font-weight:800]">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={foundation.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    foundation.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.75rem] uppercase tracking-[0.12em] text-white/75 [font-weight:700]">
                    Fundación / refugio
                  </p>
                  <h1 className="mt-1 text-[clamp(1.5rem,4vw,2.2rem)] leading-tight [font-weight:800]">
                    {foundation.name}
                  </h1>
                  {(foundation.municipality || foundation.state) && (
                    <p className="mt-1.5 text-[0.9rem] text-white/85">
                      {[foundation.municipality, foundation.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {foundation.memberCount != null ? (
                    <p className="mt-1 text-[0.8rem] text-white/75">
                      {foundation.memberCount}{" "}
                      {foundation.memberCount === 1 ? "miembro" : "miembros"}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canManage && getToken() ? (
                    <>
                      <Link
                        href={`/perfil/fundaciones/${foundation.id}/miembros`}
                        className="rounded-full bg-white/15 px-4 py-2 text-[0.85rem] text-white ring-1 ring-white/40 [font-weight:800]"
                      >
                        Miembros
                      </Link>
                      <Link
                        href={`/perfil/fundaciones/${foundation.id}/editar`}
                        className="rounded-full bg-white px-4 py-2 text-[0.85rem] text-[var(--color-primary)] [font-weight:800]"
                      >
                        Editar
                      </Link>
                    </>
                  ) : null}
                  {!isMember && !canManage ? (
                    <button
                      type="button"
                      disabled={joining || isPending}
                      onClick={() => void onJoin()}
                      className="rounded-full bg-white px-4 py-2 text-[0.85rem] text-[var(--color-primary)] [font-weight:800] disabled:opacity-70"
                    >
                      {isPending
                        ? "Solicitud pendiente"
                        : inviteFromUrl
                          ? "Unirme con invitación"
                          : "Solicitar unirme"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </header>

        {joinMsg ? (
          <p className="mx-auto w-full max-w-[80rem] px-4 pt-4 text-[0.85rem] text-[var(--color-primary)] [font-weight:600] sm:px-6 lg:px-8">
            {joinMsg}
          </p>
        ) : null}

        {foundation && !loading ? (
          <section className="mx-auto w-full max-w-[80rem] flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-2 md:items-start">
              <div className="rounded-[16px] border border-[#ececec] bg-white p-5">
                <h2 className="text-[0.95rem] text-[#333] [font-weight:800]">
                  Sobre nosotros
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-[#555]">
                  {foundation.description?.trim() ||
                    "Esta fundación aún no agregó una descripción."}
                </p>
              </div>

              <div className="rounded-[16px] border border-[#ececec] bg-white p-5">
                <h2 className="text-[0.95rem] text-[#333] [font-weight:800]">
                  Contacto y datos
                </h2>
                {foundation.fiscalAddress ||
                foundation.rifNumber ||
                foundation.email ||
                foundation.phone ||
                foundation.whatsapp ||
                foundation.instagram ||
                foundation.facebook ? (
                  <ul className="mt-3 space-y-2 text-[0.88rem] text-[#555]">
                    {foundation.rifNumber ? (
                      <li>RIF: {foundation.rifNumber}</li>
                    ) : null}
                    {foundation.fiscalAddress ? (
                      <li>Dirección fiscal: {foundation.fiscalAddress}</li>
                    ) : null}
                    {foundation.phone ? (
                      <li>Tel: {foundation.phone}</li>
                    ) : null}
                    {foundation.email ? (
                      <li>
                        Correo:{" "}
                        <a
                          href={`mailto:${foundation.email}`}
                          className="text-[var(--color-primary)] [font-weight:700]"
                        >
                          {foundation.email}
                        </a>
                      </li>
                    ) : null}
                    {foundation.whatsapp ? (
                      <li>WhatsApp: {foundation.whatsapp}</li>
                    ) : null}
                    {foundation.instagram ? (
                      <li>
                        Instagram:{" "}
                        <a
                          href={`https://instagram.com/${foundation.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--color-primary)] [font-weight:700]"
                        >
                          @{foundation.instagram.replace(/^@/, "")}
                        </a>
                      </li>
                    ) : null}
                    {foundation.facebook ? (
                      <li>
                        Facebook:{" "}
                        {/^https?:\/\//i.test(foundation.facebook) ? (
                          <a
                            href={foundation.facebook}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--color-primary)] [font-weight:700]"
                          >
                            {foundation.facebook}
                          </a>
                        ) : (
                          foundation.facebook
                        )}
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mt-2 text-[0.88rem] text-[#888]">
                    Aún no hay datos de contacto.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <h2 className="text-[0.95rem] text-[#333] [font-weight:800]">
                Mascotas en adopción
              </h2>
              {pets.length === 0 ? (
                <div className="mt-4 rounded-[12px] border border-dashed border-[#ddd] p-8 text-center">
                  <p className="text-[0.85rem] text-[#888]">
                    Esta fundación aún no tiene publicaciones activas.
                  </p>
                  <Link
                    href="/adopta"
                    className="mt-4 inline-flex rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[0.85rem] text-white [font-weight:800]"
                  >
                    Ir a Adopta
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pets.map((pet) => (
                    <li key={pet.id}>
                      <PetCard pet={pet} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </AppChrome>
  );
}
