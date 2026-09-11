const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/+$/,
  "",
);
const TOKEN_KEY = "mimanada_token";

export type IdentityStatus =
  | "incomplete"
  | "submitted"
  | "verified"
  | "rejected";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  age: number | null;
  userType: "persona" | "fundacion" | "proveedor";
  emailConfirmed: boolean;
  state: string | null;
  municipality: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  profilePhotoUrl: string | null;
  idCardPhotoUrl: string | null;
  selfiePhotoUrl: string | null;
  identityStatus: IdentityStatus;
  profileActivated: boolean;
  documentsComplete: boolean;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Same-origin for uploads: Vercel/Next rewrite proxies to the API (avoids mixed content).
  if (normalized.startsWith("/uploads/")) {
    return normalized;
  }
  return `${API_URL}${normalized}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `mimanada_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "mimanada_token=; path=/; max-age=0; SameSite=Lax";
  clearClientCaches();
}

let meCache: AuthUser | null = null;
let meInflight: Promise<AuthUser> | null = null;

export function clearClientCaches() {
  meCache = null;
  meInflight = null;
  clearPublishedPetsCache();
}

export function peekMe(): AuthUser | null {
  return meCache;
}

function setMeCache(user: AuthUser) {
  meCache = user;
  return user;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(init?.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...init?.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) {
        message = data.message.join(", ");
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  userType: "persona" | "fundacion" | "proveedor";
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMe(): Promise<AuthUser> {
  if (meCache) {
    if (!meInflight) {
      meInflight = apiFetch<AuthUser>("/auth/me")
        .then(setMeCache)
        .finally(() => {
          meInflight = null;
        });
    }
    return meCache;
  }
  if (meInflight) return meInflight;
  meInflight = apiFetch<AuthUser>("/auth/me")
    .then(setMeCache)
    .finally(() => {
      meInflight = null;
    });
  return meInflight;
}

export async function updateMe(input: {
  fullName?: string;
  phone?: string;
  age?: number;
  state?: string;
  municipality?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
}): Promise<AuthUser> {
  const updated = await apiFetch<AuthUser>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return setMeCache(updated);
}

export async function uploadIdentityPhoto(
  kind: "profile" | "id_card" | "selfie",
  file: File,
): Promise<AuthUser> {
  const body = new FormData();
  body.append("file", file);
  const updated = await apiFetch<AuthUser>(`/auth/me/photos/${kind}`, {
    method: "POST",
    body,
  });
  return setMeCache(updated);
}

export async function changePasswordRequest(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type PetSpecies = "dog" | "cat";
export type PetSex = "female" | "male" | "unknown";
export type PetSize = "small" | "medium" | "large" | "giant" | "unknown";
export type PetStatus = "published" | "closed";
export type PetCaseKind = "isolated" | "litter";

export type Pet = {
  id: string;
  ownerId: string;
  name: string;
  ageYears: number | null;
  ageMonths: number | null;
  ageUnknown: boolean;
  isLitterMother: boolean;
  species: PetSpecies;
  sex: PetSex;
  size: PetSize;
  breed: string | null;
  vaccinated: boolean | null;
  sterilized: boolean | null;
  dewormed: boolean | null;
  contactPhone: string | null;
  city: string | null;
  municipality: string | null;
  description: string | null;
  diseases: string | null;
  litterGroupId: string | null;
  caseKind: PetCaseKind;
  photoUrls: string[];
  medicalExamUrls: string[];
  status: PetStatus;
  createdAt: string;
  updatedAt: string;
  owner?: PublicUserProfile | null;
};

export type PublicUserProfile = {
  id: string;
  fullName: string;
  phone: string | null;
  userType: "persona" | "fundacion" | "proveedor";
  state: string | null;
  municipality: string | null;
  addressLine: string | null;
  profilePhotoUrl: string | null;
  speciesFocus?: PetSpecies[];
};

export type CreatePetInput = {
  name: string;
  ageYears?: number;
  ageMonths?: number;
  ageUnknown?: boolean;
  isLitterMother?: boolean;
  species: PetSpecies;
  sex: PetSex;
  size: PetSize;
  breed?: string;
  vaccinated?: boolean;
  sterilized?: boolean;
  dewormed?: boolean;
  contactPhone: string;
  city: string;
  municipality: string;
  description?: string;
  diseases?: string;
  litterGroupId?: string;
  caseKind?: PetCaseKind;
  photos: File[];
  medicalExams?: File[];
  existingPhotoUrls?: string[];
  existingMedicalExamUrls?: string[];
};

function appendPetFormData(input: CreatePetInput): FormData {
  const body = new FormData();
  body.append("name", input.name);
  if (input.ageUnknown) {
    body.append("ageUnknown", "true");
  } else {
    body.append("ageUnknown", "false");
    if (input.ageMonths != null) {
      body.append("ageMonths", String(input.ageMonths));
    } else if (input.ageYears != null) {
      body.append("ageYears", String(input.ageYears));
    }
  }
  if (input.isLitterMother) body.append("isLitterMother", "true");
  body.append("species", input.species);
  body.append("sex", input.sex);
  body.append("size", input.size);
  if (input.breed) body.append("breed", input.breed);
  if (input.vaccinated != null) body.append("vaccinated", String(input.vaccinated));
  if (input.sterilized != null) body.append("sterilized", String(input.sterilized));
  if (input.dewormed != null) body.append("dewormed", String(input.dewormed));
  body.append("contactPhone", input.contactPhone);
  body.append("city", input.city);
  body.append("municipality", input.municipality);
  if (input.description) body.append("description", input.description);
  if (input.diseases) body.append("diseases", input.diseases);
  if (input.litterGroupId) body.append("litterGroupId", input.litterGroupId);
  if (input.caseKind) body.append("caseKind", input.caseKind);
  if (input.existingPhotoUrls) {
    body.append("existingPhotoUrls", JSON.stringify(input.existingPhotoUrls));
  }
  if (input.existingMedicalExamUrls) {
    body.append(
      "existingMedicalExamUrls",
      JSON.stringify(input.existingMedicalExamUrls),
    );
  }
  for (const photo of input.photos) {
    body.append("photos", photo);
  }
  for (const exam of input.medicalExams ?? []) {
    body.append("medicalExams", exam);
  }
  return body;
}

export async function createPet(input: CreatePetInput): Promise<Pet> {
  const pet = await apiFetch<Pet>("/pets", {
    method: "POST",
    body: appendPetFormData(input),
  });
  clearPublishedPetsCache();
  return pet;
}

export async function updatePet(
  id: string,
  input: CreatePetInput,
): Promise<Pet> {
  const pet = await apiFetch<Pet>(`/pets/${id}`, {
    method: "PATCH",
    body: appendPetFormData(input),
  });
  clearPublishedPetsCache();
  return pet;
}

export async function getMyPets(): Promise<Pet[]> {
  return apiFetch<Pet[]>("/pets/mine");
}

export async function deletePet(id: string): Promise<{ ok: true }> {
  const result = await apiFetch<{ ok: true }>(`/pets/${id}`, {
    method: "DELETE",
  });
  clearPublishedPetsCache();
  return result;
}

export async function updatePetStatus(
  id: string,
  status: PetStatus,
): Promise<Pet> {
  const pet = await apiFetch<Pet>(`/pets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  clearPublishedPetsCache();
  return pet;
}

export async function attachPetToLitter(
  petId: string,
  litterGroupId: string,
  isLitterMother?: boolean,
): Promise<Pet> {
  const pet = await apiFetch<Pet>(`/pets/${petId}/litter`, {
    method: "PATCH",
    body: JSON.stringify({
      litterGroupId,
      ...(isLitterMother != null ? { isLitterMother } : {}),
    }),
  });
  clearPublishedPetsCache();
  return pet;
}

let publishedPetsCache: Pet[] | null = null;
let publishedPetsInflight: Promise<Pet[]> | null = null;

export function clearPublishedPetsCache() {
  publishedPetsCache = null;
  publishedPetsInflight = null;
}

export function peekPublishedPets(): Pet[] | null {
  return publishedPetsCache;
}

export async function getPublishedPets(): Promise<Pet[]> {
  if (publishedPetsCache) {
    if (!publishedPetsInflight) {
      publishedPetsInflight = apiFetch<Pet[]>("/pets")
        .then((pets) => {
          publishedPetsCache = pets;
          return pets;
        })
        .finally(() => {
          publishedPetsInflight = null;
        });
    }
    return publishedPetsCache;
  }
  if (publishedPetsInflight) return publishedPetsInflight;
  publishedPetsInflight = apiFetch<Pet[]>("/pets")
    .then((pets) => {
      publishedPetsCache = pets;
      return pets;
    })
    .finally(() => {
      publishedPetsInflight = null;
    });
  return publishedPetsInflight;
}

export async function getPet(id: string): Promise<Pet> {
  return apiFetch<Pet>(`/pets/${id}`);
}

export async function getPetSiblings(id: string): Promise<Pet[]> {
  return apiFetch<Pet[]>(`/pets/${id}/siblings`);
}

export type AdoptionRequest = {
  id: string;
  petId: string;
  requesterId: string;
  ownerId: string;
  message: string | null;
  status: "pending" | "closed";
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  petName?: string | null;
  requesterName?: string | null;
  requesterPhone?: string | null;
};

export async function createAdoptionRequest(
  petId: string,
  message?: string,
): Promise<AdoptionRequest> {
  return apiFetch<AdoptionRequest>(`/pets/${petId}/adoption-requests`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {}),
  });
}

export async function getMyAdoptionRequestForPet(
  petId: string,
): Promise<AdoptionRequest | null> {
  return apiFetch<AdoptionRequest | null>(
    `/pets/${petId}/adoption-requests/mine`,
  );
}

export async function getSentAdoptionRequests(): Promise<AdoptionRequest[]> {
  return apiFetch<AdoptionRequest[]>("/adoption-requests/sent");
}

export async function getReceivedAdoptionRequests(): Promise<
  AdoptionRequest[]
> {
  return apiFetch<AdoptionRequest[]>("/adoption-requests/received");
}

export async function getPublicUser(id: string): Promise<PublicUserProfile> {
  return apiFetch<PublicUserProfile>(`/users/${id}/public`);
}

export async function getHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
