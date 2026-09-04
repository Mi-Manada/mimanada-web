"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import {
  ImageSourceSheet,
  prefersMobileImagePicker,
} from "@/components/ui/ImageSourceSheet";
import {
  ApiError,
  getMe,
  mediaUrl,
  uploadIdentityPhoto,
  type AuthUser,
} from "@/lib/api";

type StepKind = "profile" | "id_card" | "selfie";

const STEPS: {
  kind: StepKind;
  title: string;
  description: string;
  tip: string;
}[] = [
  {
    kind: "id_card",
    title: "Foto de tu cédula",
    description: "Necesitamos tu documento para verificar tu identidad.",
    tip: "Sube el frente de la cédula, legible y sin recortes.",
  },
  {
    kind: "profile",
    title: "Foto de perfil",
    description: "Esta será la imagen que verán otros usuarios en la manada.",
    tip: "Usa una foto clara de tu rostro, con buena luz.",
  },
  {
    kind: "selfie",
    title: "Selfie de verificación",
    description: "La compararemos con tu documento para activar tu perfil.",
    tip: "Mira a la cámara, sin gafas oscuras ni gorra.",
  },
];

function urlFor(user: AuthUser | null, kind: StepKind) {
  if (!user) return null;
  if (kind === "profile") return mediaUrl(user.profilePhotoUrl);
  if (kind === "id_card") return mediaUrl(user.idCardPhotoUrl);
  return mediaUrl(user.selfiePhotoUrl);
}

