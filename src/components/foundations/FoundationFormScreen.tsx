"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ProfilePageShell } from "@/components/profile/ProfilePageShell";
import {
  ApiError,
  createFoundation,
  getFoundationBySlug,
  getMyFoundations,
  mediaUrl,
  updateFoundation,
  uploadFoundationLogo,
  uploadFoundationMercantileDocument,
  uploadFoundationRifDocument,
  type Foundation,
} from "@/lib/api";
import { foundationPath } from "@/lib/seo-urls";
import {
  getCitiesByState,
  getVenezuelaStates,
} from "@/lib/venezuela-locations";

const fieldClass =
  "h-11 w-full rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 text-[0.9rem] outline-none focus:border-[var(--color-primary)] focus:bg-white";
const selectClass = `${fieldClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`;
const labelClass =
  "mb-1.5 block text-[0.8rem] text-[#666] [font-weight:700]";

export function FoundationFormScreen({
  mode,
  foundationId,
}: {
  mode: "create" | "edit";
  foundationId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [foundation, setFoundation] = useState<Foundation | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rifNumber, setRifNumber] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [mercantileRegistry, setMercantileRegistry] = useState("");
  const [slug, setSlug] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [rifFile, setRifFile] = useState<File | null>(null);
  const [rifDocLabel, setRifDocLabel] = useState<string | null>(null);
  const [mercantileFile, setMercantileFile] = useState<File | null>(null);
  const [mercantileDocLabel, setMercantileDocLabel] = useState<string | null>(
    null,
  );

  const venezuelaStates = useMemo(() => getVenezuelaStates(), []);
  const municipalityOptions = useMemo(
    () => getCitiesByState(state),
    [state],
  );

  useEffect(() => {
    if (mode !== "edit" || !foundationId) return;
    let cancelled = false;
    getMyFoundations()
      .then((rows) => {
        const found = rows.find((r) => r.id === foundationId);
        if (!found) throw new ApiError(404, "Fundación no encontrada.");
        if (cancelled) return;
        setFoundation(found);
        setName(found.name);
        setDescription(found.description ?? "");
        setRifNumber(found.rifNumber ?? "");
        setFiscalAddress(found.fiscalAddress ?? "");
        setState(found.state ?? "");
        setMunicipality(found.municipality ?? "");
        setPhone(found.phone ?? "");
        setEmail(found.email ?? "");
        setWhatsapp(found.whatsapp ?? "");
        setInstagram(found.instagram ?? "");
        setFacebook(found.facebook ?? "");
        setMercantileRegistry(found.mercantileRegistry ?? "");
        setSlug(found.slug);
        setLogoPreview(mediaUrl(found.logoUrl));
        setRifDocLabel(
          found.rifDocumentUrl
            ? found.rifDocumentUrl.split("/").pop() ?? "Documento adjunto"
            : null,
        );
        setMercantileDocLabel(
          found.mercantileRegistryDocumentUrl
            ? found.mercantileRegistryDocumentUrl.split("/").pop() ??
                "Documento adjunto"
            : null,
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudo cargar.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, foundationId]);

  const canSubmit =
    name.trim().length >= 3 &&
    rifNumber.trim().length >= 3 &&
    fiscalAddress.trim().length >= 5 &&
    phone.trim().length >= 7 &&
    email.trim().includes("@");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Completa los campos obligatorios de la persona jurídica.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        rifNumber: rifNumber.trim(),
        fiscalAddress: fiscalAddress.trim(),
        state: state.trim() || undefined,
        municipality: municipality.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        mercantileRegistry: mercantileRegistry.trim() || undefined,
      };
      let saved: Foundation;
      if (mode === "create") {
        saved = await createFoundation(payload);
      } else {
        if (!foundationId) throw new Error("Falta id");
        saved = await updateFoundation(foundationId, {
          ...payload,
          slug: slug.trim() || undefined,
        });
      }
      if (logoFile) {
        saved = await uploadFoundationLogo(saved.id, logoFile);
      }
      if (rifFile) {
        saved = await uploadFoundationRifDocument(saved.id, rifFile);
      }
      if (mercantileFile) {
        saved = await uploadFoundationMercantileDocument(
          saved.id,
          mercantileFile,
        );
      }
      const publicF = await getFoundationBySlug(saved.slug);
      router.replace(foundationPath(publicF));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la fundación.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfilePageShell
      title={mode === "create" ? "Crear fundación" : "Editar fundación"}
      backHref="/perfil/fundaciones"
    >
      {loading ? (
        <p className="text-[0.9rem] text-[var(--color-text-muted)]">
          Cargando...
        </p>
      ) : (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mx-auto max-w-xl space-y-5 rounded-[16px] border border-[#ececec] bg-white p-5"
        >
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#999] [font-weight:800]">
              Datos de la persona jurídica
            </p>
            <p className="mt-1 text-[0.8rem] text-[#888]">
              Información legal del refugio o fundación.
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>Razón social *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 120))}
              required
              minLength={3}
              className={fieldClass}
            />
          </label>

          {mode === "edit" ? (
            <label className="block">
              <span className={labelClass}>Slug (URL pública)</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.slice(0, 140))}
                className={fieldClass}
              />
              <span className="mt-1 block text-[0.72rem] text-[#999]">
                /fundaciones/{slug || "…"}
              </span>
            </label>
          ) : null}

          <label className="block">
            <span className={labelClass}>Número de RIF *</span>
            <input
              value={rifNumber}
              onChange={(e) => setRifNumber(e.target.value.slice(0, 40))}
              required
              placeholder="J-12345678-9"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>
              Documento RIF (archivo adjunto)
              {mode === "create" ? " *" : ""}
            </span>
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              required={mode === "create"}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setRifFile(file);
                setRifDocLabel(file?.name ?? rifDocLabel);
              }}
              className="mt-1 block w-full text-[0.8rem]"
            />
            {rifDocLabel ? (
              <span className="mt-1 block text-[0.72rem] text-[#999]">
                {rifFile ? `Nuevo: ${rifDocLabel}` : `Actual: ${rifDocLabel}`}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className={labelClass}>Dirección fiscal *</span>
            <textarea
              value={fiscalAddress}
              onChange={(e) => setFiscalAddress(e.target.value.slice(0, 280))}
              required
              rows={2}
              className="w-full resize-none rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-3 text-[0.9rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Estado</span>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setMunicipality("");
                }}
                className={selectClass}
              >
                <option value="">Selecciona un estado</option>
                {state && !venezuelaStates.includes(state) ? (
                  <option value={state}>{state}</option>
                ) : null}
                {venezuelaStates.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Municipio</span>
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                disabled={!state}
                className={selectClass}
              >
                <option value="">
                  {state
                    ? "Selecciona un municipio"
                    : "Primero elige un estado"}
                </option>
                {municipality &&
                !municipalityOptions.includes(municipality) ? (
                  <option value={municipality}>{municipality}</option>
                ) : null}
                {municipalityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Teléfono / celular *</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.slice(0, 40))}
              required
              inputMode="tel"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Correo electrónico *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 180))}
              required
              className={fieldClass}
            />
          </label>

          <div>
            <p className={`${labelClass} mb-2`}>Redes sociales</p>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[0.75rem] text-[#888]">
                  WhatsApp
                </span>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.slice(0, 40))}
                  inputMode="tel"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.75rem] text-[#888]">
                  Instagram
                </span>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.slice(0, 120))}
                  placeholder="@usuario"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.75rem] text-[#888]">
                  Facebook
                </span>
                <input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value.slice(0, 160))}
                  placeholder="URL o nombre de página"
                  className={fieldClass}
                />
              </label>
            </div>
          </div>

          <label className="block">
            <span className={labelClass}>Registro mercantil</span>
            <input
              value={mercantileRegistry}
              onChange={(e) =>
                setMercantileRegistry(e.target.value.slice(0, 500))
              }
              placeholder="Tomo, número, fecha…"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>
              Documento de registro mercantil (opcional)
            </span>
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setMercantileFile(file);
                setMercantileDocLabel(file?.name ?? mercantileDocLabel);
              }}
              className="mt-1 block w-full text-[0.8rem]"
            />
            {mercantileDocLabel ? (
              <span className="mt-1 block text-[0.72rem] text-[#999]">
                {mercantileFile
                  ? `Nuevo: ${mercantileDocLabel}`
                  : `Actual: ${mercantileDocLabel}`}
              </span>
            ) : null}
          </label>

          <div className="border-t border-[#f0f0f0] pt-4">
            <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#999] [font-weight:800]">
              Perfil público
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={4}
              className="w-full resize-none rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-3 text-[0.9rem] outline-none focus:border-[var(--color-primary)] focus:bg-white"
            />
          </label>

          <label className="block">
            <span className={labelClass}>Logo</span>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0] text-[#999]">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "—"
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setLogoFile(file);
                  if (file) setLogoPreview(URL.createObjectURL(file));
                }}
                className="text-[0.8rem]"
              />
            </div>
          </label>

          {error ? (
            <p className="text-[0.85rem] text-[var(--color-primary)] [font-weight:600]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="h-11 w-full rounded-full bg-[var(--color-primary)] text-[0.9rem] text-white [font-weight:800] disabled:opacity-60"
          >
            {saving
              ? "Guardando…"
              : mode === "create"
                ? "Crear fundación"
                : "Guardar cambios"}
          </button>

          {foundation ? (
            <div className="space-y-2 text-center">
              {(foundation.myRole === "owner" ||
                foundation.myRole === "admin") && (
                <a
                  href={`/perfil/fundaciones/${foundation.id}/miembros`}
                  className="block text-[0.85rem] text-[var(--color-primary)] [font-weight:700]"
                >
                  Gestionar miembros
                </a>
              )}
              <p className="text-[0.75rem] text-[#999]">
                Perfil público: /fundaciones/{foundation.slug}
              </p>
            </div>
          ) : null}
        </form>
      )}
    </ProfilePageShell>
  );
}
