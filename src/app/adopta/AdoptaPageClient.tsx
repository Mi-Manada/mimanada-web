"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import {
  AdoptionFiltersSidebar,
  countActiveAdoptionFilters,
  EMPTY_ADOPTION_FILTERS,
  type AdoptionFilters,
  type AgeFilter,
  type SexFilter,
} from "@/components/pets/AdoptionFiltersSidebar";
import { PetCard } from "@/components/pets/PetCard";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import {
  getMunicipalitiesByCity,
  getVenezuelaCities,
} from "@/lib/venezuela-locations";
import {
  ApiError,
  getPublishedPets,
  peekPublishedPets,
  type Pet,
  type PetSize,
  type PetSpecies,
} from "@/lib/api";

function petAgeYears(pet: Pet): number | null {
  if (pet.ageUnknown) return null;
  if (pet.ageYears == null && pet.ageMonths == null) return null;
  if (pet.ageMonths != null) return pet.ageMonths / 12;
  return pet.ageYears ?? 0;
}

function isYoungPet(pet: Pet) {
  const years = petAgeYears(pet);
  if (years == null) return false;
  return years < 1;
}

function isAdultPet(pet: Pet) {
  const years = petAgeYears(pet);
  if (years == null) return true;
  return years >= 1 && years < 7;
}

function isSeniorPet(pet: Pet) {
  const years = petAgeYears(pet);
  if (years == null) return false;
  return years >= 7;
}

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))]
    .sort((a, b) => a!.localeCompare(b!, "es", { sensitivity: "base" })) as string[];
}

function filtersFromSearchParams(params: URLSearchParams): AdoptionFilters {
  const species = parseListParam(params.get("especie")).filter(
    (value): value is PetSpecies => value === "dog" || value === "cat",
  );

  const sizeValues = parseListParam(params.get("tamano")).filter(
    (value): value is Exclude<PetSize, "unknown"> =>
      value === "small" ||
      value === "medium" ||
      value === "large" ||
      value === "giant",
  );

  const agesFromParam = parseListParam(params.get("edad")).filter(
    (value): value is AgeFilter =>
      value === "young" || value === "adult" || value === "senior",
  );

  const grupo = params.get("grupo");
  let ages = agesFromParam;
  if (ages.length === 0) {
    if (grupo === "cachorros") ages = ["young"];
    else if (grupo === "adultos") ages = ["adult"];
    else if (grupo === "mayores") ages = ["senior"];
  }

  const sexes = parseListParam(params.get("genero")).filter(
    (value): value is SexFilter => value === "female" || value === "male",
  );

  const city = params.get("ciudad")?.trim();
  const municipality = params.get("municipio")?.trim();

  return {
    species,
    sexes,
    ages,
    sizes: sizeValues,
    cities: city ? [city] : [],
    municipalities: municipality ? [municipality] : [],
    vaccinated: params.get("vacunado") === "1",
    sterilized: params.get("esterilizado") === "1",
    dewormed: params.get("desparasitado") === "1",
  };
}

function ageToGrupo(age: AgeFilter): string {
  if (age === "young") return "cachorros";
  if (age === "senior") return "mayores";
  return "adultos";
}

function filtersToSearchParams(filters: AdoptionFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.species.length) params.set("especie", filters.species.join(","));
  if (filters.sexes.length) params.set("genero", filters.sexes.join(","));
  if (filters.ages.length === 1) {
    params.set("grupo", ageToGrupo(filters.ages[0]));
  } else if (filters.ages.length > 1) {
    params.set("edad", filters.ages.join(","));
  }
  if (filters.sizes.length) params.set("tamano", filters.sizes.join(","));
  if (filters.cities[0]) params.set("ciudad", filters.cities[0]);
  if (filters.municipalities[0]) {
    params.set("municipio", filters.municipalities[0]);
  }
  if (filters.vaccinated) params.set("vacunado", "1");
  if (filters.sterilized) params.set("esterilizado", "1");
  if (filters.dewormed) params.set("desparasitado", "1");
  return params;
}

function matchesAgeFilter(pet: Pet, age: AgeFilter) {
  if (age === "young") return isYoungPet(pet);
  if (age === "senior") return isSeniorPet(pet);
  return isAdultPet(pet);
}

function matchesFilters(pet: Pet, filters: AdoptionFilters) {
  if (filters.species.length && !filters.species.includes(pet.species)) {
    return false;
  }

  if (filters.sexes.length) {
    if (pet.sex === "unknown" || !filters.sexes.includes(pet.sex)) {
      return false;
    }
  }

  if (filters.ages.length) {
    const ageOk = filters.ages.some((age) => matchesAgeFilter(pet, age));
    if (!ageOk) return false;
  }

  if (filters.sizes.length) {
    if (pet.size === "unknown" || !filters.sizes.includes(pet.size)) {
      return false;
    }
  }

  if (filters.cities.length) {
    const city = pet.city?.trim() ?? "";
    if (!filters.cities.some((value) => value === city)) return false;
  }

  if (filters.municipalities.length) {
    const municipality = pet.municipality?.trim() ?? "";
    if (!filters.municipalities.some((value) => value === municipality)) {
      return false;
    }
  }

  if (filters.vaccinated && pet.vaccinated !== true) return false;
  if (filters.sterilized && pet.sterilized !== true) return false;
  if (filters.dewormed && pet.dewormed !== true) return false;

  return true;
}

