"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { CatIcon, DogIcon, PawIcon } from "@/components/pets/PetIcons";
import { PetImageGallery } from "@/components/pets/PetImageGallery";
import {
  ApiError,
  createAdoptionRequest,
  deletePet,
  getMe,
  getMyAdoptionRequestForPet,
  getPet,
  getPetSiblings,
  getToken,
  mediaUrl,
  type Pet,
  type AuthUser,
  type AdoptionRequest,
} from "@/lib/api";
import {
  formatPetAge,
  formatPetLocation,
  formatPetSex,
  formatPetSize,
  formatPetSpecies,
} from "@/lib/pet-labels";
import { petPath, userPath } from "@/lib/seo-urls";

function HealthItem({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  const known = value != null;
  const ok = value === true;

  return (
    <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:justify-center">
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          known
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[#ececec] text-[#9a9a9a]"
        }`}
        aria-hidden
      >
        {known ? (
          ok ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="m5 12.5 4.2 4.2L19 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          )
        ) : (
          <span className="text-[0.7rem] [font-weight:700]">?</span>
        )}
      </span>
      <p className="truncate text-[0.85rem] text-[#4a4a4a] [font-weight:700] sm:text-[0.88rem]">
        {label}
      </p>
    </div>
  );
}

function AttrChip({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "peach" | "yellow" | "green" | "lilac";
}) {
  const tones = {
    blue: "bg-[#dcecfb] text-[#3f6fa8]",
    peach: "bg-[#f8ddd2] text-[#b56a55]",
    yellow: "bg-[#f7efc6] text-[#9a7d2f]",
    green: "bg-[#dff0d8] text-[#5f8a4e]",
    lilac: "bg-[#e4e7fb] text-[#5d6698]",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-3 py-4 text-center text-[0.88rem] [font-weight:700] ${tones[tone]}`}
    >
      <span
        className="pointer-events-none absolute -right-1 -bottom-2 opacity-[0.28]"
        aria-hidden
      >
        <PawIcon size={46} />
      </span>
      <span
        className="pointer-events-none absolute top-1.5 left-2 opacity-[0.16]"
        aria-hidden
      >
        <PawIcon size={16} />
      </span>
      <span className="relative z-10">{label}</span>
    </div>
  );
}

