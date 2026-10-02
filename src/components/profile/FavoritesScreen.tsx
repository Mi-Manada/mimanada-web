"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PetCard } from "@/components/pets/PetCard";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  getFavoritePets,
  getToken,
  type Pet,
} from "@/lib/api";
import {
  ensureFavoriteIds,
  peekFavoriteIds,
  subscribeFavoriteIds,
  toggleFavoritePet,
} from "@/lib/favorites";

export function FavoritesScreen() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => peekFavoriteIds() ?? new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeFavoriteIds(() => {
      setFavoriteIds(new Set(peekFavoriteIds() ?? []));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }

    Promise.all([getFavoritePets(), ensureFavoriteIds()])
      .then(([rows]) => {
        if (cancelled) return;
        setPets(rows);
        setFavoriteIds(new Set(peekFavoriteIds() ?? rows.map((pet) => pet.id)));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar tus favoritos.",
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

  async function handleToggle(petId: string, next: boolean) {
    if (!getToken()) {
      router.push(`/login?next=${encodeURIComponent("/perfil/favoritos")}`);
      return;
    }
    try {
      await toggleFavoritePet(petId, next);
      if (!next) {
        setPets((prev) => prev.filter((pet) => pet.id !== petId));
      }
    } catch {
      /* optimistic cache already reverted */
    }
  }

  return (
    <ProfilePageShell title="Favoritos" backHref="/perfil">
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

      {!loading && pets.length === 0 ? (
        <ProfileEmptyState
          title="Sin favoritos aún"
          description="Cuando explores casos de adopción, podrás guardar aquí los peluditos que más te gusten."
          ctaLabel="Ver adopciones"
          ctaHref="/adopta"
        />
      ) : null}

      {!loading && pets.length > 0 ? (
        <>
          <p className="mb-3 text-[0.85rem] text-[var(--color-text-muted)]">
            {pets.length} mascota{pets.length === 1 ? "" : "s"} guardada
            {pets.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                favorited={favoriteIds.has(pet.id)}
                onFavoriteToggle={(next) => void handleToggle(pet.id, next)}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-[0.8rem] text-[var(--color-text-muted)]">
            ¿Buscas más peluditos?{" "}
            <Link
              href="/adopta"
              className="text-[var(--color-primary)] [font-weight:700]"
            >
              Ir a adoptar
            </Link>
          </p>
        </>
      ) : null}
    </ProfilePageShell>
  );
}
