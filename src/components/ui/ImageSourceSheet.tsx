"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ImageCaptureFacing = "user" | "environment";

type ImageSourceSheetProps = {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
  title?: string;
  accept?: string;
  /** Cámara frontal (`user`) o trasera (`environment`). */
  captureFacing?: ImageCaptureFacing;
};

export function prefersMobileImagePicker() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function ImageSourceSheet({
  open,
  onClose,
  onFile,
  title = "Añadir imagen",
  accept = "image/*",
  captureFacing = "environment",
}: ImageSourceSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handlePicked(file: File | null, input: HTMLInputElement | null) {
    if (input) input.value = "";
    onClose();
    if (file) onFile(file);
  }

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture={captureFacing}
        className="hidden"
        onChange={(e) =>
          handlePicked(e.target.files?.[0] ?? null, cameraInputRef.current)
        }
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) =>
          handlePicked(e.target.files?.[0] ?? null, galleryInputRef.current)
        }
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            key="image-source-sheet"
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute inset-0 bg-black/40"
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative z-10 w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-0"
            >
              <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                <p className="border-b border-[#f0f0f0] px-4 py-3 text-center text-[0.82rem] text-[var(--color-text-muted)] [font-weight:600]">
                  {title}
                </p>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 border-b border-[#f0f0f0] px-4 py-3.5 text-[0.95rem] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5 [font-weight:700]"
                >
                  Tomar foto
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3.5 text-[0.95rem] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5 [font-weight:700]"
                >
                  Elegir de galería
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-[16px] bg-white px-4 py-3.5 text-[0.95rem] text-[#333] shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition hover:bg-[#fafafa] [font-weight:700]"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
