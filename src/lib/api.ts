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
  role?: "user" | "admin";
  accountStatus?: "active" | "warned" | "suspended" | "banned";
  warnCount?: number;
  suspendedUntil?: string | null;
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
  /** true si eligió fundación en el registro (crear Foundation con bootstrap). */
  createFoundation?: boolean;
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
  if (typeof window !== "undefined") {
    void import("@/lib/notifications-socket").then((mod) =>
      mod.disconnectNotificationsSocket(),
    );
    void import("@/lib/favorites").then((mod) => mod.clearFavoriteIdsCache());
  }
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

export type PetFoundationSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type Pet = {
  id: string;
  ownerId: string;
  foundationId: string | null;
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
  foundation?: PetFoundationSummary | null;
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
  foundationId?: string;
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
  if (input.foundationId) body.append("foundationId", input.foundationId);
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

export type AdoptionRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "closed";

export type AdoptionRequest = {
  id: string;
  petId: string;
  requesterId: string;
  ownerId: string;
  message: string | null;
  responseMessage?: string | null;
  status: AdoptionRequestStatus;
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
    body: JSON.stringify(message?.trim() ? { message: message.trim() } : {}),
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

export async function updateAdoptionRequestStatus(
  id: string,
  status: Exclude<AdoptionRequestStatus, "pending">,
  responseMessage?: string,
): Promise<AdoptionRequest> {
  return apiFetch<AdoptionRequest>(`/adoption-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(responseMessage?.trim()
        ? { responseMessage: responseMessage.trim() }
        : {}),
    }),
  });
}

export type AppNotification = {
  id: string;
  type:
    | "adoption_request"
    | "adoption_accepted"
    | "adoption_rejected"
    | "moderation";
  title: string;
  body: string;
  linkHref: string | null;
  petId: string | null;
  petPhotoUrl?: string | null;
  adoptionRequestId: string | null;
  readAt: string | null;
  createdAt: string;
};

/** Sanciones de cuenta (advertencias, suspensiones, etc.), no pubs. */
export function isAccountWarningNotification(item: AppNotification) {
  return item.type === "moderation" && !item.petId;
}

export async function getNotifications(limit = 40): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>(`/notifications?limit=${limit}`);
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationRead(
  id: string,
): Promise<AppNotification | null> {
  return apiFetch<AppNotification | null>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/notifications/read-all", {
    method: "POST",
  });
}

export type FoundationMemberRole = "owner" | "admin" | "member";

export type FoundationMembershipStatus = "pending" | "active" | "removed";

export type Foundation = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  state: string | null;
  municipality: string | null;
  rifNumber: string | null;
  rifDocumentUrl: string | null;
  fiscalAddress: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  mercantileRegistry: string | null;
  mercantileRegistryDocumentUrl: string | null;
  inviteCode: string | null;
  status: "active" | "suspended";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number | null;
  myRole: FoundationMemberRole | null;
  myCanPublish: boolean;
  myMembershipStatus: FoundationMembershipStatus | null;
};

export type FoundationMember = {
  id: string;
  foundationId: string;
  userId: string;
  role: FoundationMemberRole;
  status: FoundationMembershipStatus;
  canPublish: boolean;
  fullName: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FoundationInput = {
  name: string;
  description?: string;
  state?: string;
  municipality?: string;
  rifNumber?: string;
  fiscalAddress?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  mercantileRegistry?: string;
};

export async function getMyFoundations() {
  return apiFetch<Foundation[]>("/foundations/mine");
}

export async function getPublishableFoundations() {
  return apiFetch<Foundation[]>("/foundations/publishable");
}

export async function getFoundationBySlug(slug: string) {
  return apiFetch<Foundation>(
    `/foundations/by-slug/${encodeURIComponent(slug)}`,
  );
}

export async function joinFoundation(input: {
  foundationId?: string;
  inviteCode?: string;
}) {
  return apiFetch<FoundationMember>("/foundations/join", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getFoundationMembers(foundationId: string) {
  return apiFetch<FoundationMember[]>(`/foundations/${foundationId}/members`);
}

export async function rotateFoundationInviteCode(foundationId: string) {
  return apiFetch<Foundation>(
    `/foundations/${foundationId}/invite-code/rotate`,
    { method: "POST" },
  );
}

export async function updateFoundationMember(
  foundationId: string,
  memberId: string,
  input: {
    status?: "active" | "rejected" | "removed";
    role?: "admin" | "member";
    canPublish?: boolean;
  },
) {
  return apiFetch<FoundationMember>(
    `/foundations/${foundationId}/members/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function getPetsByFoundation(foundationId: string) {
  return apiFetch<Pet[]>(`/pets/by-foundation/${foundationId}`);
}

export async function createFoundation(input: FoundationInput) {
  return apiFetch<Foundation>("/foundations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Crea fundación mínima al registrarse (sin RIF; se completa después). */
export async function bootstrapFoundation(input: {
  name: string;
  phone?: string;
}) {
  return apiFetch<Foundation>("/foundations/bootstrap", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type FoundationPanel = {
  foundation: Foundation;
  kpis: {
    petsPublished: number;
    petsClosed: number;
    petsTotal: number;
    pendingAdoptionRequests: number;
    membersActive: number;
    membersPending: number;
  };
  pets: Array<{
    id: string;
    name: string;
    species: string;
    status: PetStatus;
    caseKind: string;
    photoUrl: string | null;
    createdAt: string;
    ownerId: string;
  }>;
};

export async function getFoundationPanel(foundationId: string) {
  return apiFetch<FoundationPanel>(`/foundations/${foundationId}/panel`);
}

export async function bulkFoundationPetStatus(
  foundationId: string,
  petIds: string[],
  status: "published" | "closed",
) {
  return apiFetch<{
    ok: boolean;
    updated: number;
    status: PetStatus;
    petIds: string[];
  }>(`/foundations/${foundationId}/pets/bulk-status`, {
    method: "POST",
    body: JSON.stringify({ petIds, status }),
  });
}

export async function updateFoundation(
  id: string,
  input: Partial<FoundationInput> & { slug?: string },
) {
  return apiFetch<Foundation>(`/foundations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function uploadFoundationLogo(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<Foundation>(`/foundations/${id}/logo`, {
    method: "POST",
    body: form,
  });
}

export async function uploadFoundationRifDocument(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<Foundation>(`/foundations/${id}/rif-document`, {
    method: "POST",
    body: form,
  });
}

export async function uploadFoundationMercantileDocument(
  id: string,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<Foundation>(`/foundations/${id}/mercantile-document`, {
    method: "POST",
    body: form,
  });
}

export type ModerationAppealStatus = "pending" | "accepted" | "rejected";

export type ModerationAppeal = {
  id: string;
  status: ModerationAppealStatus;
  message: string;
  adminResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
  petId: string;
  petName: string | null;
  petPhotoUrl: string | null;
  petModerationStatus: string | null;
  userId: string;
  userName: string | null;
  resolvedByAdminName: string | null;
};

export async function createPetAppeal(petId: string, message: string) {
  return apiFetch<ModerationAppeal>(`/pets/${petId}/appeals`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getMyAppeals() {
  return apiFetch<ModerationAppeal[]>("/appeals/mine");
}

export async function getAdminAppeals(status?: ModerationAppealStatus) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ModerationAppeal[]>(`/admin/appeals${qs}`);
}

export async function resolveAdminAppeal(
  id: string,
  action: "accept" | "reject",
  response?: string,
) {
  return apiFetch<ModerationAppeal>(`/admin/appeals/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action, response }),
  });
}

export async function getFavoritePets(): Promise<Pet[]> {
  return apiFetch<Pet[]>("/favorites");
}

export async function getFavoriteIds(): Promise<string[]> {
  const data = await apiFetch<{ ids: string[] }>("/favorites/ids");
  return data.ids;
}

export async function getIsFavorite(
  petId: string,
): Promise<{ favorited: boolean }> {
  return apiFetch<{ favorited: boolean }>(`/favorites/${petId}`);
}

export async function addFavorite(
  petId: string,
): Promise<{ ok: boolean; favorited: boolean }> {
  return apiFetch<{ ok: boolean; favorited: boolean }>(`/favorites/${petId}`, {
    method: "POST",
  });
}

export async function removeFavorite(
  petId: string,
): Promise<{ ok: boolean; favorited: boolean }> {
  return apiFetch<{ ok: boolean; favorited: boolean }>(`/favorites/${petId}`, {
    method: "DELETE",
  });
}

export async function getPublicUser(id: string): Promise<PublicUserProfile> {
  return apiFetch<PublicUserProfile>(`/users/${id}/public`);
}

export async function getHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}

/* ——— Admin / Moderación ——— */

export type PetModerationStatus =
  | "active"
  | "needs_review"
  | "hidden"
  | "deleted"
  | "blocked";

export type ReportReason =
  | "inappropriate"
  | "not_pets"
  | "spam"
  | "false_info"
  | "animal_abuse"
  | "offensive_image"
  | "other";

export type ReportStatus =
  | "pending"
  | "reviewed"
  | "dismissed"
  | "action_taken";

export type ModerationActionType =
  | "POST_APPROVED"
  | "POST_HIDDEN"
  | "POST_DELETED"
  | "POST_RESTORED"
  | "POST_BLOCKED"
  | "POST_FLAGGED_REVIEW"
  | "USER_WARNED"
  | "USER_SUSPENDED"
  | "USER_BANNED"
  | "USER_REACTIVATED"
  | "USER_IDENTITY_VERIFIED"
  | "USER_IDENTITY_REJECTED"
  | "REPORT_DISMISSED"
  | "REPORT_ACTION_TAKEN"
  | "ADOPTION_CLOSED"
  | "APPEAL_SUBMITTED"
  | "APPEAL_ACCEPTED"
  | "APPEAL_REJECTED";

export type AdminPet = {
  id: string;
  name: string;
  description: string | null;
  species: PetSpecies;
  photoUrls: string[];
  city: string | null;
  municipality: string | null;
  status: PetStatus;
  moderationStatus: PetModerationStatus;
  moderationScanStatus: string;
  moderationData: Record<string, number> | null;
  reportCount: number;
  queueReason?: string | null;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminDashboard = {
  totals: {
    totalPets: number;
    needsReview: number;
    reported: number;
    deleted: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingReports: number;
  };
  recentActivity: Array<{
    id: string;
    action: ModerationActionType;
    reason: string | null;
    createdAt: string;
    adminName: string | null;
    targetUserName: string | null;
    petName: string | null;
    petId: string | null;
    targetUserId: string | null;
  }>;
};

export type AdminPetDetail = {
  pet: AdminPet;
  petFull: {
    ageYears: number | null;
    ageMonths: number | null;
    ageUnknown: boolean;
    sex: PetSex;
    size: PetSize;
    breed: string | null;
    diseases: string | null;
    vaccinated: boolean | null;
    sterilized: boolean | null;
    dewormed: boolean | null;
  };
  reports: Array<{
    id: string;
    reason: ReportReason;
    details: string | null;
    status: ReportStatus;
    createdAt: string;
    reporterName: string | null;
    reporterId: string;
  }>;
  history: Array<{
    id: string;
    action: ModerationActionType;
    reason: string | null;
    createdAt: string;
    adminName: string | null;
  }>;
};

export type AdminReport = {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  petId: string;
  petName: string | null;
  petPhotoUrl: string | null;
  reporterId: string;
  reporterName: string | null;
  ownerName: string | null;
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  role: "user" | "admin";
  accountStatus: "active" | "warned" | "suspended" | "banned";
  suspendedUntil: string | null;
  warnCount: number;
  createdAt: string;
  publications: number;
  reportsReceived: number;
  deletedContent: number;
};

export type AdminHistoryRow = {
  id: string;
  action: ModerationActionType;
  reason: string | null;
  createdAt: string;
  adminId: string;
  adminName: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  petId: string | null;
  petName: string | null;
  meta: Record<string, unknown> | null;
};

export async function reportPet(
  petId: string,
  reason: ReportReason,
  details?: string,
) {
  return apiFetch<{ id: string }>(`/pets/${petId}/reports`, {
    method: "POST",
    body: JSON.stringify({ reason, details }),
  });
}

export async function getAdminDashboard() {
  return apiFetch<AdminDashboard>("/admin/dashboard");
}

export async function getAdminModerationPets(filter?: string) {
  const qs = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  return apiFetch<AdminPet[]>(`/admin/moderation/pets${qs}`);
}

export async function getAdminPetDetail(id: string) {
  return apiFetch<AdminPetDetail>(`/admin/moderation/pets/${id}`);
}

export async function setAdminPetStatus(
  id: string,
  status: PetModerationStatus,
  reason?: string,
  policyCode?: string | null,
) {
  return apiFetch<AdminPetDetail>(`/admin/moderation/pets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason, policyCode }),
  });
}

export async function getAdminPets(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<AdminPet[]>(`/admin/pets${qs}`);
}

export async function flagAdminPet(id: string, reason?: string) {
  return apiFetch<AdminPetDetail>(`/admin/moderation/pets/${id}/flag`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function setAdminPetPublicationStatus(
  id: string,
  status: PetStatus,
  reason?: string,
) {
  return apiFetch<AdminPet>(`/admin/pets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

export type AdminUserDetail = {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: "user" | "admin";
    accountStatus: "active" | "warned" | "suspended" | "banned";
    suspendedUntil: string | null;
    warnCount: number;
    identityStatus: IdentityStatus;
    profilePhotoUrl: string | null;
    idCardPhotoUrl: string | null;
    selfiePhotoUrl: string | null;
    state: string | null;
    municipality: string | null;
    createdAt: string;
  };
  stats: {
    publications: number;
    reportsReceived: number;
    notPetFlags: number;
    deletedContent: number;
  };
  pets: AdminPet[];
  history: Array<{
    id: string;
    action: ModerationActionType;
    reason: string | null;
    meta: Record<string, unknown> | null;
    createdAt: string;
    adminName: string | null;
    petName: string | null;
    petId: string | null;
  }>;
};

export async function getAdminUserDetail(id: string) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`);
}

export async function setAdminUserIdentity(
  id: string,
  identityStatus: "verified" | "rejected",
  reason?: string,
) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}/identity`, {
    method: "PATCH",
    body: JSON.stringify({ identityStatus, reason }),
  });
}

export type AdminAdoptionRequest = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "closed";
  message: string | null;
  responseMessage: string | null;
  createdAt: string;
  updatedAt: string;
  petId: string;
  petName: string | null;
  petPhotoUrl: string | null;
  requesterId: string;
  requesterName: string | null;
  ownerId: string;
  ownerName: string | null;
};

export async function getAdminAdoptionRequests(
  status?: "pending" | "accepted" | "rejected" | "closed",
) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<AdminAdoptionRequest[]>(`/admin/adoption-requests${qs}`);
}

export async function closeAdminAdoptionRequest(id: string, reason?: string) {
  return apiFetch<{ id: string; status: string }>(
    `/admin/adoption-requests/${id}/close`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function getAdminReports(status?: ReportStatus) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<AdminReport[]>(`/admin/reports${qs}`);
}

export async function dismissAdminReport(id: string, reason?: string) {
  return apiFetch<{ id: string }>(`/admin/reports/${id}/dismiss`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function getAdminUsers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<AdminUserRow[]>(`/admin/users${qs}`);
}

export async function moderateAdminUser(
  id: string,
  action: "warn" | "suspend" | "ban" | "reactivate",
  options?: { days?: number | null; reason?: string },
) {
  return apiFetch<AdminUserRow>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      action,
      days: options?.days,
      reason: options?.reason,
    }),
  });
}

export async function getAdminHistory(filters?: {
  action?: ModerationActionType;
  adminId?: string;
  userId?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.action) params.set("action", filters.action);
  if (filters?.adminId) params.set("adminId", filters.adminId);
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  const qs = params.toString() ? `?${params}` : "";
  return apiFetch<AdminHistoryRow[]>(`/admin/history${qs}`);
}
