"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/Button";

async function createCroppedFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("No se pudo cargar la imagen.")));
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.max(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el recorte.");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("No se pudo generar la imagen recortada."));
      },
      "image/jpeg",
      0.92,
    );
  });

  const base = fileName.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

type ImageCropModalProps = {
  imageSrc: string;
  fileName: string;
  circular?: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropModal({
  imageSrc,
  fileName,
  circular = true,
  title = "Ajusta tu foto",
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError("");
    try {
      const file = await createCroppedFile(
        imageSrc,
        croppedAreaPixels,
        fileName,
      );
      onConfirm(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo recortar la imagen.",
      );
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[92dvh] w-full max-w-[26rem] flex-col overflow-hidden rounded-t-[18px] bg-white sm:rounded-[18px]">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
          <h2 className="text-[1rem] text-[#555] [font-weight:700]">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-[0.85rem] text-[var(--color-text-muted)] [font-weight:600]"
          >
            Cancelar
          </button>
        </div>

        <div className="relative h-[min(58vh,22rem)] w-full bg-[#111]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={circular ? "round" : "rect"}
            showGrid={!circular}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex flex-col gap-3 px-4 py-4">
          <label className="block">
            <span className="mb-1.5 block text-[0.75rem] text-[var(--color-text-muted)]">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </label>

          <p className="text-[0.75rem] text-[var(--color-text-muted)]">
            {circular
              ? "Arrastra la imagen para centrar tu rostro en el círculo."
              : "Arrastra y usa el zoom para encuadrar a la mascota."}
          </p>

          {error ? (
            <p className="text-[0.85rem] text-[var(--color-primary)]">{error}</p>
          ) : null}

          <Button
            type="button"
            className="h-10 w-full text-[0.875rem]"
            disabled={busy || !croppedAreaPixels}
            onClick={handleConfirm}
          >
            {busy ? "Preparando..." : "Usar esta foto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