export function PetDetailScreen({
  petId,
  urlSlug,
}: {
  petId: string;
  urlSlug?: string;
}) {
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [litterMates, setLitterMates] = useState<Pet[]>([]);
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorited, setFavorited] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [myRequest, setMyRequest] = useState<AdoptionRequest | null>(null);
  const [requestingContact, setRequestingContact] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setMe(null);
      return;
    }
    getMe()
      .then((user) => {
        if (!cancelled) setMe(user);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setLitterMates([]);
    setMyRequest(null);
    setRequestError("");
    setRequestSent(false);

    getPet(petId)
      .then(async (data) => {
        if (cancelled) return;
        setPet(data);
        if (!data.litterGroupId) return;
        try {
          const mates = await getPetSiblings(data.id);
          if (!cancelled) setLitterMates(mates);
        } catch {
          if (!cancelled) setLitterMates([]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la mascota.",
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
    let cancelled = false;
    if (!pet || !getToken()) return;
    getMyAdoptionRequestForPet(pet.id)
      .then((request) => {
        if (!cancelled) setMyRequest(request);
      })
      .catch(() => {
        if (!cancelled) setMyRequest(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pet]);

  useEffect(() => {
    if (!pet || !urlSlug) return;
    const canonical = petPath(pet);
    const current = `/adopta/${urlSlug}`;
    if (current.toLowerCase() !== canonical.toLowerCase()) {
      router.replace(canonical);
    }
  }, [pet, urlSlug, router]);

  const photos = useMemo(
    () => (pet?.photoUrls ?? []).map((url) => mediaUrl(url)).filter(Boolean) as string[],
    [pet],
  );
  const medicalExams = useMemo(() => {
    return (pet?.medicalExamUrls ?? [])
      .map((url) => {
        const href = mediaUrl(url);
        if (!href) return null;
        const isPdf = /\.pdf($|\?)/i.test(url);
        return {
          href,
          isPdf,
          label: url.split("/").pop() || (isPdf ? "Examen PDF" : "Examen"),
        };
      })
      .filter(Boolean) as { href: string; isPdf: boolean; label: string }[];
  }, [pet]);
  const location = pet ? formatPetLocation(pet) : "";
  const owner = pet?.owner ?? null;
  const ownerPhoto = mediaUrl(owner?.profilePhotoUrl);
  const isOwner = Boolean(me?.id && pet && me.id === pet.ownerId);
  const hasRequested = Boolean(myRequest);
  const description = pet?.description?.trim() || "";
  const diseases = pet?.diseases?.trim() || "";

  const isLitterMother = Boolean(pet?.isLitterMother);
  const litterMother =
    litterMates.find((mate) => mate.isLitterMother) ?? null;
  const litterPups = litterMates.filter((mate) => !mate.isLitterMother);
  const litterSiblings = isLitterMother
    ? litterMates
    : litterMates.filter((mate) => !mate.isLitterMother);
  const showLitterLink =
    Boolean(pet?.litterGroupId) &&
    (isLitterMother ? litterMates.length > 0 : litterSiblings.length > 0);
  const litterLinkLabel = isLitterMother ? "Mis crías" : "Mis hermanos";
  const showLitterSection =
    Boolean(pet?.litterGroupId) &&
    (litterMother != null || litterMates.length > 0);
  const litterSectionTitle = isLitterMother
    ? "Crías de esta camada"
    : pet?.species === "cat"
      ? "Este gatito pertenece a una camada"
      : "Este cachorro pertenece a una camada";

  function openAdoptionRequest() {
    if (!pet || requestingContact || isOwner || hasRequested) return;
    if (!getToken()) {
      router.push(`/login?next=${encodeURIComponent(petPath(pet))}`);
      return;
    }
    if (!me?.profileActivated) {
      router.push(
        `/perfil/verificacion?next=${encodeURIComponent(petPath(pet))}`,
      );
      return;
    }
    setRequestMessage("");
    setRequestError("");
    setRequestSent(false);
    setRequestModalOpen(true);
  }

  async function submitAdoptionRequest() {
    if (!pet || requestingContact || isOwner || hasRequested) return;

    setRequestingContact(true);
    setRequestError("");
    try {
      const request = await createAdoptionRequest(
        pet.id,
        requestMessage.trim() || undefined,
      );
      setMyRequest(request);
      setRequestSent(true);
    } catch (err) {
      setRequestError(
        err instanceof ApiError
          ? err.message
          : "No se pudo enviar la solicitud de adopción.",
      );
    } finally {
      setRequestingContact(false);
    }
  }

  async function handleDelete() {
    if (!pet || deleting) return;
    const ok = window.confirm(
      `¿Eliminar la publicación de ${pet.name}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deletePet(pet.id);
      router.replace("/adopta/puestos");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar la publicación.",
      );
      setDeleting(false);
    }
  }

  return (
    <AppChrome>
      <main
        className={`mx-auto flex w-full max-w-[80rem] flex-1 flex-col ${
          !loading && !error && pet && !isOwner ? "pb-24 lg:pb-10" : "pb-10"
        }`}
      >
        {loading ? (
          <p className="px-4 py-10 text-[0.9rem] text-[var(--color-text-muted)] sm:px-6">
            Cargando ficha...
          </p>
        ) : null}

        {error ? (
          <div className="px-4 py-10 sm:px-6">
            <p className="text-[0.9rem] text-[var(--color-primary)]">{error}</p>
            <Link
              href="/adopta"
              className="mt-4 inline-flex text-[0.875rem] text-[var(--color-primary)] [font-weight:600]"
            >
              Volver a Adopta
            </Link>
          </div>
        ) : null}

        {!loading && !error && pet ? (
          <div className="lg:px-6 lg:pt-6 xl:px-8">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:items-start lg:gap-6">
              <div className="order-1 min-w-0">
              <PetImageGallery
                photos={photos}
                alt={pet.name}
                topLeft={
                  <Link
                    href="/adopta"
                    aria-label="Volver"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/45"
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
                }
                topRight={
                  <button
                    type="button"
                    aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
                    onClick={() => setFavorited((v) => !v)}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[var(--color-primary)] shadow-sm transition hover:scale-105"
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
                }
              />
              </div>

              <aside className="order-2 px-4 pt-5 sm:px-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:self-start lg:px-0 lg:pt-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">
                          {pet.species === "dog" ? (
                            <DogIcon size={22} />
                          ) : (
                            <CatIcon size={22} />
                          )}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <h1 className="text-[1.25rem] leading-snug text-[#4a4a4a] sm:text-[1.45rem]">
                            ¡Hola! Soy{" "}
                            <span className="text-[var(--color-primary)] [font-weight:800]">
                              {pet.name}
                            </span>
                          </h1>
                          <p className="mt-3.5 flex items-center gap-1.5 text-[0.9rem] leading-none text-[#9a9a9a]">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                              className="shrink-0"
                            >
                              <path
                                d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"
                                stroke="var(--color-primary)"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                              <circle cx="12" cy="11" r="2.1" fill="var(--color-primary)" />
                            </svg>
                            <span>{location}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isOwner ? (
                        <>
                          <Link
                            href={petPath(pet, "/editar")}
                            aria-label="Editar"
                            title="Editar"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ececec] bg-white text-[var(--color-primary)] shadow-sm transition hover:border-[var(--color-primary)] hover:bg-[#fde8ec]"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                            onClick={handleDelete}
                            disabled={deleting}
                            aria-label={deleting ? "Eliminando..." : "Borrar"}
                            title="Borrar"
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition hover:bg-[var(--color-primary-hover)] disabled:cursor-wait disabled:opacity-70"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                        </>
                      ) : null}
                      {showLitterLink ? (
                        <Link
                          href={petPath(pet, "/hermanos")}
                          className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-[0.8rem] text-white [font-weight:700] transition hover:bg-[var(--color-primary-hover)]"
                        >
                          {litterLinkLabel}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <AttrChip label={formatPetSex(pet.sex)} tone="blue" />
                    <AttrChip label={pet.breed || formatPetSpecies(pet.species)} tone="peach" />
                    <AttrChip label={formatPetAge(pet)} tone="yellow" />
                    <AttrChip label={formatPetSize(pet.size)} tone="green" />
                    <AttrChip label={formatPetSpecies(pet.species)} tone="lilac" />
                  </div>

                  <div className="mt-7 flex flex-col gap-3.5 border-y border-[#ececec] py-5 sm:flex-row sm:items-center sm:gap-4">
                    <HealthItem label="Esterilizado" value={pet.sterilized} />
                    <span className="hidden h-5 w-px bg-[#ececec] sm:block" aria-hidden />
                    <HealthItem label="Desparasitado" value={pet.dewormed} />
                    <span className="hidden h-5 w-px bg-[#ececec] sm:block" aria-hidden />
                    <HealthItem label="Vacunas" value={pet.vaccinated} />
                  </div>

                  {!isOwner ? (
                    <div className="mt-7">
                      {hasRequested ? (
                        <Link
                          href="/adopta/solicitudes"
                          className="flex w-full items-center justify-center rounded-full border border-[var(--color-primary)] px-4 py-3.5 text-[0.95rem] text-[var(--color-primary)] [font-weight:800] transition hover:bg-[var(--color-primary)]/5"
                        >
                          Solicitud enviada · Ver estado
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={requestingContact}
                          onClick={() => openAdoptionRequest()}
                          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-3.5 text-[1.05rem] text-white [font-weight:800] transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                        >
                          Adóptame
                        </button>
                      )}
                      <p className="mt-3 text-center text-[0.78rem] text-[var(--color-text-muted)]">
                        {hasRequested
                          ? "El publicador recibió tu solicitud y te contactará si avanza el proceso."
                          : "Al confirmar, se notifica al publicador. Él te contactará con el teléfono de tu perfil."}
                      </p>
                      {requestError && !requestModalOpen ? (
                        <p className="mt-3 text-center text-[0.8rem] text-[var(--color-primary)]">
                          {requestError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-7">
                      <Link
                        href="/adopta/solicitudes"
                        className="flex w-full items-center justify-center rounded-full border border-[var(--color-primary)] px-4 py-3.5 text-[0.95rem] text-[var(--color-primary)] [font-weight:800] transition hover:bg-[var(--color-primary)]/5"
                      >
                        Ver solicitudes de adopción
                      </Link>
                    </div>
                  )}

                  <div className="mt-7 flex items-center gap-3">
                    <Link
                      href={userPath(
                        {
                          id: pet.ownerId,
                          fullName: owner?.fullName ?? "protector",
                        },
                        { from: petPath(pet) },
                      )}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#ececec] px-3 py-2.5 transition hover:border-[var(--color-primary)]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8e8e8] text-[#888]">
                        {ownerPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ownerPhoto}
                            alt={owner?.fullName ?? "Publicador"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="12" cy="9" r="3.2" fill="currentColor" />
                            <path
                              d="M5.5 19c1.3-2.8 3.6-4.2 6.5-4.2s5.2 1.4 6.5 4.2"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                      </span>
                      <p className="min-w-0 text-[0.88rem] leading-snug text-[#555]">
                        {owner?.userType === "fundacion"
                          ? "Refugiado en "
                          : "Publicado por "}
                        <span className="[font-weight:700]">
                          {owner?.fullName ?? "protector"}
                        </span>
                      </p>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                      {!isOwner && !hasRequested ? (
                        <button
                          type="button"
                          aria-label="Solicitar adopción"
                          disabled={requestingContact}
                          onClick={() => openAdoptionRequest()}
                          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M12 5v14M5 12h14"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      ) : null}
                      <Link
                        href={userPath(
                          {
                            id: pet.ownerId,
                            fullName: owner?.fullName ?? "protector",
                          },
                          { from: petPath(pet) },
                        )}
                        aria-label="Ver perfil del publicador"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M5 18.5V7.8c0-.7.5-1.3 1.2-1.4l10.8-1.8c.9-.1 1.6.6 1.6 1.4v10.5c0 .7-.5 1.3-1.2 1.4L6.6 19.9A1.4 1.4 0 0 1 5 18.5Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 10.2h6.2M9 13.2h4.2"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {deleteError ? (
                    <p className="mt-2 text-center text-[0.8rem] text-[var(--color-primary)] sm:text-left">
                      {deleteError}
                    </p>
                  ) : null}
              </aside>

            <div className="order-3 mt-6 space-y-5 px-4 pb-8 sm:px-6 lg:col-start-1 lg:mt-6 lg:px-0">
              <section>
                <h2 className="text-[0.95rem] text-[#4a4a4a] [font-weight:800]">
                  Descripción
                </h2>
                {description ? (
                  <p className="mt-2 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-[#666]">
                    {description}
                  </p>
                ) : (
                  <p className="mt-2 text-[0.85rem] text-[#9a9a9a]">
                    Sin descripción por ahora.
                  </p>
                )}
              </section>

              <section>
                <h2 className="text-[0.95rem] text-[#4a4a4a] [font-weight:800]">
                  Enfermedades
                </h2>
                {diseases ? (
                  <p className="mt-2 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-[#666]">
                    {diseases}
                  </p>
                ) : (
                  <p className="mt-2 text-[0.85rem] text-[#9a9a9a]">
                    No se reportaron enfermedades.
                  </p>
                )}
              </section>

              <section>
                <h2 className="text-[0.95rem] text-[#4a4a4a] [font-weight:800]">
                  Exámenes médicos
                </h2>
                {medicalExams.length > 0 ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {medicalExams.map((exam, index) => (
                      <a
                        key={`${exam.href}-${index}`}
                        href={exam.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-[12px] border border-[#ececec] bg-[#fafafa] px-3 py-2.5 transition hover:border-[var(--color-primary)]"
                      >
                        {exam.isPdf ? (
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#888] shadow-sm">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M7 3.5h7.2L19 8.3V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z"
                                stroke="currentColor"
                                strokeWidth="1.6"
                              />
                              <path
                                d="M14 3.5V8h5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={exam.href}
                            alt={`Examen ${index + 1}`}
                            className="h-10 w-10 shrink-0 rounded-[10px] object-cover"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate text-[0.82rem] text-[#555] [font-weight:600]">
                          {exam.label}
                        </span>
                        <span className="shrink-0 text-[0.78rem] text-[var(--color-primary)] [font-weight:700]">
                          Ver
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[0.85rem] text-[#9a9a9a]">
                    No hay exámenes adjuntos.
                  </p>
                )}
              </section>

              {showLitterSection ? (
                <section>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <h2 className="text-[0.95rem] text-[#4a4a4a] [font-weight:800]">
                      {litterSectionTitle}
                    </h2>
                    {showLitterLink ? (
                      <Link
                        href={petPath(pet, "/hermanos")}
                        className="text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
                      >
                        Ver todas
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {!isLitterMother && litterMother ? (
                      <Link
                        href={petPath(litterMother)}
                        className="w-[7.5rem] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <article className="overflow-hidden rounded-[16px] border-2 border-[var(--color-primary)] bg-[#fff5f7] shadow-[0_4px_14px_rgba(230,68,97,0.16)]">
                          <div className="relative aspect-square bg-[#f3f3f3]">
                            {litterMother.photoUrls[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  mediaUrl(litterMother.photoUrls[0]) ??
                                  litterMother.photoUrls[0]
                                }
                                alt={litterMother.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                                {litterMother.species === "cat" ? (
                                  <CatIcon size={22} />
                                ) : (
                                  <DogIcon size={22} />
                                )}
                              </div>
                            )}
                            <span className="absolute top-1.5 left-1.5 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[0.62rem] text-white [font-weight:800]">
                              Mamá
                            </span>
                          </div>
                          <p className="truncate px-2 py-2 text-center text-[0.78rem] text-[var(--color-primary)] [font-weight:800]">
                            {litterMother.name}
                          </p>
                        </article>
                      </Link>
                    ) : null}

                    {(isLitterMother ? litterMates : litterPups).map((mate) => (
                      <Link
                        key={mate.id}
                        href={petPath(mate)}
                        className="w-[7.5rem] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <article className="overflow-hidden rounded-[16px] border border-[#ececec] bg-white">
                          <div className="relative aspect-square bg-[#f3f3f3]">
                            {mate.photoUrls[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  mediaUrl(mate.photoUrls[0]) ?? mate.photoUrls[0]
                                }
                                alt={mate.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                                {mate.species === "cat" ? (
                                  <CatIcon size={22} />
                                ) : (
                                  <DogIcon size={22} />
                                )}
                              </div>
                            )}
                            {mate.isLitterMother ? (
                              <span className="absolute top-1.5 left-1.5 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[0.62rem] text-white [font-weight:800]">
                                Mamá
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate px-2 py-2 text-center text-[0.78rem] text-[#555] [font-weight:700]">
                            {mate.name}
                          </p>
                        </article>
                      </Link>
                    ))}
                  </div>

                  {!isLitterMother && !litterMother && litterPups.length === 0 ? (
                    <p className="mt-2 text-[0.85rem] text-[#9a9a9a]">
                      Aún no hay más miembros publicados en esta camada.
                    </p>
                  ) : null}
                </section>
              ) : null}
            </div>
            </div>

            {requestModalOpen ? (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
                <div
                  role="dialog"
                  aria-modal
                  aria-labelledby="adoption-request-title"
                  className="w-full max-w-md rounded-[18px] bg-white p-5 shadow-xl"
                >
                  {requestSent ? (
                    <>
                      <h2
                        id="adoption-request-title"
                        className="text-[1.05rem] text-[#4a4a4a] [font-weight:800]"
                      >
                        Solicitud enviada
                      </h2>
                      <p className="mt-2 text-[0.88rem] text-[var(--color-text-muted)]">
                        El publicador fue notificado. Te contactará usando el
                        teléfono de tu perfil; su número no se comparte contigo.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRequestModalOpen(false)}
                          className="h-11 flex-1 rounded-full border border-[#e0e0e0] text-[0.9rem] text-[#555] [font-weight:700]"
                        >
                          Cerrar
                        </button>
                        <Link
                          href="/adopta/solicitudes"
                          className="flex h-11 flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] text-[0.9rem] text-white [font-weight:800]"
                        >
                          Ver solicitud
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2
                        id="adoption-request-title"
                        className="text-[1.05rem] text-[#4a4a4a] [font-weight:800]"
                      >
                        ¿Confirmas solicitar la adopción
                        {pet ? ` de ${pet.name}` : ""}?
                      </h2>
                      <p className="mt-2 text-[0.88rem] text-[var(--color-text-muted)]">
                        Se avisará al publicador. Él podrá ver tu nombre y
                        teléfono de perfil para contactarte. El teléfono del
                        publicador no se te mostrará.
                      </p>
                      <label className="mt-4 block">
                        <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)] [font-weight:600]">
                          Mensaje (opcional)
                        </span>
                        <textarea
                          value={requestMessage}
                          onChange={(e) =>
                            setRequestMessage(e.target.value.slice(0, 500))
                          }
                          rows={4}
                          placeholder="Cuéntale por qué quieres adoptar..."
                          className="w-full resize-none rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-3 text-[0.9rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                        />
                      </label>
                      {requestError ? (
                        <p className="mt-2 text-[0.8rem] text-[var(--color-primary)]">
                          {requestError}
                        </p>
                      ) : null}
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={requestingContact}
                          onClick={() => setRequestModalOpen(false)}
                          className="h-11 flex-1 rounded-full border border-[#e0e0e0] text-[0.9rem] text-[#555] [font-weight:700]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={requestingContact}
                          onClick={() => void submitAdoptionRequest()}
                          className="h-11 flex-1 rounded-full bg-[var(--color-primary)] text-[0.9rem] text-white [font-weight:800] disabled:opacity-60"
                        >
                          {requestingContact ? "Enviando..." : "Confirmar"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {!isOwner ? (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ececec] bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
                {hasRequested ? (
                  <Link
                    href="/adopta/solicitudes"
                    className="flex h-12 w-full items-center justify-center rounded-full border border-[var(--color-primary)] text-[0.95rem] text-[var(--color-primary)] [font-weight:800] shadow-sm"
                  >
                    Solicitud enviada · Ver estado
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={requestingContact}
                    onClick={() => openAdoptionRequest()}
                    className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-[1.05rem] text-white [font-weight:800] shadow-[0_8px_20px_rgba(230,68,97,0.28)] disabled:opacity-60"
                  >
                    Adóptame
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </AppChrome>
  );
}
