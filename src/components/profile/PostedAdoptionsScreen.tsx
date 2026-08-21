"use client";

import {
  ProfileEmptyState,
  ProfilePageShell,
} from "@/components/profile/ProfilePageShell";

export function PostedAdoptionsScreen() {
  return (
    <ProfilePageShell title="Puestos en adopción">
      <ProfileEmptyState
        title="No has publicado casos"
        description="Aquí verás las mascotas que hayas puesto en adopción y podrás gestionar sus solicitudes."
        ctaLabel="Ir al inicio"
        ctaHref="/home"
      />
    </ProfilePageShell>
  );
}