export default function AdoptaPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const [filters, setFilters] = useState<AdoptionFilters>(() =>
    filtersFromSearchParams(new URLSearchParams(searchKey)),
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cachedPets = peekPublishedPets();
  const [pets, setPets] = useState<Pet[]>(() => cachedPets ?? []);
  const [loading, setLoading] = useState(() => cachedPets == null);
  const [error, setError] = useState("");

  useEffect(() => {
    setFilters(filtersFromSearchParams(new URLSearchParams(searchKey)));
  }, [searchKey]);

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

  const applyFilters = useCallback(
    (next: AdoptionFilters) => {
      setFilters(next);
      const params = filtersToSearchParams(next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const clearFilters = useCallback(() => {
    applyFilters(EMPTY_ADOPTION_FILTERS);
  }, [applyFilters]);

  const cityOptions = useMemo(() => getVenezuelaCities(), []);

  const municipalityOptions = useMemo(() => {
    if (filters.cities[0]) {
      return getMunicipalitiesByCity(filters.cities[0]);
    }
    return uniqueSorted(pets.map((pet) => pet.municipality));
  }, [pets, filters.cities]);

  const filteredPets = useMemo(
    () => pets.filter((pet) => matchesFilters(pet, filters)),
    [pets, filters],
  );

  const activeFilterCount = countActiveAdoptionFilters(filters);
  const onlyYoung =
    filters.ages.length === 1 && filters.ages[0] === "young";
  const onlyAdult =
    filters.ages.length === 1 && filters.ages[0] === "adult";
  const onlySenior =
    filters.ages.length === 1 && filters.ages[0] === "senior";

  const pageTitle = onlyYoung
    ? "Cachorros y gatitos"
    : onlyAdult
      ? "Perros y Gatos adultos"
      : onlySenior
        ? "Mayores"
        : "Adopta";
  const pageSubtitle = onlyYoung
    ? "Pequeños listos para crecer contigo."
    : onlyAdult
      ? "Compañeros de 1 a 6 años buscando un hogar definitivo."
      : onlySenior
        ? "Peludos de 7 años o más listos para consentir."
        : "Mascotas en busca de un hogar.";

  const sidebarProps = {
    filters,
    onChange: applyFilters,
    onClear: clearFilters,
    cityOptions,
    municipalityOptions,
  };

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

        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-white px-4 py-2 text-[0.85rem] text-[var(--color-text)] [font-weight:700]"
          >
            Filtros
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[0.7rem] text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          {mobileFiltersOpen ? (
            <div className="mt-3">
              <AdoptionFiltersSidebar {...sidebarProps} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="hidden w-full shrink-0 lg:block lg:w-[15.5rem]">
            <AdoptionFiltersSidebar
              {...sidebarProps}
              className="sticky top-20"
            />
          </div>

          <div className="min-w-0 flex-1">
            {loading ? (
              <p className="text-[0.9rem] text-[var(--color-text-muted)]">
                Cargando...
              </p>
            ) : null}

            {error ? (
              <p className="text-[0.85rem] text-[var(--color-primary)]">
                {error}
              </p>
            ) : null}

            {!loading && !error && filteredPets.length === 0 ? (
              <div className="rounded-[14px] border border-[#ececec] bg-white px-4 py-10 text-center">
                <p className="text-[0.95rem] text-[#555] [font-weight:700]">
                  {activeFilterCount > 0
                    ? "No hay mascotas con estos filtros"
                    : "Aún no hay publicaciones"}
                </p>
                <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[var(--color-primary)] [font-weight:600]"
                    >
                      Limpiar filtros
                    </button>
                  ) : (
                    "Sé el primero en poner una mascota en adopción."
                  )}
                </p>
              </div>
            ) : null}

            {!loading && filteredPets.length > 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-[0.85rem] text-[var(--color-text-muted)]">
                  {filteredPets.length}{" "}
                  {filteredPets.length === 1
                    ? "mascota encontrada"
                    : "mascotas encontradas"}
                </p>

                <section>
                  <h2 className="mb-3 text-[1.1rem] text-[#4a4a4a] [font-weight:800]">
                    {onlyYoung
                      ? "Cachorros y gatitos"
                      : onlyAdult
                        ? "Perros y Gatos adultos"
                        : onlySenior
                          ? "Mayores"
                          : "Todas"}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {filteredPets.map((pet) => (
                      <PetCard key={pet.id} pet={pet} />
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </AppChrome>
  );
}
