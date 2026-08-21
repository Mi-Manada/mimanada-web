const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/+$/,
  "",
);
const TOKEN_KEY = "mimanada_token";

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
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
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
  return apiFetch<AuthUser>("/auth/me");
}

export async function updateMe(input: {
  fullName?: string;
  phone?: string;
  age?: number;
  state?: string;
  municipality?: string;
  addressLine?: string;
}): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
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

export async function getHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
