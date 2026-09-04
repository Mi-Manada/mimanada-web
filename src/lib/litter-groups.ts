import type { Pet, PetSpecies } from "@/lib/api";

export type LitterGroup = {
  litterGroupId: string;
  members: Pet[];
  mother: Pet | null;
  pups: Pet[];
  title: string;
  species: PetSpecies | null;
  publishedCount: number;
  createdAt: string;
};

export function groupPetsIntoLitters(pets: Pet[]): LitterGroup[] {
  const byGroup = new Map<string, Pet[]>();

  for (const pet of pets) {
    if (!pet.litterGroupId) continue;
    const list = byGroup.get(pet.litterGroupId) ?? [];
    list.push(pet);
    byGroup.set(pet.litterGroupId, list);
  }

  return [...byGroup.entries()]
    .map(([litterGroupId, members]) => {
      const sorted = [...members].sort(
        (a, b) =>
          Number(b.isLitterMother) - Number(a.isLitterMother) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const mother = sorted.find((pet) => pet.isLitterMother) ?? null;
      const pups = sorted.filter((pet) => !pet.isLitterMother);
      const createdAt = sorted.reduce(
        (earliest, pet) =>
          pet.createdAt < earliest ? pet.createdAt : earliest,
        sorted[0]?.createdAt ?? new Date(0).toISOString(),
      );

      return {
        litterGroupId,
        members: sorted,
        mother,
        pups,
        title: mother ? `Camada de ${mother.name}` : "Camada",
        species: sorted[0]?.species ?? null,
        publishedCount: sorted.filter((pet) => pet.status === "published")
          .length,
        createdAt,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
