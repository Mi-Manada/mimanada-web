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
  USER_WARNED: "Usuario advertido",
  USER_SUSPENDED: "Usuario suspendido",
  USER_BANNED: "Usuario bloqueado",
  USER_REACTIVATED: "Usuario reactivado",
  REPORT_DISMISSED: "Reporte descartado",
  REPORT_ACTION_TAKEN: "Acción sobre reporte",
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
