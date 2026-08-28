import type { PetSex, PetSize, PetSpecies } from "@/lib/api";

const STORAGE_KEY = "mimanada_litter_draft_v1";

export type LitterDraftItem = {
  localId: string;
  name: string;
  ageYears: number | null;
  ageMonths: number | null;
  ageUnit: "years" | "months";
  ageUnknown: boolean;
  isLitterMother: boolean;
  species: PetSpecies;
  sex: PetSex;
  size: PetSize;
  breed: string;
  vaccinated: boolean;
  sterilized: boolean;
  dewormed: boolean;
  contactPhone: string;
  city: string;
  municipality: string;
  description: string;
  diseases: string;
  photoDataUrls: string[];
  medicalExamDataUrls: string[];
};

function readAll(): LitterDraftItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LitterDraftItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      medicalExamDataUrls: item.medicalExamDataUrls ?? [],
    }));
  } catch {
    return [];
  }
}

function writeAll(items: LitterDraftItem[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listLitterDrafts(): LitterDraftItem[] {
  return readAll();
}

/** Especie fija de la camada (si ya hay al menos una mascota distinta a excludeId). */
export function getLitterLockedSpecies(
  excludeLocalId?: string | null,
): PetSpecies | null {
  const items = readAll().filter((item) => item.localId !== excludeLocalId);
  return items[0]?.species ?? null;
}

export function getLitterDraft(localId: string): LitterDraftItem | null {
  return readAll().find((item) => item.localId === localId) ?? null;
}

export function upsertLitterDraft(item: LitterDraftItem) {
  let items = readAll();
  if (item.isLitterMother) {
    items = items.map((x) => ({ ...x, isLitterMother: false }));
  }
  const index = items.findIndex((x) => x.localId === item.localId);
  if (index === -1) items.push(item);
  else items[index] = item;
  writeAll(items);
}

export function removeLitterDraft(localId: string) {
  writeAll(readAll().filter((item) => item.localId !== localId));
}

export function clearLitterDrafts() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function newLitterLocalId() {
  return `litter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("No se pudo leer la foto."));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export function dataUrlToFile(dataUrl: string, name: string): File {
  const [header, data] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}