export function ActivationOnboardingScreen({
  mode = "tutorial",
}: {
  mode?: "tutorial" | "manage";
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const laterHref = mode === "manage" ? "/perfil" : "/home";
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("foto.jpg");
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex];
  const isProfileStep = step.kind === "profile";

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        if (mode === "tutorial") {
          const firstPending = STEPS.findIndex((s) => {
            if (s.kind === "profile") return !me.profilePhotoUrl;
            if (s.kind === "id_card") return !me.idCardPhotoUrl;
            return !me.selfiePhotoUrl;
          });
          setStepIndex(firstPending === -1 ? STEPS.length - 1 : firstPending);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu perfil.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    setPreview(urlFor(user, step.kind));
    setError("");
  }, [step.kind, user]);

  useEffect(() => {
    return () => {
      if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const progress = useMemo(() => {
    if (!user) return 0;
    let done = 0;
    if (user.profilePhotoUrl) done += 1;
    if (user.idCardPhotoUrl) done += 1;
    if (user.selfiePhotoUrl) done += 1;
    return done;
  }, [user]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const updated = await uploadIdentityPhoto(step.kind, file);
      setUser(updated);
      setPreview(urlFor(updated, step.kind));
      if (mode === "tutorial" && stepIndex < STEPS.length - 1) {
        window.setTimeout(() => setStepIndex((i) => i + 1), 350);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo subir la imagen. Intenta de nuevo.",
      );
    } finally {
      setUploading(false);
    }
  }

  function openPhotoPicker() {
    if (uploading) return;
    if (prefersMobileImagePicker()) {
      setPhotoSourceOpen(true);
      return;
    }
    fileInputRef.current?.click();
  }

  function onFilePicked(file: File | null) {
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (isProfileStep) {
      if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
      setCropFileName(file.name || "perfil.jpg");
      setCropSrc(URL.createObjectURL(file));
      return;
    }

    void uploadFile(file);
  }

  function closeCrop() {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function onCropConfirm(file: File) {
    closeCrop();
    await uploadFile(file);
  }

  function handleSkipOrLater() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    router.push(laterHref);
  }

  if (loading) {
    return (
      <section className="flex min-h-full flex-1 items-center justify-center px-6">
        <p className="text-[var(--color-text-muted)]">Preparando tu activación...</p>
      </section>
    );
  }

  const complete = Boolean(user?.documentsComplete);

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--color-bg)] px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col">
        <p className="text-center text-[0.75rem] tracking-[0.12em] text-[var(--color-text-muted)] uppercase [font-weight:700]">
          Activar perfil
        </p>
        <h1 className="mt-2 text-center text-[clamp(1.25rem,3vw,1.6rem)] text-[var(--color-text)] [font-weight:700]">
          {complete ? "¡Perfil listo!" : "Completa tu verificación"}
        </h1>
        <p className="mt-2 text-center text-[0.875rem] leading-relaxed text-[var(--color-text-muted)]">
          {complete
            ? "Ya subiste tus documentos. Tu perfil queda activo para usar adopciones."
            : "Para activar tu cuenta sube tu cédula y completa las fotos. Puedes omitir pasos y terminar luego."}
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          {STEPS.map((s, index) => {
            const done = Boolean(urlFor(user, s.kind));
            const active = index === stepIndex;
            return (
              <button
                key={s.kind}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`h-2.5 w-8 rounded-full transition ${
                  done
                    ? "bg-[var(--color-primary)]"
                    : active
                      ? "bg-[var(--color-primary)]/50"
                      : "bg-[#e8e8e8]"
                }`}
                aria-label={s.title}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center text-[0.75rem] text-[var(--color-text-muted)]">
          {progress} de 3 completadas
        </p>

        <div className="mt-6 rounded-[16px] border border-[#ececec] bg-white p-5">
          <p className="text-[0.7rem] text-[var(--color-primary)] [font-weight:700]">
            Paso {stepIndex + 1} de 3
          </p>
          <h2 className="mt-1 text-[1.05rem] text-[#555] [font-weight:700]">
            {step.title}
          </h2>
          <p className="mt-1 text-[0.85rem] leading-snug text-[var(--color-text-muted)]">
            {step.description}
          </p>
          <p className="mt-2 text-[0.8rem] text-[#777]">{step.tip}</p>

          <div className="mt-4 flex flex-col items-center gap-3">
            <div
              className={`flex items-center justify-center overflow-hidden border border-dashed border-[#ddd] bg-[#fafafa] ${
                isProfileStep
                  ? "h-40 w-40 rounded-full"
                  : "h-44 w-full rounded-[14px]"
              }`}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={step.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-[0.85rem] text-[var(--color-text-muted)]">
                  {isProfileStep ? "Sin foto" : "Aún no hay imagen en este paso"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={openPhotoPicker}
              disabled={uploading}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 text-[0.8125rem] text-white [font-weight:700] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {uploading
                ? "Subiendo..."
                : preview
                  ? "Cambiar foto"
                  : "Subir foto"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
            />
          </div>

          {error ? (
            <p className="mt-3 text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSkipOrLater}
            disabled={uploading}
            className="mt-4 w-full cursor-pointer text-center text-[0.82rem] text-[var(--color-text-muted)] underline-offset-2 transition hover:text-[var(--color-primary)] hover:underline disabled:opacity-50 [font-weight:600]"
          >
            {stepIndex < STEPS.length - 1
              ? "Omitir / Hacer luego"
              : "Omitir y continuar"}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="h-9 border border-[var(--color-primary)] text-[0.8125rem]"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Anterior
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              className="h-9 text-[0.8125rem]"
              onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            >
              Siguiente
            </Button>
          ) : (
            <Link
              href={laterHref}
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 text-[0.8125rem] text-white [font-weight:700]"
            >
              {complete ? "Listo" : "Continuar después"}
            </Link>
          )}
        </div>

        {!complete ? (
          <p className="mt-4 text-center text-[0.8rem] text-[var(--color-text-muted)]">
            Puedes salir y terminar luego, pero te recordaremos activar tu perfil
            para usar adopciones.
          </p>
        ) : null}
      </div>

      {cropSrc ? (
        <ImageCropModal
          imageSrc={cropSrc}
          fileName={cropFileName}
          circular
          title="Ajusta tu foto de perfil"
          onCancel={closeCrop}
          onConfirm={onCropConfirm}
        />
      ) : null}

      <ImageSourceSheet
        open={photoSourceOpen}
        onClose={() => setPhotoSourceOpen(false)}
        onFile={(file) => onFilePicked(file)}
        title={step.title}
        captureFacing={step.kind === "selfie" ? "user" : "environment"}
      />
    </section>
  );
}
