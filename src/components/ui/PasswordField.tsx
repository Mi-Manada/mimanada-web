"use client";

import { useState, type InputHTMLAttributes } from "react";
import { fieldBaseClass, fieldBorderedClass } from "@/components/ui/fieldStyles";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  variant?: "filled" | "outlined";
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.6 10.7a2 2 0 0 0 2.8 2.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.2M6.1 6.1C4.2 7.4 2.7 9.1 1.8 11c1.7 3.9 6 7 10.2 7 1.3 0 2.5-.2 3.7-.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PasswordField({
  id,
  label,
  variant = "filled",
  className = "",
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;
  const base = variant === "outlined" ? fieldBorderedClass : fieldBaseClass;

  return (
    <label className="block w-full">
      {label ? (
        <span className="text-small mb-1.5 block text-[var(--color-text-muted)]">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`${base} pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-primary)]"
          aria-label={visible ? "Ocultar contraseña" : "Ver contraseña"}
        >
          <EyeIcon open={visible} />
        </button>
      </span>
    </label>
  );
}
