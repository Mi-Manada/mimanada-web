import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "onPrimary";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex h-[var(--height-button)] items-center justify-center rounded-[var(--radius-pill)] px-6 text-[0.9375rem] transition disabled:opacity-50 [font-weight:700]";

  const variants = {
    primary:
      "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)]",
    ghost:
      "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5",
    onPrimary:
      "bg-[var(--color-bg)] text-[var(--color-primary)] hover:bg-[var(--color-bg)]/90",
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
