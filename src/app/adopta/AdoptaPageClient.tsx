"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { PetCard, PetOffersRow } from "@/components/pets/PetCard";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import {
  ApiError,
  getPublishedPets,
  peekPublishedPets,
  type Pet,
} from "@/lib/api";

function isYoungPet(pet: Pet) {
  if (pet.ageUnknown) return false;
  const years = pet.ageYears ?? 0;
  const months = pet.ageMonths ?? 0;
  if (pet.ageYears == null && pet.ageMonths == null) return false;
  return years < 1 || (years === 0 && months < 12);
}

function isAdultPet(pet: Pet) {
  if (pet.ageUnknown) return true;
  const years = pet.ageYears ?? 0;
  if (pet.ageYears == null && pet.ageMonths == null) return true;
  return years >= 1;
}

export default function AdoptaPageClient() {
  const searchParams = useSearchParams();
  const group = searchParams.get("grupo");
  const cachedPets = peekPublishedPets();
  const [pets, setPets] = useState<Pet[]>(() => cachedPets ?? []);
  const [loading, setLoading] = useState(() => cachedPets == null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublishedPets()
      .then((data) => {
        if (!cancelled) setPets(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudieron cargar las mascotas.",
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

  const filteredPets = useMemo(() => {
    if (group === "cachorros") return pets.filter(isYoungPet);
    if (group === "adultos") return pets.filter(isAdultPet);
    return pets;
  }, [pets, group]);

  const featured = filteredPets.slice(0, 8);
  const pageTitle =
    group === "cachorros"
      ? "Cachorros y gatitos"
      : group === "adultos"
        ? "Peludos grandes"
        : "Adopta";
  const pageSubtitle =
    group === "cachorros"
      ? "Pequeños listos para crecer contigo."
      : group === "adultos"
        ? "Compañeros grandes buscando un hogar definitivo."
        : "Mascotas en busca de un hogar.";

  return (
    <AppChrome>
      <main className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.35rem] text-[var(--color-text)] [font-weight:800] sm:text-[1.5rem]">
              {pageTitle}
            </h1>
            <p className="mt-1 text-[0.9rem] text-[var(--color-text-muted)]">
              {pageSubtitle}
            </p>
          </div>
          <Link
            href="/adopta/nueva"
            className="shrink-0 rounded-full bg-[var(--color-primary)] px-4 py-2 text-[0.8125rem] text-white [font-weight:700]"
          >
            Poner en adopción
          </Link>
        </div>

        <div className="mb-5 w-full">
          <ProfileActivationBanner />
        </div>

        {loading ? (
          <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
        ) : null}

        {error ? (
          <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
        ) : null}

        {!loading && !error && filteredPets.length === 0 ? (
          <div className="rounded-[14px] border border-[#ececec] bg-white px-4 py-10 text-center">
            <p className="text-[0.95rem] text-[#555] [font-weight:700]">
              {group
                ? "No hay mascotas en este grupo por ahora"
                : "Aún no hay publicaciones"}
            </p>
            <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
              {group ? (
                <Link
                  href="/adopta"
                  className="text-[var(--color-primary)] [font-weight:600]"
                >
                  Ver todas las mascotas
                </Link>
              ) : (
                "Sé el primero en poner una mascota en adopción."
              )}
            </p>
          </div>
        ) : null}

        {!loading && filteredPets.length > 0 ? (
          <div className="flex flex-col gap-8">
            <PetOffersRow title="Destacados" pets={featured} />

            <section>
              <h2 className="mb-3 text-[1.1rem] text-[#4a4a4a] [font-weight:800]">
                {group === "cachorros"
                  ? "Cachorros y gatitos"
                  : group === "adultos"
                    ? "Peludos grandes"
                    : "Todas"}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredPets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </AppChrome>
  );
}
