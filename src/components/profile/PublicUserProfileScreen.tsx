"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import {
  ApiError,
  getPublicUser,
  mediaUrl,
  type PublicUserProfile,
} from "@/lib/api";
import { formatSpeciesFocus } from "@/lib/pet-labels";
import { userPath } from "@/lib/seo-urls";

function StarRow({
  value,
  onChange,
  interactive = false,
  size = 18,
}: {
  value: number;
  onChange?: (next: number) => void;
  interactive?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const content = (
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <path
              d="m12 3.4 2.5 5.1 5.6.8-4 3.9.9 5.6L12 16.2 6.9 18.8l.9-5.6-4-3.9 5.6-.8L12 3.4Z"
              fill={filled ? "#f5c518" : "none"}
              stroke={filled ? "#f5c518" : "#cfcfcf"}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        );

        if (!interactive) {
          return <span key={star}>{content}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
            onClick={() => onChange?.(star)}
            className="cursor-pointer rounded p-0.5 transition hover:scale-105"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function PublicUserProfileScreen({
  userId,
  urlSlug,
  backHref = "/adopta",
}: {
  userId: string;
  urlSlug?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sentNote, setSentNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getPublicUser(userId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar el perfil.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!profile || !urlSlug) return;
    const canonical = userPath(profile);
    const current = `/usuarios/${urlSlug}`;
    if (current.toLowerCase() !== canonical.toLowerCase()) {
      const qs =
        backHref && backHref !== "/adopta"
          ? `?from=${encodeURIComponent(backHref)}`
          : "";
      router.replace(`${canonical}${qs}`);
    }
  }, [profile, urlSlug, backHref, router]);

  const photo = mediaUrl(profile?.profilePhotoUrl);
  const location = useMemo(() => {
    if (!profile) return "";
    return (
      [profile.addressLine, profile.municipality, profile.state]
        .filter(Boolean)
        .join(", ") || "Sin ubicación"
    );
  }, [profile]);
  const speciesLabel = formatSpeciesFocus(profile?.speciesFocus);
  const showDogs = (profile?.speciesFocus ?? []).includes("dog") || !(profile?.speciesFocus?.length);
  const showCats = (profile?.speciesFocus ?? []).includes("cat") || !(profile?.speciesFocus?.length);

  function onSubmitRating(event: FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setSentNote("Elige una calificación con estrellas.");
      return;
    }
    setSentNote("Gracias. Las valoraciones públicas llegarán pronto.");
    setComment("");
    setRating(0);
  }

  return (
    <AppChrome>
      <main className="mx-auto flex w-full max-w-[42rem] flex-1 flex-col px-4 py-6 sm:px-6 lg:max-w-[48rem] lg:px-8">
        <div className="mb-4">
          <Link
            href={backHref}
            aria-label="Volver"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efefef] text-[#555] transition hover:bg-[#e6e6e6]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 5 8 12l7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {loading ? (
          <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando perfil...</p>
        ) : null}

        {error ? (
          <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
        ) : null}

        {!loading && !error && profile ? (
          <div className="flex flex-col items-stretch">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#e8e8e8] text-[#888] sm:h-32 sm:w-32">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="9" r="3.4" fill="currentColor" />
                    <path
                      d="M5.2 19.2c1.4-3 3.9-4.5 6.8-4.5s5.4 1.5 6.8 4.5"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </div>

              <h1 className="mt-4 text-[1.45rem] text-[#4a4a4a] [font-weight:800] sm:text-[1.65rem]">
                {profile.fullName}
              </h1>

              <p className="mt-2 flex max-w-[28rem] items-start justify-center gap-1.5 text-[0.88rem] leading-snug text-[#8a8a8a]">
                <svg
                  className="mt-0.5 shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="11" r="2.1" fill="var(--color-primary)" />
                </svg>
                <span>{location}</span>
              </p>

              {profile.phone ? (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.88rem] text-[#666]">
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-2 transition hover:text-[var(--color-primary)]"
                  >
                    <span className="text-[var(--color-primary)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M7.2 4.8c.4-.4 1-.5 1.5-.3l2.2.9c.5.2.8.7.7 1.2l-.4 2.1a1.1 1.1 0 0 1-.6.8l-1.3.6a11 11 0 0 0 5.1 5.1l.6-1.3c.2-.4.5-.6.8-.6l2.1-.4c.5-.1 1 .2 1.2.7l.9 2.2c.2.5.1 1.1-.3 1.5l-1.1 1.1c-.4.4-1 .6-1.6.5C10.5 18.7 5.3 13.5 4.3 7.5c-.1-.6.1-1.2.5-1.6L7.2 4.8Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    {profile.phone}
                  </a>
                </div>
              ) : null}

              <p className="mt-3 inline-flex items-center gap-2 text-[0.9rem] text-[var(--color-primary)] [font-weight:700]">
                <span className="inline-flex items-center gap-1">
                  {showDogs ? <DogIcon size={18} /> : null}
                  {showCats ? <CatIcon size={18} /> : null}
                </span>
                {speciesLabel}
              </p>
            </div>

            <section className="mt-7 rounded-2xl border border-[#e8e8e8] px-4 py-4 sm:px-5">
              <h2 className="text-[1rem] text-[#4a4a4a] [font-weight:800]">Acerca de:</h2>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-[#8a8a8a]">
                {profile.userType === "fundacion"
                  ? "Fundación u organización que publica mascotas en adopción en Mi Manada."
                  : "Persona que publica mascotas en adopción en Mi Manada."}
              </p>
            </section>

            <section className="mt-7">
              <h2 className="text-[1rem] text-[#4a4a4a] [font-weight:800]">
                Promedio de Valoraciones:
              </h2>
              <div className="mt-3 rounded-2xl border border-dashed border-[#e4e4e4] bg-[#fafafa] px-4 py-8 text-center">
                <p className="text-[0.9rem] text-[#666] [font-weight:600]">
                  Aún no hay valoraciones
                </p>
                <p className="mt-1 text-[0.8rem] text-[#9a9a9a]">
                  Sé el primero en calificar este perfil.
                </p>
              </div>
            </section>

            <section className="mt-7">
              <h2 className="text-[1rem] text-[#4a4a4a] [font-weight:800]">Calificar:</h2>
              <form onSubmit={onSubmitRating} className="mt-3">
                <StarRow
                  value={rating}
                  onChange={setRating}
                  interactive
                  size={26}
                />
                <div className="relative mt-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comentario"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-[#e0e0e0] bg-white px-4 py-3 pr-12 text-[0.9rem] text-[#444] outline-none transition focus:border-[var(--color-primary)]"
                  />
                  <button
                    type="submit"
                    aria-label="Enviar valoración"
                    className="absolute right-3 bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-primary)] transition hover:bg-[#fde8ec]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4.2 11.2 19.5 4.4c.7-.3 1.4.4 1.1 1.1l-4.2 14.2c-.3.9-1.5 1-1.9.2l-2.6-5.3-5.3-2.6c-.8-.4-.7-1.6.2-1.9Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
                {sentNote ? (
                  <p className="mt-2 text-[0.8rem] text-[var(--color-primary)]">{sentNote}</p>
                ) : null}
              </form>
            </section>
          </div>
        ) : null}
      </main>
    </AppChrome>
  );
}
