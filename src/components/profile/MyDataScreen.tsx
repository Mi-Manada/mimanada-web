"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppChrome } from "@/components/app/AppChrome";
import { Button } from "@/components/ui/Button";
import {
  ApiError,
  getMe,
  updateMe,
  type AuthUser,
} from "@/lib/api";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

type Draft = {
  firstName: string;
  lastName: string;
  age: string;
  phone: string;
  state: string;
  municipality: string;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
};

function toDraft(user: AuthUser): Draft {
  const { firstName, lastName } = splitName(user.fullName);
  return {
    firstName,
    lastName,
    age: user.age != null ? String(user.age) : "",
    phone: user.phone ?? "",
    state: user.state ?? "",
    municipality: user.municipality ?? "",
    addressLine: user.addressLine ?? "",
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
  };
}

type NominatimAddress = {
  state?: string;
  region?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  road?: string;
  pedestrian?: string;
  house_number?: string;
  suburb?: string;
};

async function reverseGeocode(lat: number, lon: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es",
    },
  });
  if (!res.ok) {
    throw new Error("No se pudo obtener la dirección.");
  }

  const data = (await res.json()) as { address?: NominatimAddress };
  const a = data.address ?? {};
  const state = a.state || a.region || "";
  const municipality =
    a.city || a.town || a.village || a.municipality || a.county || "";
  const street = a.road || a.pedestrian || a.suburb || "";
  const addressLine = [a.house_number, street].filter(Boolean).join(" ").trim();

  return { state, municipality, addressLine };
}

