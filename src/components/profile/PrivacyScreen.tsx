"use client";

import { ProfileEmptyState, ProfilePageShell } from "@/components/profile/ProfilePageShell";

export function PrivacyScreen() {
  return (
    <ProfilePageShell title="Privacidad">
      <div className="flex flex-col gap-5">
        <article className="rounded-[14px] border border-[#ececec] bg-white px-4 py-4">
          <h2 className="text-[0.95rem] text-[#555] [font-weight:700]">
            Cómo usamos tu información
          </h2>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-[var(--color-text-muted)]">
            Mi Manada usa tus datos de perfil (nombre, correo, teléfono y
            domicilio) para facilitar el contacto entre personas que quieren
            adoptar y quienes publican casos de adopción.
          </p>
        </article>

        <article className="rounded-[14px] border border-[#ececec] bg-white px-4 py-4">
          <h2 className="text-[0.95rem] text-[#555] [font-weight:700]">
            Rol de Mi Manada
          </h2>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-[var(--color-text-muted)]">
            Mi Manada actúa solo como vinculador entre quien quiere adoptar y
            quien quiere dar en adopción. No gestiona el proceso de adopción
            fuera de la plataforma ni opera como refugio de animales.
          </p>
        </article>

        <article className="rounded-[14px] border border-[#ececec] bg-white px-4 py-4">
          <h2 className="text-[0.95rem] text-[#555] [font-weight:700]">
            Tu control
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.85rem] leading-relaxed text-[var(--color-text-muted)]">
            <li>Puedes editar tus datos personales desde Mis datos.</li>
            <li>Puedes actualizar tu domicilio en Direcciones.</li>
            <li>Puedes cambiar tu contraseña en Seguridad.</li>
          </ul>
        </article>

        <ProfileEmptyState
          title="Más opciones pronto"
          description="Pronto podrás solicitar la eliminación de cuenta y gestionar consentimientos avanzados desde aquí."
        />
      </div>
    </ProfilePageShell>
  );
}
