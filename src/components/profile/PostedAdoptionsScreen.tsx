"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PetCard } from "@/components/pets/PetCard";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import { ApiError, getMyPets, type Pet } from "@/lib/api";

export function PostedAdoptionsScreen() {
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
              : "No se pudieron cargar tus publicaciones.",
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

  return (
    <ProfilePageShell
      title="Puestos en adopción"
      backHref="/adopta"
      action={
        <Link
          href="/adopta/nueva"
          className="rounded-full bg-white/15 px-3.5 py-1.5 text-[0.8125rem] transition hover:bg-white/25 [font-weight:600]"
        >
          Poner en adopción
        </Link>
      }
    >
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
      ) : null}

      {!loading && error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {!loading && !error && pets.length === 0 ? (
        <ProfileEmptyState
          title="No has publicado casos"
          description="Crea la ficha de tu mascota para ponerla en adopción y recibir solicitudes."
          ctaLabel="Poner en adopción"
          ctaHref="/adopta/nueva"
        />
      ) : null}

      {!loading && pets.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              showFavorite={false}
              footer={
                <p className="text-[0.72rem] text-[var(--color-primary)] [font-weight:600]">
                  {pet.status === "published" ? "Publicado" : "Cerrado"}
                  {pet.caseKind === "litter" ? " · Camada" : ""}
                </p>
              }
            />
          ))}
        </div>
      ) : null}
    </ProfilePageShell>
  );
}
