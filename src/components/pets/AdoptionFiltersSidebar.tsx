"use client";

import type { ReactNode } from "react";
import { CatIcon, DogIcon } from "@/components/pets/PetIcons";
import type { PetSize, PetSpecies } from "@/lib/api";

export type AgeFilter = "young" | "adult";

export type AdoptionFilters = {
  species: PetSpecies[];
  ages: AgeFilter[];
  sizes: Exclude<PetSize, "unknown">[];
  cities: string[];
  municipalities: string[];
  vaccinated: boolean;
  sterilized: boolean;
  dewormed: boolean;
};

export const EMPTY_ADOPTION_FILTERS: AdoptionFilters = {
  species: [],
  ages: [],
  sizes: [],
  cities: [],
  municipalities: [],
  vaccinated: false,
  sterilized: false,
  dewormed: false,
};

const SPECIES_OPTIONS: {
  value: PetSpecies;
  label: string;
  icon: ReactNode;
}[] = [
  {
    value: "dog",
    label: "Perros",
    icon: <DogIcon size={16} />,
  },
  {
    value: "cat",
    label: "Gatos",
    icon: <CatIcon size={16} />,
  },
];

const AGE_OPTIONS: { value: AgeFilter; label: string; icon: ReactNode }[] = [
  {
    value: "young",
    label: "Cachorros / gatitos",
    icon: <PawSmallIcon />,
  },
  {
    value: "adult",
    label: "Adultos",
    icon: <CalendarIcon />,
  },
];

