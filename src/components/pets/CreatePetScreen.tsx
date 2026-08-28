"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppChrome } from "@/components/app/AppChrome";
import {
  CatIcon,
  DogIcon,
  FemaleIcon,
  MaleIcon,
  UnknownSexIcon,
} from "@/components/pets/PetIcons";
import { Button } from "@/components/ui/Button";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import {
  ImageSourceSheet,
  prefersMobileImagePicker,
} from "@/components/ui/ImageSourceSheet";
import {
  ApiError,
  createPet,
  getMe,
  type AuthUser,
  type PetSex,
  type PetSize,
  type PetSpecies,
} from "@/lib/api";
import {
  dataUrlToFile,
  filesToDataUrls,
  getLitterDraft,
  getLitterLockedSpecies,
  listLitterDrafts,
  newLitterLocalId,
  upsertLitterDraft,
} from "@/lib/litter-draft";
import { CAT_BREEDS, DOG_BREEDS } from "@/lib/pet-breeds";
import {
  focusFormField,
  isValidVeMobile,
  toLocalVePhone,
  veMobileErrorMessage,
} from "@/lib/ve-phone";

type TriBool = boolean | null;

type PhotoSlot = {
  previewUrl: string;
  file: File;
};

type ExamSlot = {
  previewUrl: string;
  file: File;
  kind: "image" | "pdf";
};

const MAX_MEDICAL_EXAMS = 5;

function classifyExamFile(file: File): "image" | "pdf" | null {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    type.startsWith("image/") ||
    /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(name)
  ) {
    return "image";
  }
  return null;
}

function Chip({
  selected,
  onClick,
  children,
  tone = "default",
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "female" | "male";
  disabled?: boolean;
}) {
  const idleTone =
    tone === "female"
      ? "border-[var(--color-primary)]/35 text-[var(--color-primary)]"
      : tone === "male"
        ? "border-[#4f8fd8]/45 text-[#3f7cc0]"
        : "border-[#e4e4e4] text-[#666]";

  const selectedTone =
    tone === "male"
      ? "border-[#3f7cc0] bg-[#3f7cc0] text-white"
      : "border-[var(--color-primary)] bg-[var(--color-primary)] text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] transition [font-weight:600] ${
        selected ? selectedTone : `bg-white hover:border-[var(--color-primary)]/40 ${idleTone}`
      } ${disabled ? "cursor-not-allowed opacity-40 hover:border-inherit" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[0.78rem] text-[var(--color-text-muted)] [font-weight:600]">
      {children}
    </p>
  );
}

