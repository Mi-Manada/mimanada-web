"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { Button } from "@/components/ui/Button";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import {
  ApiError,
  attachPetToLitter,
  createPet,
  getMyPets,
  mediaUrl,
  type Pet,
  type PetCaseKind,
} from "@/lib/api";
import {
  clearLitterCart,
  dataUrlToFile,
  getLitterCart,
  getLitterLockedSpecies,
  hasLitterMother,
  linkPublishedPet,
  listLitterDrafts,
  litterCartDisplayTitle,
  removeLitterDraft,
  unlinkPublishedPet,
  type LitterDraftItem,
  type LitterLinkedPet,
} from "@/lib/litter-draft";
import { petPath } from "@/lib/seo-urls";

const SIZE_LABEL: Record<string, string> = {
  small: "Pequeña",
  medium: "Mediana",
  large: "Grande",
};

export function LitterCartScreen({ cartId }: { cartId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<LitterDraftItem[]>([]);
  const [linkedPets, setLinkedPets] = useState<LitterLinkedPet[]>([]);
  const [title, setTitle] = useState("Camada");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

  function refresh() {
    const cart = getLitterCart(cartId);
    if (!cart) {
      router.replace("/adopta/nueva/camada");
      return;
    }
    setTitle(litterCartDisplayTitle(cart));
    setItems(listLitterDrafts(cartId));
    setLinkedPets(cart.linkedPets);
  }

  useEffect(() => {
    refresh();
  }, [cartId]);

  const lockedSpecies = useMemo(
    () => getLitterLockedSpecies(cartId),
    [cartId, items, linkedPets],
  );

  const summary = useMemo(() => {
    if (items.length + linkedPets.length === 0) return null;

    const breedOfLinked = (pet: LitterLinkedPet) =>
      pet.breed?.trim() ||
      myPets.find((p) => p.id === pet.petId)?.breed?.trim() ||
      null;

    const motherDraft = items.find((item) => item.isLitterMother) ?? null;
    const motherLinked =
      linkedPets.find((pet) => pet.isLitterMother) ?? null;
    const motherName = motherDraft?.name ?? motherLinked?.name ?? null;
    const motherBreed =
      motherDraft?.breed?.trim() ||
      (motherLinked ? breedOfLinked(motherLinked) : null) ||
      null;

    const pupDrafts = items.filter((item) => !item.isLitterMother);
    const pupLinked = linkedPets.filter((pet) => !pet.isLitterMother);
    const pupCount = pupDrafts.length + pupLinked.length;

    const species =
      lockedSpecies ??
      items[0]?.species ??
      linkedPets[0]?.species ??
      null;

    const breeds = [
      ...items.map((item) => item.breed?.trim()).filter(Boolean),
      ...linkedPets.map((pet) => breedOfLinked(pet)).filter(Boolean),
    ] as string[];
    const uniqueBreeds = [...new Set(breeds)];

    const femalePups =
      pupDrafts.filter((item) => item.sex === "female").length +
      pupLinked.filter((pet) => pet.sex === "female").length;
    const malePups =
      pupDrafts.filter((item) => item.sex === "male").length +
      pupLinked.filter((pet) => pet.sex === "male").length;

    const sizes = [
      ...pupDrafts.map((item) => item.size),
      ...pupLinked.map((pet) => pet.size),
    ];
    const sizeCounts = sizes.reduce<Record<string, number>>((acc, size) => {
      acc[size] = (acc[size] ?? 0) + 1;
      return acc;
    }, {});
    const sizeSummary = Object.entries(sizeCounts)
      .map(
        ([size, count]) =>
          `${SIZE_LABEL[size] ?? size}${count > 1 ? ` (${count})` : ""}`,
      )
      .join(" · ");

    return {
      motherName,
      motherBreed,
      pupCount,
      totalCount: items.length + linkedPets.length,
      species,
      uniqueBreeds,
      femalePups,
      malePups,
      sizeSummary,
    };
  }, [items, linkedPets, lockedSpecies, myPets]);

  async function openPicker() {
    setError("");
    setPickerOpen(true);
    setLoadingPets(true);
    try {
      const pets = await getMyPets();
      setMyPets(pets.filter((pet) => pet.status === "published"));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar tus publicaciones.",
      );
      setPickerOpen(false);
    } finally {
      setLoadingPets(false);
    }
  }

  function handleLinkPet(pet: Pet) {
    const result = linkPublishedPet(cartId, {
      petId: pet.id,
      name: pet.name,
      species: pet.species,
      sex: pet.sex,
      size: pet.size,
      breed: pet.breed,
      photoUrl: pet.photoUrls[0] ?? null,
      isLitterMother: false,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    refresh();
  }

  function handleRemoveDraft(localId: string) {
    removeLitterDraft(cartId, localId);
    refresh();
  }

  function handleUnlink(petId: string) {
    unlinkPublishedPet(cartId, petId);
    refresh();
  }

  async function handlePublishAll() {
    if (items.length < 1 && linkedPets.length < 1) {
      setError("Agrega al menos una mascota a la camada.");
      return;
    }

    const speciesSet = new Set([
      ...items.map((item) => item.species),
      ...linkedPets.map((pet) => pet.species),
    ]);
    if (speciesSet.size > 1) {
      setError(
        "Una camada no puede mezclar perros y gatos. Corrige las mascotas antes de publicar.",
      );
      return;
    }

    const mothers =
      items.filter((i) => i.isLitterMother).length +
      linkedPets.filter((p) => p.isLitterMother).length;
    if (mothers > 1) {
      setError("Solo puede haber una mamá por camada.");
      return;
    }

    setPublishing(true);
    setError("");

    try {
      let litterGroupId: string | undefined;

      for (const item of items) {
        const photos = item.photoDataUrls.map((url, idx) =>
          dataUrlToFile(url, `${item.name || "mascota"}-${idx + 1}.jpg`),
        );
        const medicalExams = (item.medicalExamDataUrls ?? []).map((url, idx) => {
          const base = dataUrlToFile(url, `examen-${idx + 1}`);
          const ext =
            base.type === "application/pdf"
              ? "pdf"
              : base.type === "image/png"
                ? "png"
                : base.type === "image/webp"
                  ? "webp"
                  : "jpg";
          return new File([base], `examen-${idx + 1}.${ext}`, {
            type: base.type,
          });
        });
        const created = await createPet({
          name: item.name,
          ageYears:
            item.ageUnknown || item.ageUnit === "months"
              ? undefined
              : (item.ageYears ?? undefined),
          ageMonths:
            item.ageUnknown || item.ageUnit === "years"
              ? undefined
              : (item.ageMonths ?? undefined),
          ageUnknown: item.ageUnknown,
          isLitterMother: item.isLitterMother,
          species: item.species,
          sex: item.sex,
          size: item.size,
          breed: item.breed || undefined,
          vaccinated: item.vaccinated,
          sterilized: item.sterilized,
          dewormed: item.dewormed,
          contactPhone: item.contactPhone,
          city: item.city,
          municipality: item.municipality,
          description: item.description || undefined,
          diseases: item.diseases || undefined,
          caseKind: "litter" satisfies PetCaseKind,
          litterGroupId,
          photos,
          medicalExams,
        });
        if (!litterGroupId) {
          litterGroupId = created.litterGroupId ?? created.id;
        }
      }

      if (!litterGroupId && linkedPets.length > 0) {
        const first = linkedPets[0];
        const anchored = await attachPetToLitter(
          first.petId,
          first.petId,
          first.isLitterMother,
        );
        litterGroupId = anchored.litterGroupId ?? anchored.id;
        for (const linked of linkedPets.slice(1)) {
          await attachPetToLitter(
            linked.petId,
            litterGroupId,
            linked.isLitterMother,
          );
        }
      } else if (litterGroupId) {
        for (const linked of linkedPets) {
          await attachPetToLitter(
            linked.petId,
            litterGroupId,
            linked.isLitterMother,
          );
        }
      }

      clearLitterCart(cartId);
      router.replace("/adopta/puestos");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo publicar la camada. Intenta de nuevo.",
      );
    } finally {
      setPublishing(false);
    }
  }

  const totalCount = items.length + linkedPets.length;
  const linkedIds = new Set(linkedPets.map((p) => p.petId));
  const availablePets = myPets.filter((pet) => {
    if (linkedIds.has(pet.id)) return false;
    if (lockedSpecies && pet.species !== lockedSpecies) return false;
    return true;
  });

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-5 pb-5 pt-5 text-[var(--color-text-on-primary)] sm:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
            style={{
              backgroundImage: "url(/brand/paw-texture.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "420px auto",
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex w-full max-w-[80rem] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href="/adopta/nueva/camada"
                aria-label="Volver"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 5 8 12l7 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-[1.05rem] [font-weight:700]">{title}</h1>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          {totalCount === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#ddd] bg-white px-4 py-10 text-center">
              <p className="text-[0.95rem] text-[#555] [font-weight:700]">
                Tu camada está vacía
              </p>
              <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
                Agrega una mascota nueva o una ya publicada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.localId}
                  className="relative flex gap-3 rounded-[14px] border border-[#ececec] bg-white p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-[#f3f3f3]">
                    {item.photoDataUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoDataUrls[0]}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                        {item.species === "cat" ? <CatIcon /> : <DogIcon />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[1rem] text-[#555] [font-weight:700]">
                        {item.name}
                      </h2>
                      {item.isLitterMother ? (
                        <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[0.68rem] text-[var(--color-primary)] [font-weight:700]">
                          Mamá
                        </span>
                      ) : null}
                      <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[0.65rem] text-[#888] [font-weight:600]">
                        Nueva
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.78rem] text-[var(--color-text-muted)]">
                      {item.species === "cat" ? "Gato" : "Perro"} ·{" "}
                      {SIZE_LABEL[item.size] ?? item.size}
                      {item.breed ? ` · ${item.breed}` : ""}
                    </p>
                  </div>
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <Link
                      href={`/adopta/nueva/camada/${cartId}/${item.localId}`}
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
                      onClick={() => handleRemoveDraft(item.localId)}
                      aria-label="Quitar"
                      title="Quitar"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)]"
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
              ))}

              {linkedPets.map((pet) => (
                <article
                  key={pet.petId}
                  className="relative flex gap-3 rounded-[14px] border border-[#ececec] bg-white p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-[#f3f3f3]">
                    {pet.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(pet.photoUrl) ?? pet.photoUrl}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-primary)]">
                        {pet.species === "cat" ? <CatIcon /> : <DogIcon />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[1rem] text-[#555] [font-weight:700]">
                        {pet.name}
                      </h2>
                      {pet.isLitterMother ? (
                        <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[0.68rem] text-[var(--color-primary)] [font-weight:700]">
                          Mamá
                        </span>
                      ) : null}
                      <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[0.65rem] text-[#888] [font-weight:600]">
                        Publicada
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.78rem] text-[var(--color-text-muted)]">
                      {pet.species === "cat" ? "Gato" : "Perro"} ·{" "}
                      {SIZE_LABEL[pet.size] ?? pet.size}
                    </p>
                  </div>
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <Link
                      href={`${petPath({ id: pet.petId, name: pet.name }, "/editar")}?from=${encodeURIComponent(`/adopta/nueva/camada/${cartId}`)}`}
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
                      onClick={() => handleUnlink(pet.petId)}
                      aria-label="Quitar"
                      title="Quitar"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-hover)]"
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
              ))}
            </div>
          )}

          {error ? (
            <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          {pickerOpen ? (
            <div className="rounded-[14px] border border-[#ececec] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-[0.9rem] text-[#555] [font-weight:700]">
                  Tus mascotas publicadas
                </h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="cursor-pointer text-[0.8rem] text-[var(--color-text-muted)] [font-weight:600]"
                >
                  Cerrar
                </button>
              </div>
              {loadingPets ? (
                <p className="text-[0.85rem] text-[var(--color-text-muted)]">
                  Cargando...
                </p>
              ) : availablePets.length === 0 ? (
                <p className="text-[0.85rem] text-[var(--color-text-muted)]">
                  No hay publicaciones disponibles
                  {lockedSpecies
                    ? lockedSpecies === "dog"
                      ? " de perros"
                      : " de gatos"
                    : ""}
                  .
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {availablePets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => handleLinkPet(pet)}
                      className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-[#ececec] px-3 py-2 text-left transition hover:border-[var(--color-primary)]/40"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-[#f3f3f3]">
                        {pet.photoUrls[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(pet.photoUrls[0]) ?? undefined}
                            alt={pet.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.9rem] text-[#555] [font-weight:700]">
                          {pet.name}
                        </span>
                        <span className="text-[0.75rem] text-[var(--color-text-muted)]">
                          {pet.species === "cat" ? "Gato" : "Perro"}
                          {pet.caseKind === "litter" ? " · Ya en camada" : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {summary ? (
            <aside className="rounded-[14px] border border-[#ececec] bg-white px-4 py-4">
              <h2 className="text-[0.95rem] text-[#555] [font-weight:700]">
                Resumen de la camada
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                  <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                    Mamá de la camada
                  </dt>
                  <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                    {summary.motherName ?? "Sin marcar"}
                    {summary.motherBreed ? (
                      <span className="mt-0.5 block text-[0.78rem] text-[var(--color-text-muted)] [font-weight:500]">
                        {summary.motherBreed}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                  <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                    Crías
                  </dt>
                  <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                    {summary.pupCount}{" "}
                    {summary.pupCount === 1 ? "cría" : "crías"}
                    <span className="mt-0.5 block text-[0.78rem] text-[var(--color-text-muted)] [font-weight:500]">
                      {summary.totalCount} en total
                      {summary.motherName ? " (incl. mamá)" : ""}
                    </span>
                  </dd>
                </div>
                <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                  <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                    Especie
                  </dt>
                  <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                    {summary.species === "cat"
                      ? "Gato"
                      : summary.species === "dog"
                        ? "Perro"
                        : "—"}
                  </dd>
                </div>
                <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                  <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                    Raza
                  </dt>
                  <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                    {summary.uniqueBreeds.length > 0
                      ? summary.uniqueBreeds.join(" · ")
                      : "Sin especificar"}
                  </dd>
                </div>
                {summary.pupCount > 0 ? (
                  <>
                    <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                      <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                        Sexo de las crías
                      </dt>
                      <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                        {summary.femalePups > 0
                          ? `${summary.femalePups} hembra${summary.femalePups === 1 ? "" : "s"}`
                          : null}
                        {summary.femalePups > 0 && summary.malePups > 0
                          ? " · "
                          : null}
                        {summary.malePups > 0
                          ? `${summary.malePups} macho${summary.malePups === 1 ? "" : "s"}`
                          : null}
                        {summary.femalePups === 0 && summary.malePups === 0
                          ? "—"
                          : null}
                      </dd>
                    </div>
                    {summary.sizeSummary ? (
                      <div className="rounded-[10px] bg-[#fafafa] px-3 py-2.5">
                        <dt className="text-[0.72rem] uppercase tracking-wide text-[var(--color-text-muted)] [font-weight:600]">
                          Tamaño de las crías
                        </dt>
                        <dd className="mt-0.5 text-[0.9rem] text-[#555] [font-weight:700]">
                          {summary.sizeSummary}
                        </dd>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </dl>
            </aside>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 border-t border-[#f0f0f0] pt-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href={`/adopta/nueva/camada/${cartId}/nuevo`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-primary)] px-3 text-center text-[0.85rem] text-[var(--color-primary)] [font-weight:700] sm:text-[0.9rem]"
              >
                + Agregar mascota nueva
              </Link>
              <button
                type="button"
                onClick={openPicker}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-[#e4e4e4] px-3 text-center text-[0.85rem] text-[#555] [font-weight:700] sm:text-[0.9rem]"
              >
                + Agregar desde mis puestos
              </button>
            </div>
            <Button
              type="button"
              className="h-11 w-full text-[0.9rem]"
              disabled={publishing || totalCount === 0}
              onClick={handlePublishAll}
            >
              {publishing
                ? "Publicando camada..."
                : `Postear camada (${totalCount})`}
            </Button>
          </div>
        </section>
      </main>
    </AppChrome>
  );
}
