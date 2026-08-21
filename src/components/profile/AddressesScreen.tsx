"use client";

import { FormEvent, useEffect, useState } from "react";
import { ProfilePageShell } from "@/components/profile/ProfilePageShell";
import { Button } from "@/components/ui/Button";
import { ApiError, getMe, updateMe, type AuthUser } from "@/lib/api";

type Draft = {
  state: string;
  municipality: string;
  addressLine: string;
};

function toDraft(user: AuthUser): Draft {
  return {
    state: user.state ?? "",
    municipality: user.municipality ?? "",
    addressLine: user.addressLine ?? "",
  };
}

export function AddressesScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if (!cancelled) setError("No se pudo cargar tu dirección.");
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

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateMe({
        state: draft.state.trim(),
        municipality: draft.municipality.trim(),
        addressLine: draft.addressLine.trim(),
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
          : "No se pudo guardar la dirección.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasAddress = Boolean(
    user?.state || user?.municipality || user?.addressLine,
  );

  return (
    <ProfilePageShell
      title="Direcciones"
      action={
        !editing && !loading ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.8125rem] transition hover:bg-white/25 [font-weight:600]"
          >
            {hasAddress ? "Editar" : "Agregar"}
          </button>
        ) : null
      }
    >
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">Cargando...</p>
      ) : null}

      {!loading && !editing && user ? (
        <div className="rounded-[14px] border border-[#ececec] bg-white px-4 py-4">
          <p className="text-[0.8rem] text-[var(--color-text-muted)]">
            Domicilio principal
          </p>
          {hasAddress ? (
            <div className="mt-2 space-y-1 text-[0.95rem] text-[#5a5a5a] [font-weight:500]">
              <p>{user.addressLine || "—"}</p>
              <p>
                {[user.municipality, user.state].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[0.9rem] text-[var(--color-text-muted)]">
              Aún no tienes una dirección. Agrégala para facilitar adopciones
              cerca de ti.
            </p>
          )}
          {savedFlash ? (
            <p className="mt-3 text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
              Dirección guardada
            </p>
          ) : null}
        </div>
      ) : null}

      {!loading && editing && draft ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
              Estado
            </span>
            <input
              value={draft.state}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, state: e.target.value } : prev))
              }
              className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
              placeholder="Ej. Distrito Capital"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] text-[var(--color-text-muted)]">
              Municipio
            </span>
            <input
              value={draft.municipality}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, municipality: e.target.value } : prev,
                )
              }
              className="h-11 w-full rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.95rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
              placeholder="Ej. Baruta"
              required
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
              placeholder="Calle, edificio, referencia"
              required
            />
          </label>

          {error ? (
            <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={cancelEdit}
              disabled={saving}
              className="h-9 min-w-[6.25rem] border border-[var(--color-primary)] px-4 text-[0.8125rem]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 min-w-[8rem] px-4 text-[0.8125rem]"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      ) : null}

      {!loading && error && !editing ? (
        <p className="mt-4 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}
    </ProfilePageShell>
  );
}
