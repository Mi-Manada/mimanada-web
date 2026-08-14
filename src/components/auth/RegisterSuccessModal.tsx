"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type RegisterSuccessModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RegisterSuccessModal({
  open,
  onClose,
}: RegisterSuccessModalProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-success-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[18rem] rounded-2xl bg-[var(--color-primary)] px-6 pt-8 pb-7 text-center shadow-[0_16px_40px_rgba(0,0,0,0.25)] sm:max-w-[20rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--color-text-on-primary)]"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
            <path
              d="M8 21.5 16.5 30 32 11"
              stroke="var(--color-accent-yellow)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          id="register-success-title"
          className="text-[0.95rem] leading-snug text-[var(--color-accent-yellow)] [font-weight:700]"
        >
          Tu registro ha sido exitoso,
        </p>
        <p className="mt-1 text-[0.875rem] leading-snug text-[var(--color-accent-yellow)]">
          chequea tu bandeja de correo y sigue el enlace para confirmar tu correo
        </p>
      </div>
    </div>,
    document.body,
  );
}
