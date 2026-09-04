import type { PetSex, PetSize, PetSpecies } from "@/lib/api";

const STORAGE_KEY = "mimanada_litter_draft_v2";
const LEGACY_KEY = "mimanada_litter_draft_v1";

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

export type LitterLinkedPet = {
  petId: string;
  name: string;
  species: PetSpecies;
  sex: PetSex;
  size: PetSize;
  breed?: string | null;
  photoUrl: string | null;
  isLitterMother: boolean;
};

export type LitterCart = {
  id: string;
  title: string;
  createdAt: number;
  items: LitterDraftItem[];
  linkedPets: LitterLinkedPet[];
};

type Store = {
  carts: LitterCart[];
};

function normalizeItem(item: LitterDraftItem): LitterDraftItem {
  return {
    ...item,
    medicalExamDataUrls: item.medicalExamDataUrls ?? [],
  };
}

function migrateLegacy(): LitterCart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LitterDraftItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      sessionStorage.removeItem(LEGACY_KEY);
      return [];
    }
    const cart: LitterCart = {
      id: newLitterCartId(),
      title: "Camada 1",
      createdAt: Date.now(),
      items: parsed.map(normalizeItem),
      linkedPets: [],
    };
    sessionStorage.removeItem(LEGACY_KEY);
    return [cart];
  } catch {
    return [];
  }
}

function readStore(): Store {
  if (typeof window === "undefined") return { carts: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migrated = migrateLegacy();
      if (migrated.length > 0) {
        const store = { carts: migrated };
        writeStore(store);
        return store;
      }
      return { carts: [] };
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || !Array.isArray(parsed.carts)) return { carts: [] };
    return {
      carts: parsed.carts.map((cart) => ({
        ...cart,
        linkedPets: cart.linkedPets ?? [],
        items: (cart.items ?? []).map(normalizeItem),
      })),
    };
  } catch {
    return { carts: [] };
  }
}

