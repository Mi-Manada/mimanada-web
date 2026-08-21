"use client";

import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";

export function FavoritesScreen() {
  return (
    <ProfilePageShell title="Favoritos">
      <ProfileEmptyState
        title="Sin favoritos aún"
        description="Cuando explores casos de adopción, podrás guardar aquí los peluditos que más te gusten."
        ctaLabel="Ir al inicio"
        ctaHref="/home"
      />
    </ProfilePageShell>
  );
}
