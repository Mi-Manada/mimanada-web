"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  CamadaIcon,
  CatIcon,
  DogIcon,
  MascotaIcon,
} from "@/components/pets/PetIcons";
import { PetCard } from "@/components/pets/PetCard";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";
import {
  ApiError,
  getMe,
  getPublishedPets,
  peekMe,
  peekPublishedPets,
  type AuthUser,
  type Pet,
} from "@/lib/api";

function NearMeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" />
    </svg>
  );
}

function RecentIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 7.8v4.6l3.2 1.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WaitingHomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M4 11.2 12 4.5l8 6.7V20a1 1 0 0 1-1 1h-5.2v-5.4H10.2V21H5a1 1 0 0 1-1-1v-8.8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const RECENT_DAYS = 14;

function normalizePlace(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isRecentPet(pet: Pet, days = RECENT_DAYS) {
  const created = Date.parse(pet.createdAt);
  if (Number.isNaN(created)) return false;
  return Date.now() - created <= days * 24 * 60 * 60 * 1000;
}

function isNearUser(pet: Pet, user: AuthUser | null) {
  if (!user) return false;
  const userState = normalizePlace(user.state);
  const userMunicipality = normalizePlace(user.municipality);
  const petCity = normalizePlace(pet.city);
  const petMunicipality = normalizePlace(pet.municipality);

  if (userMunicipality && petMunicipality && userMunicipality === petMunicipality) {
    return true;
  }
  if (userState && petCity && userState === petCity) return true;
  if (userMunicipality && petCity && userMunicipality === petCity) return true;
  if (userState && petMunicipality && userState === petMunicipality) return true;
  return false;
}

/** Menos de 1 año (cachorros / gatitos jóvenes). */
function isUnderOneYear(pet: Pet) {
  if (pet.ageUnknown) return false;
  const months = (pet.ageYears ?? 0) * 12 + (pet.ageMonths ?? 0);
  return months >= 0 && months < 12;
}

function litterRepresentatives(pets: Pet[]): Pet[] {
  const groups = new Map<string, Pet[]>();
  for (const pet of pets) {
    if (!pet.litterGroupId) continue;
    const list = groups.get(pet.litterGroupId) ?? [];
    list.push(pet);
    groups.set(pet.litterGroupId, list);
  }

  const reps: Pet[] = [];
  for (const members of groups.values()) {
    if (members.length < 2 && !members.some((p) => p.isLitterMother)) continue;
    const mother = members.find((p) => p.isLitterMother);
    reps.push(mother ?? members[0]);
  }
  return reps;
}

function CarouselArrow({
  direction,
  label,
  onClick,
  hidden,
}: {
  direction: "left" | "right";
  label: string;
  onClick: () => void;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ececec] bg-white text-[var(--color-primary)] shadow-md transition hover:border-[var(--color-primary)] sm:inline-flex ${
        direction === "left" ? "-left-1" : "-right-1"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={direction === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function useHorizontalScrollState(
  ref: RefObject<HTMLDivElement | null>,
  itemCount = 0,
) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
    };

    update();
    const raf = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", update);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, itemCount]);

  return { canScrollLeft, canScrollRight };
}

function PetCarousel({
  id,
  title,
  href,
  pets,
  emptyLabel,
  showLitterLink = false,
  accent,
  icon,
}: {
  id?: string;
  title: string;
  href: string;
  pets: Pet[];
  emptyLabel?: string;
  showLitterLink?: boolean;
  accent?: boolean;
  icon?: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight } = useHorizontalScrollState(
    scrollerRef,
    pets.length,
  );

  const titleBlock = (
    <div className="flex min-w-0 items-center gap-2.5">
      {icon ? (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          {icon}
        </span>
      ) : null}
      <h3 className="min-w-0 text-[1.05rem] text-[#4a4a4a] [font-weight:800] sm:text-[1.15rem]">
        {title}
      </h3>
    </div>
  );

  if (pets.length === 0) {
    if (!emptyLabel) return null;
    return (
      <section
        id={id}
        className={`rounded-[16px] border bg-white px-4 py-5 sm:px-5 ${
          accent
            ? "border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.03]"
            : "border-[#ececec]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {titleBlock}
          <Link
            href={href}
            className="shrink-0 text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
          >
            Ver más
          </Link>
        </div>
        <p className="mt-3 text-[0.85rem] text-[var(--color-text-muted)]">
          {emptyLabel}
        </p>
      </section>
    );
  }

  function scroll(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.min(320, el.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  return (
    <section
      id={id}
      className={`rounded-[16px] border bg-white px-4 py-5 sm:px-5 ${
        accent
          ? "border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.03]"
          : "border-[#ececec]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {titleBlock}
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
        >
          Ver más
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--color-primary)] text-white">
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
      </div>

      <div className="relative mt-4">
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pets.map((pet) => (
            <div key={pet.id} className="w-[11.5rem] shrink-0 sm:w-[13rem]">
              <PetCard
                pet={pet}
                footer={
                  showLitterLink && pet.litterGroupId ? (
                    <span className="text-[0.72rem] text-[var(--color-primary)] [font-weight:700]">
                      Parte de una camada
                    </span>
                  ) : undefined
                }
              />
            </div>
          ))}
        </div>

        {pets.length > 2 ? (
          <>
            <CarouselArrow
              direction="left"
              label={`Anterior en ${title}`}
              onClick={() => scroll(-1)}
              hidden={!canScrollLeft}
            />
            <CarouselArrow
              direction="right"
              label={`Siguiente en ${title}`}
              onClick={() => scroll(1)}
              hidden={!canScrollRight}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

export function HomeScreen() {
  const cachedPets = peekPublishedPets();
  const cachedUser = peekMe();
  const [pets, setPets] = useState<Pet[]>(() => cachedPets ?? []);
  const [user, setUser] = useState<AuthUser | null>(() => cachedUser);
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

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cats = useMemo(
    () => pets.filter((pet) => pet.species === "cat"),
    [pets],
  );

  const dogs = useMemo(
    () => pets.filter((pet) => pet.species === "dog"),
    [pets],
  );

  const waitingLongest = useMemo(
    () =>
      [...pets]
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .slice(0, 4),
    [pets],
  );

  const waitingTitle = waitingLongest[0]
    ? `${waitingLongest[0].name} sigue esperando un hogar`
    : "Siguen esperando un hogar";

  const nearby = useMemo(
    () => pets.filter((pet) => isNearUser(pet, user)),
    [pets, user],
  );

  const recent = useMemo(
    () =>
      [...pets]
        .filter((pet) => isRecentPet(pet))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [pets],
  );

  const litters = useMemo(() => litterRepresentatives(pets), [pets]);

  const youngOnes = useMemo(
    () => pets.filter((pet) => isUnderOneYear(pet)),
    [pets],
  );

  const hasLocation = Boolean(
    user && (user.municipality?.trim() || user.state?.trim()),
  );

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#f5f5f5]">
      <section className="relative overflow-hidden bg-[var(--color-primary)] text-white">
        <span className="home-blob home-blob-a" aria-hidden />
        <span className="home-blob home-blob-b" aria-hidden />
        <span className="home-blob home-blob-c" aria-hidden />

        <div className="relative z-10 mx-auto grid w-full max-w-[80rem] grid-cols-1 items-end gap-6 px-4 pt-8 pb-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:px-8 lg:pt-10">
          <div className="pb-10 lg:pb-16">
            <h1 className="max-w-[16ch] text-[clamp(1.85rem,5.5vw,3.15rem)] leading-[1.08] tracking-tight [font-weight:800]">
              ¿Buscas un peludito para consentir?
            </h1>
            <Link
              href="/adopta"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-[0.95rem] text-[var(--color-primary)] [font-weight:800] shadow-sm transition hover:bg-white/95"
            >
              Adopta
            </Link>
          </div>

          <div className="relative mx-auto flex w-full max-w-[28rem] items-end justify-center lg:max-w-none lg:justify-end">
            <div
              className="home-blob home-blob-d pointer-events-none absolute right-[8%] bottom-[18%] h-[14rem] w-[14rem] rounded-full bg-white/15 sm:h-[18rem] sm:w-[18rem]"
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/home-hero.png"
              alt="Persona sonriendo con un gato en brazos"
              className="relative z-10 h-auto w-full max-w-[22rem] object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,0.18)] sm:max-w-[26rem] lg:max-w-[30rem]"
              onError={(event) => {
                const img = event.currentTarget;
                img.style.display = "none";
                const fallback = img.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.hidden = false;
              }}
            />
            <div
              hidden
              className="relative z-10 flex h-[18rem] w-full max-w-[22rem] flex-col items-center justify-end pb-8 sm:h-[22rem]"
            >
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/20 text-white sm:h-48 sm:w-48">
                <CatIcon size={72} />
              </div>
              <p className="mt-4 text-center text-[0.85rem] text-white/85">
                Tu próximo compañero te espera
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-5 px-4 py-6 sm:px-6 lg:gap-6 lg:px-8 lg:py-8">
        <ProfileActivationBanner />

        {loading ? (
          <p className="text-[0.9rem] text-[var(--color-text-muted)]">
            Cargando...
          </p>
        ) : null}

        {error ? (
          <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
        ) : null}

        {!loading ? (
          <>
            <PetCarousel
              title="Gatitos buscando hogar"
              href="/adopta?especie=cat"
              pets={cats}
              icon={<CatIcon size={20} />}
              emptyLabel="Aún no hay gatitos publicados."
            />

            <PetCarousel
              title="Perritos buscando hogar"
              href="/adopta?especie=dog"
              pets={dogs}
              icon={<DogIcon size={20} />}
              emptyLabel="Aún no hay perritos publicados."
            />

            <PetCarousel
              title={waitingTitle}
              href="/adopta"
              pets={waitingLongest}
              accent
              icon={<WaitingHomeIcon size={20} />}
              emptyLabel="Cuando haya publicaciones antiguas las verás aquí."
            />

            <PetCarousel
              title="Cerca de ti"
              href="/adopta"
              pets={nearby}
              icon={<NearMeIcon size={20} />}
              emptyLabel={
                hasLocation
                  ? "Aún no hay publicaciones cerca de tu zona."
                  : "Completa tu ubicación en el perfil para ver mascotas cerca."
              }
            />

            <PetCarousel
              title="Recién publicados"
              href="/adopta"
              pets={recent}
              icon={<RecentIcon size={20} />}
              emptyLabel="No hay publicaciones recientes."
            />

            <PetCarousel
              id="camadas"
              title="Camadas"
              href="/adopta"
              pets={litters}
              showLitterLink
              icon={<CamadaIcon size={22} />}
              emptyLabel="Cuando haya camadas publicadas las verás aquí."
            />

            <PetCarousel
              title="Cachorros"
              href="/adopta?grupo=cachorros"
              pets={youngOnes}
              accent
              icon={<MascotaIcon size={22} />}
              emptyLabel="No hay mascotas menores de 1 año por ahora."
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
