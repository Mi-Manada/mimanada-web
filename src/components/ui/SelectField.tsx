"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { fieldBorderedClass } from "@/components/ui/fieldStyles";

export type SelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type SelectFieldProps = {
  name?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

export function SelectField({
  name,
  placeholder = "Selecciona",
  value,
  options,
  onChange,
  required,
  className = "",
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`${fieldBorderedClass} flex items-center justify-between text-left ${
          selected ? "" : "text-[var(--color-text-placeholder)]"
        }`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`shrink-0 text-[var(--color-primary)] transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+4px)] left-0 z-20 w-full overflow-hidden rounded-[var(--radius-input)] border border-[var(--color-border-input)] bg-[var(--color-bg)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.875rem] text-[var(--color-text)] transition hover:bg-[var(--color-surface-input)]"
              >
                {option.icon ? (
                  <span className="text-[var(--color-primary)]">{option.icon}</span>
                ) : null}
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