function inputClass(hasError: boolean, extra = "") {
  return [
    "h-11 w-full rounded-[10px] border bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:bg-white",
    hasError
      ? "border-[var(--color-primary)]"
      : "border-[#e8e8e8] focus:border-[var(--color-primary)]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function Section({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-[14px] border border-[#ececec] bg-white ${className}`}
    >
      <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-4 py-2.5">
        <h2 className="text-[0.8rem] uppercase tracking-[0.04em] text-[#777] [font-weight:700]">
          {title}
        </h2>
        {hint ? (
          <p className="mt-0.5 text-[0.72rem] text-[var(--color-text-muted)]">{hint}</p>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">{children}</div>
    </section>
  );
}

export function CreatePetScreen({
  mode = "isolated",
  litterItemId,
}: {
  mode?: "isolated" | "litter";
  litterItemId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const examInputRef = useRef<HTMLInputElement>(null);
  const cropSlotRef = useRef<number>(0);
  const isLitter = mode === "litter";
  const editingId = litterItemId && litterItemId !== "nuevo" ? litterItemId : null;
  const localIdRef = useRef(editingId ?? newLitterLocalId());

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [name, setName] = useState("");
  const [ageValue, setAgeValue] = useState("0");
  const [ageUnit, setAgeUnit] = useState<"years" | "months">("years");
  const [ageUnknown, setAgeUnknown] = useState(false);
  const [isLitterMother, setIsLitterMother] = useState(false);
  const [size, setSize] = useState<PetSize | null>(null);
  const [sex, setSex] = useState<PetSex | null>(null);
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [vaccinated, setVaccinated] = useState<TriBool>(null);
  const [sterilized, setSterilized] = useState<TriBool>(null);
  const [dewormed, setDewormed] = useState<TriBool>(null);
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [diseases, setDiseases] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+58");
  const [city, setCity] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [photos, setPhotos] = useState<(PhotoSlot | null)[]>([null, null, null]);
  const [medicalExams, setMedicalExams] = useState<ExamSlot[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("mascota.jpg");
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(!isLitter);
  const [lockedSpecies, setLockedSpecies] = useState<PetSpecies | null>(null);

  const breeds = useMemo(() => {
    if (species === "cat") return CAT_BREEDS;
    return DOG_BREEDS;
  }, [species]);

  const backHref = isLitter
    ? "/adopta/nueva/camada"
    : "/adopta/nueva";

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);

        if (isLitter) {
          const existing = editingId ? getLitterDraft(editingId) : null;
          if (existing) {
            localIdRef.current = existing.localId;
            setName(existing.name);
            setAgeUnit(existing.ageUnit ?? (existing.ageMonths != null ? "months" : "years"));
            setAgeValue(
              existing.ageUnit === "months" || existing.ageMonths != null
                ? String(existing.ageMonths ?? 0)
                : String(existing.ageYears ?? 0),
            );
            setAgeUnknown(existing.ageUnknown);
            setIsLitterMother(Boolean(existing.isLitterMother));
            setSize(existing.size);
            setSex(existing.sex);
            setSpecies(existing.species);
            setVaccinated(existing.vaccinated);
            setSterilized(existing.sterilized);
            setDewormed(existing.dewormed);
            setBreed(existing.breed);
            setDescription(existing.description);
            setDiseases(existing.diseases);
            const phone = existing.contactPhone || "";
            if (phone.startsWith("+58")) {
              setPhoneCode("+58");
              setContactPhone(toLocalVePhone(phone));
            } else {
              setContactPhone(toLocalVePhone(phone));
            }
            setCity(existing.city);
            setMunicipality(existing.municipality);
            setPhotos(
              [0, 1, 2].map((i) => {
                const url = existing.photoDataUrls[i];
                if (!url) return null;
                return {
                  previewUrl: url,
                  file: dataUrlToFile(url, `foto-${i + 1}.jpg`),
                };
              }),
            );
            setMedicalExams(
              (existing.medicalExamDataUrls ?? []).slice(0, MAX_MEDICAL_EXAMS).map((url, i) => {
                const file = dataUrlToFile(url, `examen-${i + 1}`);
                const kind = file.type === "application/pdf" ? "pdf" : "image";
                return {
                  previewUrl: kind === "image" ? url : "",
                  file,
                  kind,
                };
              }),
            );
            const locked = getLitterLockedSpecies(existing.localId);
            setLockedSpecies(locked);
            if (locked) {
              setSpecies(locked);
              if (existing.species !== locked) setBreed("");
            }
          } else {
            const siblings = listLitterDrafts();
            const sample = siblings[0];
            const locked = getLitterLockedSpecies(localIdRef.current);
            setLockedSpecies(locked);
            if (locked) setSpecies(locked);
            setContactPhone(
              toLocalVePhone(sample?.contactPhone || me.phone || ""),
            );
            setCity(sample?.city || me.municipality || "");
            setMunicipality(sample?.municipality || me.state || "");
          }
        } else {
          setContactPhone(toLocalVePhone(me.phone || ""));
          setCity(me.municipality || "");
          setMunicipality(me.state || "");
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo verificar tu perfil.");
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingUser(false);
          setDraftReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [editingId, isLitter]);

  function openPhotoPicker(slot: number) {
    cropSlotRef.current = slot;
    if (prefersMobileImagePicker()) {
      setPhotoSourceOpen(true);
      return;
    }
    fileInputRef.current?.click();
  }

  function onFilePicked(file: File | null) {
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropFileName(file.name || "mascota.jpg");
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCrop() {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function onCropConfirm(file: File) {
    const slot = cropSlotRef.current;
    const previewUrl = URL.createObjectURL(file);
    setPhotos((prev) => {
      const next = [...prev];
      const old = next[slot];
      if (old?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(old.previewUrl);
      next[slot] = { file, previewUrl };
      return next;
    });
    closeCrop();
  }

  function removePhoto(slot: number) {
    setPhotos((prev) => {
      const next = [...prev];
      const old = next[slot];
      if (old?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(old.previewUrl);
      next[slot] = null;
      return next;
    });
  }

  function openExamPicker() {
    if (medicalExams.length >= MAX_MEDICAL_EXAMS) {
      fail(`Máximo ${MAX_MEDICAL_EXAMS} exámenes médicos.`, "field-exams");
      return;
    }
    examInputRef.current?.click();
  }

  function onExamsPicked(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const remaining = MAX_MEDICAL_EXAMS - medicalExams.length;
    const picked = Array.from(fileList).slice(0, remaining);
    if (examInputRef.current) examInputRef.current.value = "";

    const accepted: ExamSlot[] = [];

    for (const file of picked) {
      const kind = classifyExamFile(file);
      if (!kind) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      accepted.push({
        file,
        kind,
        previewUrl: kind === "image" ? URL.createObjectURL(file) : "",
      });
    }

    if (accepted.length === 0) {
      fail(
        "Los exámenes deben ser imagen o PDF (máx. 5 MB cada uno).",
        "field-exams",
      );
      return;
    }

    setMedicalExams((prev) => [...prev, ...accepted].slice(0, MAX_MEDICAL_EXAMS));
    setError("");
    setErrorField(null);
  }

  function removeExam(index: number) {
    setMedicalExams((prev) => {
      const next = [...prev];
      const old = next[index];
      if (old?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(old.previewUrl);
      next.splice(index, 1);
      return next;
    });
  }

  function fail(message: string, fieldId: string) {
    setError(message);
    setErrorField(fieldId);
    focusFormField(fieldId);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setErrorField(null);

    if (!user?.profileActivated) {
      fail(
        "Activa tu perfil (foto, cédula y selfie) antes de publicar.",
        "field-activation",
      );
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      fail("Escribe el nombre de tu mascota.", "field-name");
      return;
    }
    if (!species) {
      fail("Elige si es perro o gato.", "field-species");
      return;
    }
    if (isLitter) {
      const locked = getLitterLockedSpecies(localIdRef.current);
      if (locked && species !== locked) {
        fail(
          locked === "dog"
            ? "Esta camada es de perros: no puedes mezclar con gatos."
            : "Esta camada es de gatos: no puedes mezclar con perros.",
          "field-species",
        );
        return;
      }
    }
    if (!sex) {
      fail("Indica el sexo de la mascota.", "field-sex");
      return;
    }
    if (!size) {
      fail("Indica el tamaño (pequeña, mediana o grande).", "field-size");
      return;
    }
    if (vaccinated == null) {
      fail("Indica si ya está vacunado.", "field-vaccinated");
      return;
    }
    if (sterilized == null) {
      fail("Indica si está esterilizado.", "field-sterilized");
      return;
    }
    if (dewormed == null) {
      fail("Indica si fue desparasitado.", "field-dewormed");
      return;
    }
    if (!isValidVeMobile(contactPhone)) {
      fail(veMobileErrorMessage(), "field-phone");
      return;
    }
    if (city.trim().length < 2) {
      fail("Indica la ciudad.", "field-city");
      return;
    }
    if (municipality.trim().length < 2) {
      fail("Indica el municipio.", "field-municipality");
      return;
    }

    const photoFiles = photos
      .filter((p): p is PhotoSlot => Boolean(p))
      .map((p) => p.file);
    if (photoFiles.length < 1) {
      fail("Sube al menos una foto (máximo 3).", "field-photos");
      return;
    }
    if (medicalExams.length > MAX_MEDICAL_EXAMS) {
      fail(`Máximo ${MAX_MEDICAL_EXAMS} exámenes médicos.`, "field-exams");
      return;
    }
    const medicalExamFiles = medicalExams.map((e) => e.file);

    let years: number | undefined;
    let months: number | undefined;
    if (!ageUnknown) {
      const parsed = Number(ageValue);
      if (!Number.isInteger(parsed) || parsed < 0) {
        fail("La edad no es válida.", "field-age");
        return;
      }
      if (ageUnit === "months") {
        if (parsed > 36) {
          fail("Para más de 36 meses, usa años.", "field-age");
          return;
        }
        months = parsed;
      } else {
        if (parsed > 40) {
          fail("La edad no es válida.", "field-age");
          return;
        }
        years = parsed;
      }
    }

    if (isLitter && isLitterMother && sex === "male") {
      fail("La mamá de la camada debe ser hembra.", "field-mother");
      return;
    }

    const fullPhone = `${phoneCode}${toLocalVePhone(contactPhone)}`;

    setSaving(true);
    try {
      if (isLitter) {
        const photoDataUrls = await filesToDataUrls(photoFiles);
        const medicalExamDataUrls =
          medicalExamFiles.length > 0
            ? await filesToDataUrls(medicalExamFiles)
            : [];
        upsertLitterDraft({
          localId: localIdRef.current,
          name: trimmedName,
          ageYears: ageUnknown || ageUnit === "months" ? null : (years ?? null),
          ageMonths: ageUnknown || ageUnit === "years" ? null : (months ?? null),
          ageUnit,
          ageUnknown,
          isLitterMother,
          species,
          sex,
          size,
          breed,
          vaccinated,
          sterilized,
          dewormed,
          contactPhone: fullPhone,
          city: city.trim(),
          municipality: municipality.trim(),
          description: description.trim(),
          diseases: diseases.trim(),
          photoDataUrls,
          medicalExamDataUrls,
        });
        router.replace("/adopta/nueva/camada");
        return;
      }

      await createPet({
        name: trimmedName,
        ageYears: years,
        ageMonths: months,
        ageUnknown,
        species,
        sex,
        size,
        breed: breed || undefined,
        vaccinated,
        sterilized,
        dewormed,
        contactPhone: fullPhone,
        city: city.trim(),
        municipality: municipality.trim(),
        description: description.trim() || undefined,
        diseases: diseases.trim() || undefined,
        caseKind: "isolated",
        photos: photoFiles,
        medicalExams: medicalExamFiles,
      });
      router.replace("/adopta/puestos");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isLitter
            ? "No se pudo guardar en la camada."
            : "No se pudo publicar la mascota. Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
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
          <div className="relative z-10 mx-auto flex w-full max-w-[80rem] items-center gap-2">
            <Link
              href={backHref}
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
              <h1 className="text-[1.05rem] [font-weight:700]">
                {isLitter
                  ? editingId
                    ? "Editar mascota"
                    : "Agregar a la camada"
                  : "Caso aislado"}
              </h1>
              <p className="text-[0.75rem] text-white/85">
                {isLitter
                  ? "Se guarda en tu camada"
                  : "Completa la ficha y postea el caso"}
              </p>
            </div>
          </div>
        </header>

        {checkingUser || !draftReady ? (
          <p className="mx-auto w-full max-w-[80rem] px-4 py-8 text-[0.9rem] text-[var(--color-text-muted)] sm:px-6">
            Cargando...
          </p>
        ) : null}

        {!checkingUser && user && !user.profileActivated ? (
          <div
            id="field-activation"
            className="mx-auto w-full max-w-[80rem] px-4 py-6 sm:px-6"
          >
            <div className="rounded-[14px] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 px-4 py-5">
              <p className="text-[0.95rem] text-[var(--color-primary)] [font-weight:700]">
                Activa tu perfil para publicar
              </p>
              <p className="mt-1 text-[0.85rem] leading-snug text-[var(--color-text-muted)]">
                Necesitamos tu foto de perfil, cédula y selfie antes de poner
                mascotas en adopción.
              </p>
              <Link
                href="/perfil/verificacion"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-[0.85rem] text-white [font-weight:700]"
              >
                Ir a verificación
              </Link>
            </div>
          </div>
        ) : null}

        {!checkingUser && draftReady && user?.profileActivated ? (
          <form
            onSubmit={handleSubmit}
            className="mx-auto grid w-full max-w-[80rem] flex-1 grid-cols-1 gap-4 px-4 py-5 pb-28 sm:px-6 lg:grid-cols-2 lg:px-8"
            noValidate
          >
            <Section title="Datos de la mascota">
              <label id="field-name" className="block">
                <FieldLabel>Nombre</FieldLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Luna"
                  className={inputClass(errorField === "field-name")}
                  required
                />
              </label>

              <div id="field-species">
                <FieldLabel>Tipo de mascota</FieldLabel>
                <div
                  className={`flex flex-wrap gap-2 rounded-[10px] ${
                    errorField === "field-species"
                      ? "outline outline-2 outline-[var(--color-primary)] outline-offset-2"
                      : ""
                  }`}
                >
                  <Chip
                    selected={species === "dog"}
                    disabled={Boolean(lockedSpecies && lockedSpecies !== "dog")}
                    onClick={() => {
                      if (lockedSpecies && lockedSpecies !== "dog") return;
                      setSpecies("dog");
                      setBreed("");
                    }}
                  >
                    <DogIcon size={18} />
                    Perro
                  </Chip>
                  <Chip
                    selected={species === "cat"}
                    disabled={Boolean(lockedSpecies && lockedSpecies !== "cat")}
                    onClick={() => {
                      if (lockedSpecies && lockedSpecies !== "cat") return;
                      setSpecies("cat");
                      setBreed("");
                    }}
                  >
                    <CatIcon size={18} />
                    Gato
                  </Chip>
                </div>
                {isLitter && lockedSpecies ? (
                  <p className="mt-1.5 text-[0.72rem] text-[var(--color-text-muted)]">
                    La camada ya es de{" "}
                    {lockedSpecies === "dog" ? "perros" : "gatos"}; no se puede
                    mezclar.
                  </p>
                ) : null}
              </div>

              <div id="field-age" className="flex flex-wrap items-end gap-3">
                <label className="block w-[6.5rem] shrink-0">
                  <FieldLabel>
                    Edad ({ageUnit === "months" ? "meses" : "años"})
                  </FieldLabel>
                  <input
                    type="number"
                    min={0}
                    max={ageUnit === "months" ? 36 : 40}
                    value={ageValue}
                    disabled={ageUnknown}
                    onChange={(e) => setAgeValue(e.target.value)}
                    className={inputClass(
                      errorField === "field-age",
                      "px-3 text-center disabled:opacity-50",
                    )}
                  />
                </label>
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <Chip
                    selected={ageUnit === "years" && !ageUnknown}
                    onClick={() => {
                      setAgeUnknown(false);
                      setAgeUnit("years");
                    }}
                  >
                    Años
                  </Chip>
                  <Chip
                    selected={ageUnit === "months" && !ageUnknown}
                    onClick={() => {
                      setAgeUnknown(false);
                      setAgeUnit("months");
                    }}
                  >
                    Meses
                  </Chip>
                  <label className="inline-flex items-center gap-2 text-[0.8rem] text-[#666]">
                    <input
                      type="checkbox"
                      checked={ageUnknown}
                      onChange={(e) => setAgeUnknown(e.target.checked)}
                      className="accent-[var(--color-primary)]"
                    />
                    No estoy seguro
                  </label>
                </div>
              </div>

              {isLitter ? (
                <label
                  id="field-mother"
                  className={`flex cursor-pointer items-start gap-3 rounded-[12px] border px-3.5 py-3 ${
                    errorField === "field-mother"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[#ececec] bg-[#fafafa]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isLitterMother}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsLitterMother(checked);
                      if (checked) setSex("female");
                    }}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-[0.9rem] text-[#555] [font-weight:700]">
                      Es la mamá de la camada
                    </span>
                    <span className="mt-0.5 block text-[0.75rem] text-[var(--color-text-muted)]">
                      Marca solo a la madre. Solo puede haber una por camada.
                    </span>
                  </span>
                </label>
              ) : null}

              <div id="field-sex">
                <FieldLabel>Sexo de la mascota</FieldLabel>
                <div
                  className={`flex flex-wrap gap-2 rounded-[10px] ${
                    errorField === "field-sex"
                      ? "outline outline-2 outline-[var(--color-primary)] outline-offset-2"
                      : ""
                  }`}
                >                  <Chip
                    selected={sex === "female"}
                    tone="female"
                    onClick={() => setSex("female")}
                  >
                    <FemaleIcon />
                    Hembra
                  </Chip>
                  <Chip
                    selected={sex === "male"}
                    tone="male"
                    onClick={() => setSex("male")}
                  >
                    <MaleIcon />
                    Macho
                  </Chip>
                  <Chip selected={sex === "unknown"} onClick={() => setSex("unknown")}>
                    <UnknownSexIcon />
                    No sé
                  </Chip>
                </div>
              </div>

              <div id="field-size">
                <FieldLabel>Tamaño</FieldLabel>
                <div
                  className={`flex flex-wrap gap-2 rounded-[10px] ${
                    errorField === "field-size"
                      ? "outline outline-2 outline-[var(--color-primary)] outline-offset-2"
                      : ""
                  }`}
                >                  {(
                    [
                      ["small", "Pequeña · 3–10 kg"],
                      ["medium", "Mediana · 10–25 kg"],
                      ["large", "Grande · 25–50 kg"],
                    ] as const
                  ).map(([value, label]) => (
                    <Chip
                      key={value}
                      selected={size === value}
                      onClick={() => setSize(value)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>

              <label className="block">
                <FieldLabel>Raza</FieldLabel>
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  disabled={!species}
                  className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white disabled:opacity-50"
                >
                  <option value="">
                    {species ? "Selecciona una raza" : "Elige primero perro o gato"}
                  </option>
                  {breeds.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </Section>

            <Section title="Salud">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(
                  [
                    [
                      "Vacunación",
                      "field-vaccinated",
                      vaccinated,
                      setVaccinated,
                    ],
                    [
                      "Esterilización",
                      "field-sterilized",
                      sterilized,
                      setSterilized,
                    ],
                    [
                      "Desparasitación",
                      "field-dewormed",
                      dewormed,
                      setDewormed,
                    ],
                  ] as const
                ).map(([label, fieldId, value, setter]) => (
                  <div key={fieldId} id={fieldId}>
                    <FieldLabel>{label}</FieldLabel>
                    <div
                      className={`flex flex-wrap gap-2 rounded-[10px] ${
                        errorField === fieldId
                          ? "outline outline-2 outline-[var(--color-primary)] outline-offset-2"
                          : ""
                      }`}
                    >
                      <Chip
                        selected={value === true}
                        onClick={() => setter(true)}
                      >
                        Sí
                      </Chip>
                      <Chip
                        selected={value === false}
                        onClick={() => setter(false)}
                      >
                        No
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>

              <label className="block">
                <FieldLabel>Enfermedades</FieldLabel>
                <textarea
                  value={diseases}
                  onChange={(e) => setDiseases(e.target.value)}
                  rows={3}
                  placeholder="Ej. Ninguna conocida, o detalla si tiene alguna condición"
                  className="w-full resize-y rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-2.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                />
              </label>

              <div className="flex min-h-0 flex-1 flex-col">
                <FieldLabel>Exámenes médicos (opcional)</FieldLabel>
                {medicalExams.length === 0 ? (
                  <button
                    type="button"
                    id="field-exams"
                    onClick={openExamPicker}
                    className={`group flex min-h-[12rem] w-full flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed bg-[#fafafa] text-[var(--color-text-muted)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)] ${
                      errorField === "field-exams"
                        ? "border-[var(--color-primary)]"
                        : "border-[#d8d8d8]"
                    }`}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[0.8rem] [font-weight:600]">
                      Añadir exámenes médicos
                    </span>
                    <span className="px-3 text-center text-[0.68rem] opacity-80">
                      Fotos o PDF · hasta 5 archivos
                    </span>
                  </button>
                ) : (
                  <div
                    id="field-exams"
                    className={`grid min-h-[11rem] flex-1 grid-cols-2 content-start gap-2.5 sm:grid-cols-3 ${
                      errorField === "field-exams"
                        ? "rounded-[12px] outline outline-2 outline-[var(--color-primary)] outline-offset-2"
                        : ""
                    }`}
                  >
                    {medicalExams.map((exam, index) => {
                      const tall = index % 3 === 1;
                      return (
                        <div
                          key={`${exam.file.name}-${exam.file.size}-${index}`}
                          className={`relative overflow-hidden rounded-[12px] border border-[#ececec] bg-[#f7f7f7] ${
                            tall
                              ? "row-span-2 min-h-[14.5rem]"
                              : "min-h-[7rem]"
                          }`}
                        >
                          {exam.kind === "image" && exam.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={exam.previewUrl}
                              alt={`Examen ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[7rem] w-full flex-col items-center justify-center gap-1.5 px-2 py-3 text-center text-[var(--color-text-muted)]">
                              <svg
                                width="26"
                                height="26"
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
                                <path
                                  d="M9 13h6M9 16.5h4"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="line-clamp-2 text-[0.65rem] [font-weight:600]">
                                {exam.file.name || `Archivo ${index + 1}`}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExam(index)}
                            className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/55 text-[0.7rem] text-white transition hover:bg-black/75"
                            aria-label="Quitar examen"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {medicalExams.length < MAX_MEDICAL_EXAMS ? (
                      <button
                        type="button"
                        onClick={openExamPicker}
                        className="group flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-[#d8d8d8] bg-[#fafafa] text-[var(--color-text-muted)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[0.68rem] [font-weight:600]">
                          Añadir
                        </span>
                      </button>
                    ) : null}
                  </div>
                )}
                <input
                  ref={examInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => onExamsPicked(e.target.files)}
                />
              </div>
            </Section>

            <Section title="Descripción" hint="Cuenta su historia o personalidad.">
              <label className="block">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ej. Es juguetona, se lleva bien con niños..."
                  className="w-full resize-y rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-2.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                />
              </label>
            </Section>
            <Section
              title="Contacto y ubicación"
              hint="Así podrán contactarte por este caso."
            >
              <div id="field-phone" className="block">
                <FieldLabel>Número de celular</FieldLabel>
                <div
                  className={`flex h-11 overflow-hidden rounded-[10px] border bg-[#fafafa] focus-within:bg-white ${
                    errorField === "field-phone"
                      ? "border-[var(--color-primary)]"
                      : "border-[#e8e8e8] focus-within:border-[var(--color-primary)]"
                  }`}
                >
                  <label className="relative flex shrink-0 items-center border-r border-[#e8e8e8] bg-[#f3f3f3] px-2">
                    <span className="sr-only">Código de país</span>
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="cursor-pointer appearance-none bg-transparent py-2 pr-5 pl-1 text-[0.9rem] text-[#555] outline-none [font-weight:600]"
                      aria-label="Código de país"
                    >
                      <option value="+58">🇻🇪 +58</option>
                    </select>
                    <span
                      className="pointer-events-none absolute right-1.5 text-[#999]"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={contactPhone}
                    onChange={(e) =>
                      setContactPhone(toLocalVePhone(e.target.value))
                    }
                    placeholder="4121234567"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-[0.95rem] outline-none"
                    required
                  />
                </div>
              </div>
              <label id="field-city" className="block">
                <FieldLabel>Ciudad</FieldLabel>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Caracas"
                  className={inputClass(errorField === "field-city")}
                  required
                />
              </label>
              <label id="field-municipality" className="block">
                <FieldLabel>Municipio</FieldLabel>
                <input
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="Ej. Libertador"
                  className={inputClass(errorField === "field-municipality")}
                  required
                />
              </label>
            </Section>

            <Section
              title="Fotos de la mascota"
              hint="Máximo 3 fotos. Buena luz y que se vea bien."
            >
              <div
                id="field-photos"
                className={`grid grid-cols-3 gap-2.5 rounded-[12px] ${
                  errorField === "field-photos"
                    ? "outline outline-2 outline-[var(--color-primary)] outline-offset-2"
                    : ""
                }`}
              >
                {photos.map((slot, index) => (
                  <div key={index} className="relative aspect-square">
                    {slot ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.previewUrl}
                          alt={`Foto ${index + 1}`}
                          className="h-full w-full rounded-[12px] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/55 text-[0.7rem] text-white transition hover:bg-black/75"
                          aria-label="Quitar foto"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() => openPhotoPicker(index)}
                          className="absolute inset-x-1.5 bottom-1.5 cursor-pointer rounded-full bg-black/45 py-1 text-[0.65rem] text-white transition hover:bg-black/65 [font-weight:600]"
                        >
                          Cambiar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openPhotoPicker(index)}
                        className="group flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-[#d8d8d8] bg-[#fafafa] text-[var(--color-text-muted)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <rect
                            x="3.5"
                            y="5.5"
                            width="17"
                            height="13"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                          <circle cx="9" cy="11" r="1.6" fill="currentColor" />
                          <path
                            d="m8 16.5 3.2-3.2 2.2 2.2 2.8-3.5 3.3 4.5"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-[0.68rem] [font-weight:600]">Añadir</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
              />
            </Section>

            <Button
              type="submit"
              disabled={saving}
              className="mt-1 h-11 w-full text-[0.9rem] lg:col-span-2"
            >
              {saving
                ? isLitter
                  ? "Guardando..."
                  : "Publicando..."
                : isLitter
                  ? "Guardar en camada"
                  : "Postear caso"}
            </Button>
          </form>
        ) : null}

        <AnimatePresence>
          {error ? (
            <motion.div
              key="form-error"
              role="alert"
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "110%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
            >
              <div className="mx-auto flex max-w-[80rem] items-start gap-3 rounded-[14px] border border-[var(--color-primary)]/25 bg-white px-4 py-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                <p className="min-w-0 flex-1 text-[0.88rem] leading-snug text-[var(--color-primary)] [font-weight:600]">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setErrorField(null);
                  }}
                  className="shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-[1.1rem] leading-none text-[var(--color-primary)]/70 transition hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {cropSrc ? (
          <ImageCropModal
            imageSrc={cropSrc}
            fileName={cropFileName}
            circular={false}
            title="Recorta la foto"
            onCancel={closeCrop}
            onConfirm={onCropConfirm}
          />
        ) : null}

        <ImageSourceSheet
          open={photoSourceOpen}
          onClose={() => setPhotoSourceOpen(false)}
          onFile={(file) => onFilePicked(file)}
          title="Foto de la mascota"
          captureFacing="environment"
        />
      </main>
    </AppChrome>
  );
}
