export const CONTENT_POLICY_PRESETS = [
  {
    code: "NOT_A_PET",
    label: "No es una mascota",
    text: "Tu publicación fue retirada porque la imagen o el contenido no corresponde a una mascota en adopción.",
  },
  {
    code: "SPAM",
    label: "Spam",
    text: "Tu publicación fue retirada por parecer spam o publicidad no relacionada con adopciones.",
  },
  {
    code: "OFFENSIVE_IMAGE",
    label: "Imagen ofensiva",
    text: "Tu publicación fue retirada por contener una imagen ofensiva o inapropiada.",
  },
  {
    code: "FALSE_INFO",
    label: "Info falsa",
    text: "Tu publicación fue retirada por incluir información falsa o engañosa.",
  },
] as const;
