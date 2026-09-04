"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import { ApiError, getMyPets, mediaUrl, type Pet } from "@/lib/api";
import { groupPetsIntoLitters } from "@/lib/litter-groups";

export function MyLittersScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyPets()
      .then((data) => {
        if (!cancelled) setPets(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar tus camadas.",
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

  const litters = useMemo(() => groupPetsIntoLitters(pets), [pets]);

  return (
    <ProfilePageShell
      title="Mis camadas"
      backHref="/adopta/puestos"
      action={
        <Link
          href="/adopta/nueva/camada"
          className="rounded-full bg-white/15 px-3.5 py-1.5 text-[0.8125rem] transition hover:bg-white/25 [font-weight:600]"
        >
          Nueva camada
        </Link>
      }
    >
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
      ) : null}

      {!loading && error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {!loading && !error && litters.length === 0 ? (
        <ProfileEmptyState
          title="No tienes camadas publicadas"
          description="Cuando publiques una camada, aparecerá aquí para que puedas verla y editarla."
          ctaLabel="Crear camada"
          ctaHref="/adopta/nueva/camada"
        />
      ) : null}

      {!loading && litters.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {litters.map((litter) => {
            const cover =
              litter.mother?.photoUrls[0] ??
              litter.members[0]?.photoUrls[0] ??
              null;
            const coverUrl = mediaUrl(cover);
            return (
              <Link
                key={litter.litterGroupId}
                href={`/adopta/camadas/${litter.litterGroupId}`}
                className="rounded-[14px] border border-[#ececec] bg-white p-4 transition hover:border-[var(--color-primary)]/40"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-[#f3f3f3]">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={litter.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                        {litter.species === "cat" ? (
                          <CatIcon size={22} />
                        ) : (
                          <DogIcon size={22} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[1rem] text-[#555] [font-weight:700]">
                      {litter.title}
                    </h2>
                    <p className="mt-1 text-[0.8rem] text-[var(--color-text-muted)]">
                      {litter.pups.length}{" "}
                      {litter.pups.length === 1 ? "cría" : "crías"}
                      {" · "}
                      {litter.members.length} en total
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-[var(--color-primary)] [font-weight:600]">
                      {litter.publishedCount} publicadas
                      {litter.mother ? ` · Mamá: ${litter.mother.name}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </ProfilePageShell>
  );
}
