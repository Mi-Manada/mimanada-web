import type { InputHTMLAttributes } from "react";
import { fieldBaseClass, fieldBorderedClass } from "@/components/ui/fieldStyles";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  variant?: "filled" | "outlined";
};

export function TextField({
  id,
  label,
  type = "text",
  variant = "filled",
  className = "",
  ...props
}: TextFieldProps) {
  const inputId = id ?? props.name;
  const base = variant === "outlined" ? fieldBorderedClass : fieldBaseClass;

  return (
    <label className="block w-full">
      {label ? (
        <span className="text-small mb-1.5 block text-[var(--color-text-muted)]">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        type={type}
        className={`${base} ${className}`}
        {...props}
      />
    </label>
  );
}
