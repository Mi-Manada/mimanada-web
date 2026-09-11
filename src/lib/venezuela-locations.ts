import venezuelaCities from "@/data/venezuela-cities.json";

const cities = venezuelaCities.cities as string[];
const municipalitiesByCity = venezuelaCities.municipalitiesByCity as Record<
  string,
  string[]
>;
const states = (venezuelaCities as { states?: string[] }).states ?? [];
const citiesByState =
  (venezuelaCities as { citiesByState?: Record<string, string[]> })
    .citiesByState ?? {};

export function getVenezuelaCities(): string[] {
  return cities;
}

export function getVenezuelaStates(): string[] {
  return states;
}

export function getCitiesByState(state: string): string[] {
  if (!state) return [];
  return citiesByState[state] ?? [];
}

export function getMunicipalitiesByCity(city: string): string[] {
  if (!city) return [];
  return municipalitiesByCity[city] ?? [];
}

export function isKnownVenezuelaCity(city: string): boolean {
  return Boolean(city && municipalitiesByCity[city]);
}
