import type { Pet, PetSex, PetSize, PetSpecies } from "@/lib/api";

export function formatPetAge(pet: Pet): string {
  if (pet.ageUnknown) return "Edad desconocida";
  if (pet.ageMonths != null) {
    if (pet.ageMonths === 1) return "1 mes";
    if (pet.ageMonths < 12) return `${pet.ageMonths} meses`;
    const years = Math.floor(pet.ageMonths / 12);
    const months = pet.ageMonths % 12;
    if (months === 0) return years === 1 ? "1 año" : `${years} años`;
    return `${years}a ${months}m`;
  }
  if (pet.ageYears != null) {
    return pet.ageYears === 1 ? "1 año" : `${pet.ageYears} años`;
  }
  return "—";
}

export function formatPetSex(sex: PetSex): string {
  if (sex === "female") return "Hembra";
  if (sex === "male") return "Macho";
  return "No sé";
}

export function formatPetSize(size: PetSize): string {
  switch (size) {
    case "small":
      return "Pequeño";
    case "medium":
      return "Mediano";
    case "large":
      return "Grande";
    case "giant":
      return "Gigante";
    default:
      return "—";
  }
}

export function formatPetSpecies(species: PetSpecies): string {
  return species === "dog" ? "Perro" : "Gato";
}

export function formatPetLocation(pet: {
  municipality?: string | null;
  city?: string | null;
}): string {
  return [pet.municipality, pet.city].filter(Boolean).join(", ") || "Sin ubicación";
}

export function formatSpeciesFocus(species?: PetSpecies[]): string {
  const set = new Set(species ?? []);
  if (set.has("dog") && set.has("cat")) return "Perros y Gatos";
  if (set.has("dog")) return "Perros";
  if (set.has("cat")) return "Gatos";
  return "Mascotas";
}
