"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  deletePet,
  getMyPets,
  mediaUrl,
  type Pet,
} from "@/lib/api";
import { groupPetsIntoLitters } from "@/lib/litter-groups";
import { petPath } from "@/lib/seo-urls";

const SIZE_LABEL: Record<string, string> = {
  small: "Pequeña",
  medium: "Mediana",
  large: "Grande",
};

export function MyLitterDetailScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyPets()
      .then((data) => {
        if (!cancelled) setPets(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar la camada.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const litter = useMemo(
    () =>
      groupPetsIntoLitters(pets).find(
        (item) => item.litterGroupId === groupId,
      ) ?? null,
    [pets, groupId],
  );

  const fromHref = `/adopta/camadas/${groupId}`;

  async function handleDelete(pet: Pet) {
    if (deletingId) return;
    const ok = window.confirm(
      `¿Eliminar la publicación de ${pet.name}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setDeletingId(pet.id);
    setError("");
    try {
      await deletePet(pet.id);
      const next = await getMyPets();
      setPets(next);
      const remaining = groupPetsIntoLitters(next).find(
        (item) => item.litterGroupId === groupId,
      );
      if (!remaining) router.replace("/adopta/camadas");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar la publicación.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProfilePageShell title={litter?.title ?? "Camada"} backHref="/adopta/camadas">
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
      ) : null}

      {!loading && error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {!loading && !litter ? (
        <ProfileEmptyState
          title="Camada no encontrada"
          description="Puede que ya no exista o que no tengas mascotas en este grupo."
          ctaLabel="Ver mis camadas"
          ctaHref="/adopta/camadas"
        />
      ) : null}

      {!loading && litter ? (
        <div className="flex flex-col gap-4">
          <aside className="rounded-[14px] border border-[#ececec] bg-white px-4 py-4">
            <h2 className="text-[0.95rem] text-[#555] [font-weight:700]">
              Resumen
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                  Mamá
                </dt>
                <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                  {litter.mother?.name ?? "Sin marcar"}
                </dd>
              </div>
              <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                  Crías
                </dt>
                <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                  {litter.pups.length}
                </dd>
              </div>
              <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                  Especie
                </dt>
                <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                  {litter.species === "cat"
                    ? "Gato"
                    : litter.species === "dog"
                      ? "Perro"
                      : "—"}
                </dd>
              </div>
            </dl>
          </aside>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {litter.members.map((pet) => {
              const photo = mediaUrl(pet.photoUrls[0] ?? null);
              return (
                <article
                  key={pet.id}
                  className={`relative flex gap-3 rounded-[14px] border bg-white p-3 ${
                    pet.isLitterMother
                      ? "border-[var(--color-primary)] bg-[#fff5f7]"
                      : "border-[#ececec]"
                  }`}
                >
                  <Link
                    href={petPath(pet)}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-[#f3f3f3]"
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                        {pet.species === "cat" ? <CatIcon /> : <DogIcon />}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1 pr-16">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={petPath(pet)}
                        className="truncate text-[1rem] text-[#555] [font-weight:700]"
                      >
                        {pet.name}
                      </Link>
                      {pet.isLitterMother ? (
                        <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[0.68rem] text-white [font-weight:700]">
                          Mamá
                        </span>
                      ) : null}
                      <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[0.65rem] text-[#888] [font-weight:600]">
                        {pet.status === "published" ? "Publicada" : "Cerrada"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.78rem] text-[var(--color-text-muted)]">
                      {pet.species === "cat" ? "Gato" : "Perro"} ·{" "}
                      {SIZE_LABEL[pet.size] ?? pet.size}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </p>
                  </div>
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <Link
                      href={`${petPath(pet, "/editar")}?from=${encodeURIComponent(fromHref)}`}
                      aria-label="Editar"
                      title="Editar"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ececec] bg-white text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[#fde8ec]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="m13.2 6.2 3.6 3.6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(pet)}
                      disabled={deletingId === pet.id}
                      aria-label="Eliminar"
                      title="Eliminar"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M5 7h14M10 7V5.8A1.8 1.8 0 0 1 11.8 4h.4A1.8 1.8 0 0 1 14 5.8V7M9 11v6M12 11v6M15 11v6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 7l.7 12.2A1.8 1.8 0 0 0 9.5 21h5a1.8 1.8 0 0 0 1.8-1.8L17 7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </ProfilePageShell>
  );
}
