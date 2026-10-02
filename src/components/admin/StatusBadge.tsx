const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-800 ring-amber-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  darkRed: "bg-red-900 text-white ring-red-900",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};

const MODERATION_TONE: Record<string, keyof typeof TONES> = {
  active: "green",
  needs_review: "yellow",
  hidden: "gray",
  deleted: "red",
  blocked: "darkRed",
};

const ACCOUNT_TONE: Record<string, keyof typeof TONES> = {
  active: "green",
  warned: "yellow",
  suspended: "red",
  banned: "darkRed",
};

const REPORT_TONE: Record<string, keyof typeof TONES> = {
  pending: "yellow",
  reviewed: "blue",
  dismissed: "gray",
  action_taken: "green",
};

export function StatusBadge({
  kind,
  value,
  label,
}: {
  kind: "moderation" | "account" | "report";
  value: string;
  label: string;
}) {
  const map =
    kind === "moderation"
      ? MODERATION_TONE
      : kind === "account"
        ? ACCOUNT_TONE
        : REPORT_TONE;
  const tone = TONES[map[value] ?? "gray"];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] ring-1 ring-inset [font-weight:700] ${tone}`}
    >
      {label}
    </span>
  );
}
