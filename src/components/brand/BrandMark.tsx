type BrandMarkProps = {
  className?: string;
  /** Cutout fill inside the heart (panel color behind the mark) */
  cutout?: "bg" | "primary";
};

/** Paw + heart mark. Uses currentColor for the paw. */
export function BrandMark({ className = "", cutout = "bg" }: BrandMarkProps) {
  const cutoutFill =
    cutout === "primary" ? "var(--color-primary)" : "var(--color-bg)";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse
        cx="18"
        cy="18"
        rx="7"
        ry="10"
        fill="currentColor"
        transform="rotate(-28 18 18)"
      />
      <ellipse cx="32" cy="12" rx="7" ry="10" fill="currentColor" />
      <ellipse
        cx="46"
        cy="18"
        rx="7"
        ry="10"
        fill="currentColor"
        transform="rotate(28 46 18)"
      />
      <ellipse
        cx="52"
        cy="30"
        rx="6.5"
        ry="9"
        fill="currentColor"
        transform="rotate(55 52 30)"
      />
      <circle cx="32" cy="40" r="16" fill="currentColor" />
      <path
        d="M32 48.5c-.4 0-8-4.6-8-10.2 0-3 2.3-4.8 4.5-4.8 1.5 0 2.7.7 3.5 1.8.8-1.1 2-1.8 3.5-1.8 2.2 0 4.5 1.8 4.5 4.8 0 5.6-7.6 10.2-8 10.2Z"
        fill={cutoutFill}
      />
    </svg>
  );
}
