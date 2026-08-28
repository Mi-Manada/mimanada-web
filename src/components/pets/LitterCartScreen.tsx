"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { Button } from "@/components/ui/Button";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import {
  ApiError,
  createPet,
  type PetCaseKind,
} from "@/lib/api";
import {
  clearLitterDrafts,
  dataUrlToFile,
  listLitterDrafts,
  removeLitterDraft,
  type LitterDraftItem,
} from "@/lib/litter-draft";

const SIZE_LABEL: Record<string, string> = {
  small: "Pequeña",
  medium: "Mediana",
  large: "Grande",
};

export function LitterCartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<LitterDraftItem[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    setItems(listLitterDrafts());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleRemove(localId: string) {
    removeLitterDraft(localId);
    refresh();
  }

  async function handlePublishAll() {
    if (items.length < 1) {
      setError("Agrega al menos una mascota a la camada.");
      return;
    }

    const speciesSet = new Set(items.map((item) => item.species));
    if (speciesSet.size > 1) {
      setError(
        "Una camada no puede mezclar perros y gatos. Corrige las mascotas antes de publicar.",
      );
      return;
    }

    setPublishing(true);
    setError("");

    try {
      let litterGroupId: string | undefined;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
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
      clearLitterDrafts();
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
                href="/adopta/nueva"
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
                <h1 className="text-[1.05rem] [font-weight:700]">Camada</h1>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#ddd] bg-white px-4 py-10 text-center">
              <p className="text-[0.95rem] text-[#555] [font-weight:700]">
                Tu camada está vacía
              </p>
              <p className="mt-1 text-[0.85rem] text-[var(--color-text-muted)]">
                Agrega la primera mascota para empezar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.localId}
                  className="flex gap-3 rounded-[14px] border border-[#ececec] bg-white p-3"
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
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[1rem] text-[#555] [font-weight:700]">
                        {item.name}
                      </h2>
                      {item.isLitterMother ? (
                        <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[0.68rem] text-[var(--color-primary)] [font-weight:700]">
                          Mamá
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[0.78rem] text-[var(--color-text-muted)]">
                      {item.species === "cat" ? "Gato" : "Perro"} ·{" "}
                      {SIZE_LABEL[item.size] ?? item.size}
                      {item.breed ? ` · ${item.breed}` : ""}
                      {item.ageUnknown
                        ? " · Edad n/d"
                        : item.ageUnit === "months" && item.ageMonths != null
                          ? ` · ${item.ageMonths} mes${item.ageMonths === 1 ? "" : "es"}`
                          : item.ageYears != null
                            ? ` · ${item.ageYears} año${item.ageYears === 1 ? "" : "s"}`
                            : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/adopta/nueva/camada/${item.localId}`}
                        className="rounded-full border border-[var(--color-primary)] px-3 py-1 text-[0.72rem] text-[var(--color-primary)] [font-weight:600]"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.localId)}
                        className="cursor-pointer rounded-full border border-[#e4e4e4] px-3 py-1 text-[0.72rem] text-[#777] [font-weight:600]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {error ? (
            <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 border-t border-[#f0f0f0] pt-4">
            <Link
              href="/adopta/nueva/camada/nuevo"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-primary)] text-[0.9rem] text-[var(--color-primary)] [font-weight:700]"
            >
              + Agregar mascota
            </Link>
            <Button
              type="button"
              className="h-11 w-full text-[0.9rem]"
              disabled={publishing || items.length === 0}
              onClick={handlePublishAll}
            >
              {publishing
                ? "Publicando camada..."
                : `Postear camada (${items.length})`}
            </Button>
          </div>
        </section>
      </main>
    </AppChrome>
  );
}