export function MyDataScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setDraft(toDraft(me));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar tus datos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit() {
    if (!user) return;
    setDraft(toDraft(user));
    setError("");
    setEditing(true);
  }

  function cancelEdit() {
    if (!user) return;
    setDraft(toDraft(user));
    setError("");
    setEditing(false);
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite usar la ubicación.");
      return;
    }

    setLocating(true);
    setError("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const place = await reverseGeocode(latitude, longitude);

      setDraft((prev) =>
        prev
          ? {
              ...prev,
              state: place.state || prev.state,
              municipality: place.municipality || prev.municipality,
              addressLine: place.addressLine || prev.addressLine,
              latitude,
              longitude,
            }
          : prev,
      );
    } catch (err) {
      const geo = err as GeolocationPositionError | undefined;
      if (geo?.code === 1) {
        setError("Necesitamos permiso para usar tu ubicación.");
      } else if (geo?.code === 2) {
        setError("No se pudo detectar tu ubicación.");
      } else if (geo?.code === 3) {
        setError("La ubicación tardó demasiado. Intenta de nuevo.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo obtener la ubicación actual.",
        );
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;

    const fullName = `${draft.firstName} ${draft.lastName}`.trim();
    if (fullName.length < 2) {
      setError("Escribe al menos tu nombre.");
      return;
    }

    const ageValue = draft.age.trim() ? Number(draft.age) : undefined;
    if (draft.age.trim() && (!Number.isInteger(ageValue) || (ageValue ?? 0) < 1)) {
      setError("La edad no es válida.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateMe({
        fullName,
        phone: draft.phone.trim() || undefined,
        age: ageValue,
        state: draft.state.trim(),
        municipality: draft.municipality.trim(),
        addressLine: draft.addressLine.trim(),
        ...(draft.latitude != null ? { latitude: draft.latitude } : {}),
        ...(draft.longitude != null ? { longitude: draft.longitude } : {}),
      });
      setUser(updated);
      setDraft(toDraft(updated));
      setEditing(false);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  }

  const personalRows = user
    ? [
        { label: "Nombres", value: splitName(user.fullName).firstName || "—" },
        { label: "Apellidos", value: splitName(user.fullName).lastName || "—" },
        {
          label: "Edad",
          value: user.age != null ? `${user.age} años` : "—",
        },
        { label: "Correo electrónico", value: user.email },
        { label: "Número de teléfono", value: user.phone || "—" },
        { label: "Contraseña", value: "••••••••" },
      ]
    : [];

  const addressRows = user
    ? [
        { label: "Estado", value: user.state || "—" },
        { label: "Ciudad", value: user.municipality || "—" },
        { label: "Dirección", value: user.addressLine || "—" },
      ]
    : [];

  const hasCoords = Boolean(
    user && user.latitude != null && user.longitude != null,
  );

  return (
    <AppChrome>
      <main className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)]">
        <header className="relative overflow-hidden bg-[var(--color-primary)] px-5 pb-6 pt-5 text-[var(--color-text-on-primary)] sm:px-8 lg:px-10">
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
                href="/perfil"
                aria-label="Volver al perfil"
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
              <h1 className="text-[1.05rem] [font-weight:700]">Mis Datos</h1>
            </div>

            {!editing && !loading ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.8125rem] transition hover:bg-white/25 [font-weight:600]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="m4 20 4.6-1.1L19 8.5 15.5 5 5.1 15.4 4 20Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
                Editar
              </button>
            ) : (
              <span className="h-9 w-9" aria-hidden />
            )}
          </div>
        </header>

        <section className="mx-auto w-full max-w-[80rem] flex-1 px-5 py-6 sm:px-8 lg:px-10">
          {loading ? (
            <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
          ) : null}

          {!loading && !editing && user ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-4 py-2.5">
                  <h2 className="text-[0.8rem] uppercase tracking-[0.04em] text-[#777] [font-weight:700]">
                    Datos personales
                  </h2>
                </div>
                <div className="divide-y divide-[#f0f0f0] px-4">
                  {personalRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 py-2.5"
                    >
                      <p className="shrink-0 text-[0.8rem] text-[var(--color-text-muted)]">
                        {row.label}
                      </p>
                      <p className="text-right text-[0.9rem] text-[#555] [font-weight:500]">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
                <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-4 py-2.5">
                  <h2 className="text-[0.8rem] uppercase tracking-[0.04em] text-[#777] [font-weight:700]">
                    Domicilio
                  </h2>
                  <p className="mt-0.5 text-[0.72rem] text-[var(--color-text-muted)]">
                    {hasCoords
                      ? "Con ubicación actual guardada"
                      : "Sin ubicación actual · Edita para añadirla"}
                  </p>
                </div>
                <div className="divide-y divide-[#f0f0f0] px-4">
                  {addressRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 py-2.5"
                    >
                      <p className="shrink-0 text-[0.8rem] text-[var(--color-text-muted)]">
                        {row.label}
                      </p>
                      <p className="text-right text-[0.9rem] text-[#555] [font-weight:500]">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {savedFlash ? (
                <p className="text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
                  Cambios guardados
                </p>
              ) : null}
            </div>
          ) : null}

          {!loading && editing && draft && user ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4 lg:max-w-[48rem]">
              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                  Nombres
                </span>
                <input
                  value={draft.firstName}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, firstName: e.target.value } : prev,
                    )
                  }
                  className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                  Apellidos
                </span>
                <input
                  value={draft.lastName}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, lastName: e.target.value } : prev,
                    )
                  }
                  className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                  Edad
                </span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draft.age}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, age: e.target.value } : prev,
                    )
                  }
                  className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                />
              </label>

              <div className="block">
                <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                  Correo electrónico
                </span>
                <p className="rounded-[10px] border border-dashed border-[#e4e4e4] bg-[#f7f7f7] px-3.5 py-3 text-[0.95rem] text-[#8a8a8a]">
                  {user.email}
                </p>
                <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">
                  El correo no se edita desde aquí.
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                  Número de teléfono
                </span>
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, phone: e.target.value } : prev,
                    )
                  }
                  className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                />
              </label>

              <div className="mt-2 border-t border-[#f0f0f0] pt-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.9rem] text-[#555] [font-weight:700]">
                      Domicilio
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-[var(--color-text-muted)]">
                      Sirve para mostrar adopciones cercanas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating || saving}
                    className="shrink-0 rounded-full border border-[var(--color-primary)] px-3 py-1.5 text-[0.75rem] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5 disabled:opacity-60 [font-weight:600]"
                  >
                    {locating ? "Detectando..." : "Usar ubicación actual"}
                  </button>
                </div>

                <label className="mb-4 block">
                  <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                    Estado
                  </span>
                  <input
                    value={draft.state}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, state: e.target.value } : prev,
                      )
                    }
                    className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                    placeholder="Ej. Miranda"
                  />
                </label>

                <label className="mb-4 block">
                  <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                    Ciudad
                  </span>
                  <input
                    value={draft.municipality}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, municipality: e.target.value } : prev,
                      )
                    }
                    className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                    placeholder="Ej. Caracas"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                    Dirección
                  </span>
                  <input
                    value={draft.addressLine}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, addressLine: e.target.value } : prev,
                      )
                    }
                    className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
                    placeholder="Calle, urbanización, referencia"
                  />
                </label>

                {draft.latitude != null && draft.longitude != null ? (
                  <p className="mt-2 text-[0.75rem] text-[var(--color-text-muted)]">
                    Coordenadas listas para guardar.
                  </p>
                ) : null}
              </div>

              <div className="block">
                <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
                  Contraseña
                </span>
                <p className="rounded-[10px] border border-dashed border-[#e4e4e4] bg-[#f7f7f7] px-3.5 py-3 text-[0.95rem] text-[#8a8a8a]">
                  ••••••••
                </p>
                <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">
                  Cámbiala desde{" "}
                  <Link
                    href="/perfil/seguridad"
                    className="text-[var(--color-primary)] [font-weight:600]"
                  >
                    Seguridad
                  </Link>
                  .
                </p>
              </div>

              {error ? (
                <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
              ) : null}

              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEdit}
                  disabled={saving || locating}
                  className="h-9 min-w-[6.25rem] border border-[var(--color-primary)] px-4 text-[0.8125rem]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-9 min-w-[8rem] px-4 text-[0.8125rem]"
                  disabled={saving || locating}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          ) : null}

          {!loading && error && !editing ? (
            <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}
        </section>
      </main>
    </AppChrome>
  );
}
