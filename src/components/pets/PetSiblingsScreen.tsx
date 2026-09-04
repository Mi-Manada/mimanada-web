"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { PetCard } from "@/components/pets/PetCard";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import {
  ApiError,
  getPet,
  getPetSiblings,
  mediaUrl,
  type Pet,
} from "@/lib/api";
import { formatPetLocation } from "@/lib/pet-labels";
import { petPath } from "@/lib/seo-urls";

export function PetSiblingsScreen({
  petId,
  urlSlug,
}: {
  petId: string;
  urlSlug?: string;
}) {
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [siblings, setSiblings] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([getPet(petId), getPetSiblings(petId)])
      .then(([data, mates]) => {
        if (cancelled) return;
        setPet(data);
        setSiblings(mates);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los hermanos.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [petId]);

  useEffect(() => {
    if (!pet || !urlSlug) return;
    const canonical = petPath(pet, "/hermanos");
    const current = `/adopta/${urlSlug}/hermanos`;
    if (current.toLowerCase() !== canonical.toLowerCase()) {
      router.replace(canonical);
    }
  }, [pet, urlSlug, router]);

  const photos = useMemo(
    () =>
      (pet?.photoUrls ?? [])
        .map((url) => mediaUrl(url))
        .filter(Boolean) as string[],
    [pet],
  );
  const currentPhoto = photos[photoIndex] ?? photos[0] ?? null;
  const location = pet ? formatPetLocation(pet) : "";
  const backHref = pet ? petPath(pet) : "/adopta";
  const litterTitle = useMemo(() => {
    if (!pet) return "Camada";
    if (pet.isLitterMother) {
      return siblings.length > 0
        ? `Crías de ${pet.name}`
        : `Camada de ${pet.name}`;
    }
    const mother =
      siblings.find((item) => item.isLitterMother) ?? null;
    return mother ? `Camada de ${mother.name}` : "Camada";
  }, [pet, siblings]);

  const mother = useMemo(
    () =>
      pet && !pet.isLitterMother
        ? siblings.find((item) => item.isLitterMother) ?? null
        : null,
    [pet, siblings],
  );
  const pups = useMemo(
    () =>
      pet?.isLitterMother
        ? siblings
        : siblings.filter((item) => !item.isLitterMother),
    [pet, siblings],
  );
  const emptyLabel = pet?.isLitterMother
    ? "Aún no hay crías publicadas"
    : "Aún no hay hermanos publicados";
  const emptyHint = pet?.isLitterMother
    ? "Cuando se publiquen las crías de esta camada, aparecerán aquí."
    : "Cuando se publiquen más mascotas de esta camada, aparecerán aquí.";

  return (
    <AppChrome>
      <main className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col pb-10">
        {loading ? (
          <p className="px-4 py-10 text-[0.9rem] text-[var(--color-text-muted)] sm:px-6">
            Cargando hermanos...
          </p>
        ) : null}

        {error ? (
          <div className="px-4 py-10 sm:px-6">
            <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
            <Link
              href={backHref}
              className="mt-4 inline-flex text-[0.875rem] text-[var(--color-primary)] [font-weight:600]"
            >
              Volver a la ficha
            </Link>
          </div>
        ) : null}

        {!loading && !error && pet ? (
          <>
            <section className="relative overflow-hidden bg-[#f3f3f3] lg:mx-6 lg:mt-6 lg:rounded-[28px] xl:mx-8">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[21/9]">
                {currentPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPhoto}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[0.9rem] text-[var(--color-text-muted)]">
                    Sin foto
                  </div>
                )}

                <Link
                  href={petPath(pet)}
                  aria-label="Volver"
                  className="absolute top-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/45"
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

                <button
                  type="button"
                  aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
                  onClick={() => setFavorited((v) => !v)}
                  className="absolute top-4 right-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition hover:scale-105"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M12 20.2 4.8 13.4a4.4 4.4 0 0 1 6.2-6.2L12 5.4l.99 1.8a4.4 4.4 0 0 1 6.2 6.2L12 20.2Z"
                      fill={favorited ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {photos.length > 1 ? (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-label={`Foto ${index + 1}`}
                        onClick={() => setPhotoIndex(index)}
                        className={`h-2 w-2 rounded-full transition ${
                          index === photoIndex ? "bg-white" : "bg-white/45"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="px-4 pt-5 sm:px-6 lg:px-8">
              <h1 className="flex items-center gap-2 text-[1.2rem] text-[#4a4a4a] sm:text-[1.35rem]">
                <span className="text-[var(--color-primary)]">
                  {pet.species === "dog" ? <DogIcon size={22} /> : <CatIcon size={22} />}
                </span>
                <span>
                  {litterTitle.startsWith("Camada de ") ? (
                    <>
                      Camada de{" "}
                      <span className="text-[var(--color-primary)] [font-weight:800]">
                        {litterTitle.slice("Camada de ".length)}
                      </span>
                    </>
                  ) : (
                    litterTitle
                  )}
                </span>
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-[0.88rem] text-[#9a9a9a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="11" r="2.1" fill="var(--color-primary)" />
                </svg>
                {location}
              </p>

              {siblings.length === 0 ? (
                <div className="mt-8 rounded-[16px] border border-dashed border-[#e4e4e4] bg-[#fafafa] px-5 py-10 text-center">
                  <p className="text-[0.95rem] text-[#555] [font-weight:700]">
                    {emptyLabel}
                  </p>
                  <p className="mt-2 text-[0.85rem] text-[var(--color-text-muted)]">
                    {emptyHint}
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {mother ? (
                    <div className="relative">
                      <div className="rounded-[22px] ring-2 ring-[var(--color-primary)] ring-offset-2">
                        <PetCard pet={mother} showFavorite={false} />
                      </div>
                      <span className="absolute top-2 left-2 z-10 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[0.65rem] text-white [font-weight:800]">
                        Mamá
                      </span>
                    </div>
                  ) : null}
                  {pups.map((sibling) => (
                    <PetCard key={sibling.id} pet={sibling} />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </AppChrome>
  );
}
