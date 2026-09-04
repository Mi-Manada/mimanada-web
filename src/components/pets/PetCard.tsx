"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { FemaleIcon, MaleIcon } from "@/components/pets/PetIcons";
import { mediaUrl, type Pet, type PetSex } from "@/lib/api";
import { petPath } from "@/lib/seo-urls";

function SexBadge({ sex }: { sex: PetSex }) {
  if (sex === "female") {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f8d4dc] text-[var(--color-primary)]"
        aria-label="Hembra"
        title="Hembra"
      >
        <FemaleIcon size={14} />
      </span>
    );
  }
  if (sex === "male") {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d7e8fb] text-[#3f7cc0]"
        aria-label="Macho"
        title="Macho"
      >
        <MaleIcon size={14} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eee] text-[#888] text-[0.7rem] [font-weight:700]"
      aria-label="Sexo no indicado"
      title="No sé"
    >
      ?
    </span>
  );
}

export function PetCard({
  pet,
  showFavorite = true,
  favorited: favoritedProp,
  onFavoriteToggle,
  footer,
}: {
  pet: Pet;
  showFavorite?: boolean;
  favorited?: boolean;
  onFavoriteToggle?: (next: boolean) => void;
  footer?: ReactNode;
}) {
  const [favoritedLocal, setFavoritedLocal] = useState(false);
  const favorited = favoritedProp ?? favoritedLocal;
  const cover = mediaUrl(pet.photoUrls[0] ?? null);
  const location =
    [pet.municipality, pet.city].filter(Boolean).join(", ") || "Sin ubicación";

  function toggleFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const next = !favorited;
    if (favoritedProp === undefined) setFavoritedLocal(next);
    onFavoriteToggle?.(next);
  }

  return (
    <Link
      href={petPath(pet)}
      className="block rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
    >
      <article className="rounded-[20px] border border-[#e8e8e8] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-primary)] hover:shadow-[0_6px_18px_rgba(230,68,97,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-tl-[20px] rounded-tr-[20px] rounded-br-[3rem] bg-[#f3f3f3]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[0.8rem] text-[var(--color-text-muted)]">
            Sin foto
          </div>
        )}

        {showFavorite ? (
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
            className="absolute top-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[var(--color-primary)] shadow-sm transition hover:scale-105"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 20.2 4.8 13.4a4.4 4.4 0 0 1 6.2-6.2L12 5.4l.99 1.8a4.4 4.4 0 0 1 6.2 6.2L12 20.2Z"
                fill={favorited ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="px-3.5 pt-3 pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[1.05rem] text-[#4a4a4a] [font-weight:700]">
              {pet.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-[0.8rem] text-[#9a9a9a]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="2.1" fill="var(--color-primary)" />
              </svg>
              <span className="truncate">{location}</span>
            </p>
          </div>
          <SexBadge sex={pet.sex} />
        </div>
        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>
    </article>
    </Link>
  );
}

export function PetOffersRow({
  title = "Ofertas",
  pets,
  onSeeMoreHref,
}: {
  title?: string;
  pets: Pet[];
  onSeeMoreHref?: string;
}) {
  if (pets.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[1.15rem] text-[#4a4a4a] [font-weight:800]">{title}</h2>
        {onSeeMoreHref ? (
          <Link
            href={onSeeMoreHref}
            className="inline-flex items-center gap-1.5 text-[0.85rem] text-[var(--color-primary)] [font-weight:600]"
          >
            Ver más
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="m9 5 7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pets.map((item) => (
          <PetCard key={item.id} pet={item} />
        ))}
      </div>
    </section>
  );
}