const SIZE_OPTIONS: {
  value: Exclude<PetSize, "unknown">;
  label: string;
  icon: ReactNode;
}[] = [
  { value: "small", label: "Pequeño", icon: <SizeBarsIcon level={1} /> },
  { value: "medium", label: "Mediano", icon: <SizeBarsIcon level={2} /> },
  { value: "large", label: "Grande", icon: <SizeBarsIcon level={3} /> },
  { value: "giant", label: "Gigante", icon: <SizeBarsIcon level={4} /> },
];

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterCheckbox({
  checked,
  label,
  icon,
  onChange,
}: {
  checked: boolean;
  label: string;
  icon?: ReactNode;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[0.875rem] text-[var(--color-text)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
      />
      {icon ? (
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[var(--color-primary)]">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 leading-snug">{label}</span>
    </label>
  );
}

function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#ececec] py-4 last:border-b-0">
      <p className="mb-2 flex items-center gap-1.5 text-[0.8rem] tracking-[0.04em] text-[#6b6b6b] uppercase [font-weight:700]">
        {icon ? (
          <span className="inline-flex text-[var(--color-primary)]">{icon}</span>
        ) : null}
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function LocationSelect({
  label,
  icon,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1.5 flex items-center gap-1.5 text-[0.8rem] text-[#6b6b6b] [font-weight:700]">
        <span className="text-[var(--color-primary)]">{icon}</span>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={options.length === 0}
        className="h-10 w-full cursor-pointer rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-2.5 text-[0.85rem] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function countActiveAdoptionFilters(filters: AdoptionFilters): number {
  return (
    filters.species.length +
    filters.ages.length +
    filters.sizes.length +
    filters.cities.length +
    filters.municipalities.length +
    (filters.vaccinated ? 1 : 0) +
    (filters.sterilized ? 1 : 0) +
    (filters.dewormed ? 1 : 0)
  );
}

export function AdoptionFiltersSidebar({
  filters,
  onChange,
  onClear,
  cityOptions = [],
  municipalityOptions = [],
  className = "",
}: {
  filters: AdoptionFilters;
  onChange: (next: AdoptionFilters) => void;
  onClear: () => void;
  cityOptions?: string[];
  municipalityOptions?: string[];
  className?: string;
}) {
  const activeCount = countActiveAdoptionFilters(filters);
  const selectedCity = filters.cities[0] ?? "";
  const selectedMunicipality = filters.municipalities[0] ?? "";

  return (
    <aside
      className={`rounded-[14px] border border-[#ececec] bg-white px-4 py-3 ${className}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[1rem] text-[var(--color-text)] [font-weight:800]">
          <FilterIcon />
          Filtros
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[0.8rem] text-[var(--color-primary)] [font-weight:700]"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <FilterSection title="Especie" icon={<SpeciesSectionIcon />}>
        {SPECIES_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            icon={option.icon}
            checked={filters.species.includes(option.value)}
            onChange={() =>
              onChange({
                ...filters,
                species: toggleValue(filters.species, option.value),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Edad" icon={<CalendarIcon />}>
        {AGE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            icon={option.icon}
            checked={filters.ages.includes(option.value)}
            onChange={() =>
              onChange({
                ...filters,
                ages: toggleValue(filters.ages, option.value),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Tamaño" icon={<SizeBarsIcon level={3} />}>
        {SIZE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            label={option.label}
            icon={option.icon}
            checked={filters.sizes.includes(option.value)}
            onChange={() =>
              onChange({
                ...filters,
                sizes: toggleValue(filters.sizes, option.value),
              })
            }
          />
        ))}
      </FilterSection>

      <div className="border-b border-[#ececec] py-4">
        <p className="mb-2 flex items-center gap-1.5 text-[0.8rem] tracking-[0.04em] text-[#6b6b6b] uppercase [font-weight:700]">
          <span className="text-[var(--color-primary)]">
            <PinIcon />
          </span>
          Ubicación
        </p>
        <LocationSelect
          label="Ciudad"
          icon={<CityIcon />}
          value={selectedCity}
          options={cityOptions}
          placeholder="Todas las ciudades"
          onChange={(value) =>
            onChange({
              ...filters,
              cities: value ? [value] : [],
              municipalities: [],
            })
          }
        />
        <LocationSelect
          label="Municipio"
          icon={<PinIcon />}
          value={selectedMunicipality}
          options={municipalityOptions}
          placeholder="Todos los municipios"
          onChange={(value) =>
            onChange({
              ...filters,
              municipalities: value ? [value] : [],
            })
          }
        />
      </div>

      <FilterSection title="Salud" icon={<HeartPulseIcon />}>
        <FilterCheckbox
          label="Vacunado"
          icon={<SyringeIcon />}
          checked={filters.vaccinated}
          onChange={() =>
            onChange({ ...filters, vaccinated: !filters.vaccinated })
          }
        />
        <FilterCheckbox
          label="Esterilizado / castrado"
          icon={<ScissorsIcon />}
          checked={filters.sterilized}
          onChange={() =>
            onChange({ ...filters, sterilized: !filters.sterilized })
          }
        />
        <FilterCheckbox
          label="Desparasitado"
          icon={<ShieldCheckIcon />}
          checked={filters.dewormed}
          onChange={() =>
            onChange({ ...filters, dewormed: !filters.dewormed })
          }
        />
      </FilterSection>
    </aside>
  );
}

function iconProps(size = 14) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
  };
}

function FilterIcon() {
  return (
    <svg {...iconProps(16)} className="text-[var(--color-primary)]">
      <path
        d="M4 5h16l-6.2 7.2v5.3L10.2 19v-6.8L4 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpeciesSectionIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M8.5 10.5c.8 0 1.5-.9 1.5-1.8S9.3 7 8.5 7 7 7.8 7 8.7s.7 1.8 1.5 1.8Zm7 0c.8 0 1.5-.9 1.5-1.8S16.3 7 15.5 7 14 7.8 14 8.7s.7 1.8 1.5 1.8ZM6 14.2c.9 0 1.6-1 1.6-2S6.9 10.2 6 10.2 4.4 11.2 4.4 12.2 5.1 14.2 6 14.2Zm12 0c.9 0 1.6-1 1.6-2s-.7-2-1.6-2-1.6 1-1.6 2 .7 2 1.6 2ZM12 19c2.4 0 4.3-1.7 4.3-3.4S14.4 12.2 12 12.2 7.7 13.9 7.7 15.6 9.6 19 12 19Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PawSmallIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M8.2 9.4c.7 0 1.3-.8 1.3-1.6S8.9 6.2 8.2 6.2 6.9 7 6.9 7.8s.6 1.6 1.3 1.6Zm7.6 0c.7 0 1.3-.8 1.3-1.6s-.6-1.6-1.3-1.6-1.3.8-1.3 1.6.6 1.6 1.3 1.6ZM6.2 13c.8 0 1.4-.9 1.4-1.8S7 9.4 6.2 9.4 4.8 10.3 4.8 11.2 5.4 13 6.2 13Zm11.6 0c.8 0 1.4-.9 1.4-1.8s-.6-1.8-1.4-1.8-1.4.9-1.4 1.8.6 1.8 1.4 1.8ZM12 18.4c2 0 3.6-1.4 3.6-2.8S14 12.8 12 12.8 8.4 14.2 8.4 15.6 10 18.4 12 18.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M7 4v2M17 4v2M5.5 8h13M7 6h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SizeBarsIcon({ level }: { level: 1 | 2 | 3 | 4 }) {
  const heights = [8, 12, 16, 20];
  return (
    <svg {...iconProps()} viewBox="0 0 24 24">
      {heights.map((height, index) => {
        const active = index < level;
        return (
          <rect
            key={height}
            x={4 + index * 5}
            y={22 - height}
            width="3.2"
            height={height}
            rx="1"
            fill="currentColor"
            opacity={active ? 1 : 0.25}
          />
        );
      })}
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" />
    </svg>
  );
}

function CityIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M4 20V9l6-4 4 2.5V6h6v14H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 20v-5h4v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M12 19.2 5.8 13A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 18.2 13L12 19.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="m14 4 6 6M16.5 6.5 9 14l-1.5 4.5L12 17l7.5-7.5M8.5 15.5 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="7" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="17" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m9 8.5 11 8M9 15.5l11-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M12 3.5 19 6.5v5.2c0 4.2-2.8 7.6-7 8.8-4.2-1.2-7-4.6-7-8.8V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12 1.9 1.9 3.8-3.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