function writeStore(store: Store) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function newLitterCartId() {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newLitterLocalId() {
  return `litter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listLitterCarts(): LitterCart[] {
  return readStore().carts.sort((a, b) => b.createdAt - a.createdAt);
}

export function getLitterCart(cartId: string): LitterCart | null {
  return readStore().carts.find((cart) => cart.id === cartId) ?? null;
}

export function getLitterMotherName(cart: LitterCart): string | null {
  const draft = cart.items.find((item) => item.isLitterMother);
  if (draft?.name.trim()) return draft.name.trim();
  const linked = cart.linkedPets.find((pet) => pet.isLitterMother);
  return linked?.name.trim() || null;
}

export function litterCartDisplayTitle(cart: LitterCart): string {
  const mother = getLitterMotherName(cart);
  if (mother) return `Camada de ${mother}`;
  if (/^Camada de /i.test(cart.title)) return "Camada";
  return cart.title.trim() || "Camada";
}

function syncCartTitleFromMother(cart: LitterCart) {
  cart.title = litterCartDisplayTitle(cart);
}

export function createLitterCart(title?: string): LitterCart {
  const store = readStore();
  const cart: LitterCart = {
    id: newLitterCartId(),
    title: title?.trim() || `Camada ${store.carts.length + 1}`,
    createdAt: Date.now(),
    items: [],
    linkedPets: [],
  };
  store.carts.push(cart);
  writeStore(store);
  return cart;
}

export function renameLitterCart(cartId: string, title: string) {
  const store = readStore();
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return;
  cart.title = title.trim() || cart.title;
  writeStore(store);
}

export function deleteLitterCart(cartId: string) {
  const store = readStore();
  writeStore({ carts: store.carts.filter((c) => c.id !== cartId) });
}

export function listLitterDrafts(cartId: string): LitterDraftItem[] {
  return getLitterCart(cartId)?.items ?? [];
}

export function getLitterDraft(
  cartId: string,
  localId: string,
): LitterDraftItem | null {
  return listLitterDrafts(cartId).find((item) => item.localId === localId) ?? null;
}

export function getLitterLockedSpecies(
  cartId: string,
  excludeLocalId?: string | null,
): PetSpecies | null {
  const cart = getLitterCart(cartId);
  if (!cart) return null;
  const draft = cart.items.find((item) => item.localId !== excludeLocalId);
  if (draft) return draft.species;
  return cart.linkedPets[0]?.species ?? null;
}

export function hasLitterMother(
  cartId: string,
  excludeLocalId?: string | null,
  excludePetId?: string | null,
): boolean {
  const cart = getLitterCart(cartId);
  if (!cart) return false;
  if (
    cart.items.some(
      (item) => item.isLitterMother && item.localId !== excludeLocalId,
    )
  ) {
    return true;
  }
  return cart.linkedPets.some(
    (pet) => pet.isLitterMother && pet.petId !== excludePetId,
  );
}

export function upsertLitterDraft(cartId: string, item: LitterDraftItem) {
  const store = readStore();
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return;

  let items = cart.items;
  let linkedPets = cart.linkedPets;
  if (item.isLitterMother) {
    items = items.map((x) => ({ ...x, isLitterMother: false }));
    linkedPets = linkedPets.map((x) => ({ ...x, isLitterMother: false }));
  }
  const index = items.findIndex((x) => x.localId === item.localId);
  if (index === -1) items = [...items, item];
  else {
    items = [...items];
    items[index] = item;
  }
  cart.items = items;
  cart.linkedPets = linkedPets;
  syncCartTitleFromMother(cart);
  writeStore(store);
}

export function removeLitterDraft(cartId: string, localId: string) {
  const store = readStore();
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return;
  cart.items = cart.items.filter((item) => item.localId !== localId);
  syncCartTitleFromMother(cart);
  writeStore(store);
}

export function linkPublishedPet(cartId: string, pet: LitterLinkedPet) {
  const store = readStore();
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return { ok: false as const, error: "Camada no encontrada." };

  if (cart.linkedPets.some((x) => x.petId === pet.petId)) {
    return { ok: false as const, error: "Esa mascota ya está en la camada." };
  }
  if (cart.items.some((x) => x.name === pet.name && x.photoDataUrls.length === 0)) {
    // no-op name check; allow
  }

  const locked = getLitterLockedSpecies(cartId);
  if (locked && pet.species !== locked) {
    return {
      ok: false as const,
      error:
        locked === "dog"
          ? "Esta camada es de perros."
          : "Esta camada es de gatos.",
    };
  }

  let linkedPets = cart.linkedPets;
  let items = cart.items;
  if (pet.isLitterMother) {
    linkedPets = linkedPets.map((x) => ({ ...x, isLitterMother: false }));
    items = items.map((x) => ({ ...x, isLitterMother: false }));
  } else if (hasLitterMother(cartId) && pet.isLitterMother) {
    return { ok: false as const, error: "Ya hay una mamá en esta camada." };
  }

  cart.items = items;
  cart.linkedPets = [...linkedPets, pet];
  syncCartTitleFromMother(cart);
  writeStore(store);
  return { ok: true as const };
}

export function unlinkPublishedPet(cartId: string, petId: string) {
  const store = readStore();
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return;
  cart.linkedPets = cart.linkedPets.filter((pet) => pet.petId !== petId);
  syncCartTitleFromMother(cart);
  writeStore(store);
}

export function setLinkedPetMother(
  cartId: string,
  petId: string,
  isLitterMother: boolean,
) {
  const store = readStore();
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return;
  if (isLitterMother) {
    cart.items = cart.items.map((x) => ({ ...x, isLitterMother: false }));
    cart.linkedPets = cart.linkedPets.map((x) => ({
      ...x,
      isLitterMother: x.petId === petId,
    }));
  } else {
    cart.linkedPets = cart.linkedPets.map((x) =>
      x.petId === petId ? { ...x, isLitterMother: false } : x,
    );
  }
  syncCartTitleFromMother(cart);
  writeStore(store);
}

export function clearLitterCart(cartId: string) {
  deleteLitterCart(cartId);
}

/** @deprecated use clearLitterCart */
export function clearLitterDrafts() {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_KEY);
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
