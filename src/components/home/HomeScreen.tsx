"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APP_NAV_ITEMS } from "@/components/app/nav-items";
import {
  CamadaIcon,
  CatIcon,
  DogIcon,
  MascotaIcon,
} from "@/components/pets/PetIcons";
import { PetCard } from "@/components/pets/PetCard";
import {
  ApiError,
  getMe,
  getPublishedPets,
  peekMe,
  peekPublishedPets,
  type AuthUser,
  type Pet,
  type PetSpecies,
} from "@/lib/api";

type SpeciesFilter = "all" | PetSpecies;

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

function HomeHeader() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="relative z-20 mx-auto flex w-full max-w-[80rem] items-center gap-3 px-4 pt-5 sm:gap-4 sm:px-6 lg:px-8">
      <Link href="/home" className="shrink-0" aria-label="Mi Manada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-mi-manada-header.png"
          alt="Mi Manada"
          className="h-7 w-auto object-contain sm:h-8"
        />
      </Link>

      <form
        className="ml-auto flex min-w-0 flex-1 justify-end sm:max-w-[18rem] md:max-w-[22rem]"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          window.location.href = q
            ? `/adopta?q=${encodeURIComponent(q)}`
            : "/adopta";
        }}
      >
        <label className="relative flex w-full items-center">
          <span className="pointer-events-none absolute left-3.5 text-[#c45a6c]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
              <path
                d="m16.2 16.2 3.3 3.3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="h-10 w-full rounded-full border-0 bg-white py-2 pr-4 pl-10 text-[0.875rem] text-[#555] outline-none placeholder:text-[#c9a0a8]"
          />
        </label>
      </form>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[15.5rem] overflow-hidden rounded-2xl border border-white/15 bg-[var(--color-primary)] py-2 shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
          >
            {APP_NAV_ITEMS.map((item) => {
              const active =
                Boolean(item.enabled) &&
                (pathname === item.href ||
                  (item.href !== "/home" && pathname.startsWith(`${item.href}/`)));
              const className = `flex w-full items-center gap-3 px-4 py-2.5 text-left text-[0.9rem] transition ${
                active
                  ? "bg-white/15 text-[var(--color-accent-yellow)] [font-weight:700]"
                  : "text-white/95 hover:bg-white/10 [font-weight:500]"
              } ${!item.enabled ? "cursor-default opacity-55" : ""}`;

              if (!item.enabled) {
                return (
                  <span
                    key={item.label}
                    role="menuitem"
                    className={className}
                    aria-disabled
                  >
                    <span className="opacity-95">{item.icon}</span>
                    {item.label}
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={className}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="opacity-95">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SpeciesFilterButton({
  active,
  label,
  iconBg,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  iconBg: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border bg-white py-1 pr-4 pl-1.5 text-[0.92rem] text-[#6b6b6b] transition ${
        active
          ? "border-[var(--color-primary)] [font-weight:700]"
          : "border-[#d8d8d8] [font-weight:600] hover:border-[#c4c4c4]"
      }`}
    >
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: iconBg }}
        aria-hidden
      >
        {children}
      </span>
      {label}
    </button>
  );
}

function QuickAccessCard({
  href,
  title,
  description,
  icon,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-[14.5rem] flex-1 items-start gap-3 rounded-[16px] border border-[#ececec] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition hover:border-[var(--color-primary)]/35 hover:shadow-[0_8px_22px_rgba(230,68,97,0.1)] sm:min-w-0"
    >
      <span
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: accent }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-[1rem] text-[#4a4a4a] [font-weight:800]">
          {title}
        </span>
        <span className="mt-1 block text-[0.8rem] leading-snug text-[var(--color-text-muted)]">
          {description}
        </span>
      </span>
    </Link>
  );
}

function DiscoveryBanner({
  href,
  eyebrow,
  title,
  imageSrc,
  imageAlt,
}: {
  href: string;
  eyebrow: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <Link
      href={href}
      className="group grid min-h-[10.5rem] overflow-hidden rounded-[6px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(0,0,0,0.08)] sm:min-h-[11.5rem] sm:grid-cols-2"
    >
      <span className="flex flex-col justify-center gap-3 px-5 py-5 sm:px-6">
        <span className="text-[0.72rem] tracking-[0.22em] text-[#9a9a9a] uppercase [font-weight:600]">
          {eyebrow}
        </span>
        <span className="max-w-[13ch] text-[1.05rem] leading-[1.2] text-[#333] [font-weight:700] sm:text-[1.2rem]">
          {title}
        </span>
        <span className="mt-1 inline-flex h-9 w-fit items-center rounded-[6px] bg-[var(--color-primary)] px-4 text-[0.82rem] text-white [font-weight:600] transition group-hover:bg-[var(--color-primary-hover)]">
          Ver más
        </span>
      </span>
      <span className="relative min-h-[9rem] sm:min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </span>
    </Link>
  );
}

function PetCarousel({
  id,
  title,
  href,
  pets,
  emptyLabel,
  showLitterLink = false,
}: {
  id?: string;
  title: string;
  href: string;
  pets: Pet[];
  emptyLabel?: string;
  showLitterLink?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (pets.length === 0) {
    if (!emptyLabel) return null;
    return (
      <section
        id={id}
        className="rounded-[16px] border border-[#ececec] bg-white px-4 py-5 sm:px-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[1.05rem] text-[#4a4a4a] [font-weight:800]">{title}</h3>
          <Link
            href={href}
            className="text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
          >
            Ver más
          </Link>
        </div>
        <p className="mt-3 text-[0.85rem] text-[var(--color-text-muted)]">{emptyLabel}</p>
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
      className="rounded-[16px] border border-[#ececec] bg-white px-4 py-5 sm:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 text-[1.05rem] text-[#4a4a4a] [font-weight:800] sm:text-[1.15rem]">
          {title}
        </h3>
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
          <button
            type="button"
            aria-label={`Ver más en ${title}`}
            onClick={() => scroll(1)}
            className="absolute top-1/2 -right-1 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ececec] bg-white text-[var(--color-primary)] shadow-md transition hover:border-[var(--color-primary)] sm:inline-flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m9 5 7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
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
  const [filter, setFilter] = useState<SpeciesFilter>("all");
  const seekingScrollerRef = useRef<HTMLDivElement>(null);

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

  const seekingHome = useMemo(() => {
    if (filter === "all") return pets;
    return pets.filter((pet) => pet.species === filter);
  }, [pets, filter]);

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

  const hasLocation = Boolean(
    user && (user.municipality?.trim() || user.state?.trim()),
  );

  function scrollSeeking(direction: 1 | -1) {
    const el = seekingScrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.min(320, el.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#f5f5f5]">
      <section className="relative overflow-hidden bg-[var(--color-primary)] text-white">
        <span className="home-blob home-blob-a" aria-hidden />
        <span className="home-blob home-blob-b" aria-hidden />
        <span className="home-blob home-blob-c" aria-hidden />

        <HomeHeader />

        <div className="relative z-10 mx-auto grid w-full max-w-[80rem] grid-cols-1 items-end gap-6 px-4 pt-8 pb-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:px-8 lg:pt-10">
          <div className="pb-10 lg:pb-16">
            <h1 className="max-w-[16ch] text-[clamp(1.85rem,5.5vw,3.15rem)] leading-[1.08] tracking-tight [font-weight:800]">
              ¿Buscas un peludito para consentir?
            </h1>
            <Link
              href="/adopta"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-[0.95rem] text-[var(--color-primary)] [font-weight:800] shadow-sm transition hover:bg-white/95"
            >
              Adoptar
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
        <section className="-mt-2 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <QuickAccessCard
            href="/adopta"
            title="Adoptar"
            description="Explora peludos que buscan familia"
            accent="var(--color-primary)"
            icon={<DogIcon size={22} />}
          />
          <QuickAccessCard
            href="/adopta/nueva"
            title="Dar en adopción"
            description="Publica una mascota o una camada"
            accent="#f0b429"
            icon={<MascotaIcon size={22} />}
          />
          <QuickAccessCard
            href="#camadas"
            title="Camadas"
            description="Hermanos y mamá listos para adoptar"
            accent="#5c8fd6"
            icon={<CamadaIcon size={22} />}
          />
        </section>

        <section className="rounded-[16px] border border-[#ececec] bg-white px-4 py-5 sm:px-5">
          <h2 className="text-center text-[1.25rem] text-[#5F5B5B] [font-weight:800] sm:text-[1.4rem]">
            Buscando una casa
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
              className="inline-flex h-11 cursor-pointer items-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 text-[0.92rem] text-white [font-weight:700] transition hover:bg-[var(--color-primary-hover)]"
            >
              Todos
            </button>
            <SpeciesFilterButton
              active={filter === "dog"}
              label="Perros"
              iconBg="var(--color-primary)"
              onClick={() => setFilter("dog")}
            >
              <DogIcon size={18} />
            </SpeciesFilterButton>
            <SpeciesFilterButton
              active={filter === "cat"}
              label="Gatos"
              iconBg="#f0b429"
              onClick={() => setFilter("cat")}
            >
              <CatIcon size={18} />
            </SpeciesFilterButton>

            <Link
              href="/adopta"
              className="ml-auto inline-flex items-center gap-1.5 text-[0.85rem] text-[var(--color-primary)] [font-weight:700]"
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

          {loading ? (
            <p className="mt-6 text-[0.9rem] text-[var(--color-text-muted)]">
              Cargando...
            </p>
          ) : null}

          {error ? (
            <p className="mt-6 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          {!loading && !error && seekingHome.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-[#e4e4e4] bg-[#fafafa] px-4 py-10 text-center">
              <p className="text-[0.95rem] text-[#555] [font-weight:700]">
                No hay mascotas en este filtro
              </p>
              <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
                Prueba con Todos o revisa más tarde.
              </p>
            </div>
          ) : null}

          {!loading && seekingHome.length > 0 ? (
            <div className="relative mt-5">
              <div
                ref={seekingScrollerRef}
                className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {seekingHome.map((pet) => (
                  <div key={pet.id} className="w-[11.5rem] shrink-0 sm:w-[13rem]">
                    <PetCard pet={pet} />
                  </div>
                ))}
              </div>

              {seekingHome.length > 2 ? (
                <button
                  type="button"
                  aria-label="Ver más mascotas"
                  onClick={() => scrollSeeking(1)}
                  className="absolute top-1/2 -right-1 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ececec] bg-white text-[var(--color-primary)] shadow-md transition hover:border-[var(--color-primary)] sm:inline-flex"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="m9 5 7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <DiscoveryBanner
            href="/adopta?grupo=cachorros"
            eyebrow="Descubre"
            title="Adopta cachorros y gatitos"
            imageSrc="/brand/home/puppies.png"
            imageAlt="Perro y gato juntos listos para un hogar"
          />
          <DiscoveryBanner
            href="/adopta?grupo=adultos"
            eyebrow="Adopta"
            title="Peludos grandes buscando hogar"
            imageSrc="/brand/home/adults.png"
            imageAlt="Gato adulto buscando un hogar"
          />
        </section>

        {hasLocation ? (
          <PetCarousel
            title="Cerca de ti"
            href="/adopta"
            pets={nearby}
            emptyLabel="Aún no hay publicaciones cerca de tu zona."
          />
        ) : null}

        <PetCarousel title="Recién publicados" href="/adopta" pets={recent} />

        <PetCarousel
          id="camadas"
          title="Camadas"
          href="/adopta"
          pets={litters}
          showLitterLink
          emptyLabel="Cuando haya camadas publicadas las verás aquí."
        />
      </div>
    </main>
  );
}
