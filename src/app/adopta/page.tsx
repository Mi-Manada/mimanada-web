"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { PetCard, PetOffersRow } from "@/components/pets/PetCard";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import { ApiError, getPublishedPets, type Pet } from "@/lib/api";

export default function AdoptaPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
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

  const featured = pets.slice(0, 8);

  return (
    <AppChrome>
      <main className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.35rem] text-[var(--color-text)] [font-weight:800] sm:text-[1.5rem]">
              Adopta
            </h1>
            <p className="mt-1 text-[0.9rem] text-[var(--color-text-muted)]">
              Mascotas en busca de un hogar.
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

        {!loading && !error && pets.length === 0 ? (
          <div className="rounded-[14px] border border-[#ececec] bg-white px-4 py-10 text-center">
            <p className="text-[0.95rem] text-[#555] [font-weight:700]">
              Aún no hay publicaciones
            </p>
            <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
              Sé el primero en poner una mascota en adopción.
            </p>
          </div>
        ) : null}

        {!loading && pets.length > 0 ? (
          <div className="flex flex-col gap-8">
            <PetOffersRow title="Ofertas" pets={featured} />

            <section>
              <h2 className="mb-3 text-[1.1rem] text-[#4a4a4a] [font-weight:800]">
                Todas
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {pets.map((pet) => (
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
