"use client";

import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";

export function AdoptionRequestsScreen() {
  return (
    <ProfilePageShell title="Solicitudes" backHref="/adopta">
      <ProfileEmptyState
        title="Sin solicitudes por ahora"
        description="Cuando envíes o recibas solicitudes de adopción, aparecerán en este espacio para que las revises."
        ctaLabel="Ver adopciones"
        ctaHref="/adopta"
      />
    </ProfilePageShell>
  );
}
