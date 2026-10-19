export const MODERATION_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  needs_review: "Pendiente",
  hidden: "Oculta",
  deleted: "Eliminada",
  blocked: "Bloqueada",
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  warned: "Advertida",
  suspended: "Suspendida",
  banned: "Bloqueada",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate: "Contenido inapropiado",
  not_pets: "No tiene relación con mascotas",
  spam: "Spam",
  false_info: "Información falsa",
  animal_abuse: "Maltrato animal",
  offensive_image: "Imagen ofensiva",
  other: "Otro",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  dismissed: "Descartado",
  action_taken: "Acción tomada",
};

export const ACTION_LABELS: Record<string, string> = {
  POST_APPROVED: "Publicación aprobada",
  POST_HIDDEN: "Publicación ocultada",
  POST_DELETED: "Publicación eliminada",
  POST_RESTORED: "Publicación restaurada",
  POST_BLOCKED: "Publicación bloqueada",
  POST_FLAGGED_REVIEW: "Marcada para revisión",
  USER_WARNED: "Usuario advertido",
  USER_SUSPENDED: "Usuario suspendido",
  USER_BANNED: "Usuario bloqueado",
  USER_REACTIVATED: "Usuario reactivado",
  USER_IDENTITY_VERIFIED: "Identidad verificada",
  USER_IDENTITY_REJECTED: "Identidad rechazada",
  REPORT_DISMISSED: "Reporte descartado",
  REPORT_ACTION_TAKEN: "Acción sobre reporte",
  ADOPTION_CLOSED: "Solicitud de adopción cerrada",
  APPEAL_SUBMITTED: "Apelación enviada",
  APPEAL_ACCEPTED: "Apelación aceptada",
  APPEAL_REJECTED: "Apelación rechazada",
};

export const APPEAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export const IDENTITY_STATUS_LABELS: Record<string, string> = {
  incomplete: "Incompleta",
  submitted: "Enviada",
  verified: "Verificada",
  rejected: "Rechazada",
};

export const ADOPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  closed: "Cerrada",
};

export const PET_STATUS_LABELS: Record<string, string> = {
  published: "Publicada",
  closed: "Cerrada",
};

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}
