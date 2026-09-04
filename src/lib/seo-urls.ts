/** URLs estilo Mercado Libre: /adopta/MM-{uuid}-{slug-seo} */

const UUID_RE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function slugify(text: string, maxLength = 80): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "item";
}

/** Extrae el UUID de un param `MM-{uuid}-{slug}`, `{uuid}-{slug}` o `{uuid}`. */
export function parseEntityId(param: string): string | null {
  const value = decodeURIComponent(param).trim();
  if (!value) return null;

  const mm = value.match(new RegExp(`^MM-(${UUID_RE})(?:-.*)?$`, "i"));
  if (mm) return mm[1].toLowerCase();

  const uuidSlug = value.match(new RegExp(`^(${UUID_RE})(?:-.*)?$`, "i"));
  if (uuidSlug) return uuidSlug[1].toLowerCase();

  return null;
}

function mmPath(base: string, id: string, title: string, suffix = "") {
  return `${base}/MM-${id}-${slugify(title)}${suffix}`;
}

export function petPath(
  pet: { id: string; name: string },
  suffix: "" | "/hermanos" | "/editar" = "",
) {
  return mmPath("/adopta", pet.id, pet.name, suffix);
}

export function userPath(
  user: { id: string; fullName: string },
  opts?: { from?: string },
) {
  const path = mmPath("/usuarios", user.id, user.fullName);
  if (!opts?.from) return path;
  return `${path}?from=${encodeURIComponent(opts.from)}`;
}
