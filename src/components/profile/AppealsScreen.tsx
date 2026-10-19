"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  APPEAL_STATUS_LABELS,
  formatAdminDate,
} from "@/components/admin/labels";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  createPetAppeal,
  getMyAppeals,
  getToken,
  mediaUrl,
  type ModerationAppeal,
} from "@/lib/api";

const MIN_CHARS = 8;

export function AppealsScreen() {
  const searchParams = useSearchParams();
  const petIdParam = searchParams.get("petId");
  const [items, setItems] = useState<ModerationAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formPetId, setFormPetId] = useState(petIdParam ?? "");

  const trimmedLen = message.trim().length;
  const tooShort = trimmedLen > 0 && trimmedLen < MIN_CHARS;

  const load = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await getMyAppeals();
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las apelaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (petIdParam) setFormPetId(petIdParam);
  }, [petIdParam]);

  async function submitAppeal(e: FormEvent) {
    e.preventDefault();
    if (!formPetId) {
      setError("Falta la publicación a apelar. Abre el enlace desde la notificación.");
      return;
    }
    if (message.trim().length < MIN_CHARS) {
      setError(`Escribe al menos ${MIN_CHARS} caracteres explicando tu caso.`);
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await createPetAppeal(formPetId, message);
      setMessage("");
      setSuccess("Apelación enviada. Te avisaremos cuando la revisen.");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo enviar la apelación.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProfilePageShell title="Apelaciones" backHref="/perfil">
      {formPetId ? (
        <form
          onSubmit={(e) => void submitAppeal(e)}
          className="mb-5 rounded-[14px] border border-[#ececec] bg-white p-4"
        >
          <h2 className="text-[0.95rem] text-[#333] [font-weight:800]">
            Apelar una decisión
          </h2>
          <p className="mt-1 text-[0.82rem] text-[#777]">
            Explica por qué crees que la publicación debería volver a mostrarse.
            Un moderador revisará tu caso.
          </p>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, 500));
              if (error) setError("");
            }}
            rows={4}
            placeholder="Ej: La foto sí es de mi mascota; la tomé en casa…"
            className="mt-3 w-full resize-none rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-3 text-[0.9rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p
              className={`text-[0.75rem] ${
                tooShort ? "text-[var(--color-primary)]" : "text-[#999]"
              }`}
            >
              {trimmedLen === 0
                ? `Mínimo ${MIN_CHARS} caracteres`
                : tooShort
                  ? `Faltan ${MIN_CHARS - trimmedLen} caracteres`
                  : "Listo para enviar"}
            </p>
            <p className="text-[0.72rem] text-[#aaa]">{trimmedLen}/500</p>
          </div>

          {error ? (
            <p className="mt-2 text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
              {error}
            </p>
          ) : null}
          {success ? (
            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[0.85rem] text-emerald-800 [font-weight:600]">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 h-11 w-full rounded-full bg-[var(--color-primary)] text-[0.9rem] text-white [font-weight:800] disabled:opacity-60"
          >
            {submitting ? "Enviando…" : "Enviar apelación"}
          </button>
        </form>
      ) : null}

      {!formPetId && error ? (
        <p className="mb-3 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">
          Cargando...
        </p>
      ) : null}

      {!loading && items.length === 0 && !formPetId ? (
        <ProfileEmptyState
          title="Sin apelaciones"
          description="Si ocultamos o eliminamos una publicación tuya, podrás apelar desde la notificación."
          ctaLabel="Ver notificaciones"
          ctaHref="/perfil/notificaciones"
        />
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => {
            const photo = mediaUrl(item.petPhotoUrl);
            return (
              <li
                key={item.id}
                className="rounded-[14px] border border-[#ececec] bg-white p-3.5"
              >
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#f0f0f0]">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.92rem] text-[#333] [font-weight:800]">
                        {item.petName ?? "Publicación"}
                      </p>
                      <StatusBadge
                        kind="report"
                        value={item.status}
                        label={
                          APPEAL_STATUS_LABELS[item.status] ?? item.status
                        }
                      />
                    </div>
                    <p className="mt-1 text-[0.85rem] text-[#555]">
                      {item.message}
                    </p>
                    {item.adminResponse ? (
                      <p className="mt-2 rounded-lg bg-[#f7f7f7] px-2.5 py-2 text-[0.8rem] text-[#666]">
                        Respuesta: {item.adminResponse}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[0.7rem] text-[#999]">
                      {formatAdminDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </ProfilePageShell>
  );
}
