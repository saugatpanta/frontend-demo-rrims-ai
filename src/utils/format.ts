export function compactNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Intl.NumberFormat("en", { notation: "compact" }).format(Number.isFinite(number) ? number : 0);
}

export function dateLabel(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function statusTone(status?: string) {
  const normalized = (status ?? "").toUpperCase();
  if (["RESOLVED", "CLOSED", "COMPLETED", "VERIFIED"].includes(normalized)) return "green";
  if (["IN_PROGRESS", "UNDER_REVIEW", "ASSIGNED"].includes(normalized)) return "blue";
  if (["REJECTED", "CANCELLED", "SUSPENDED", "OVERDUE"].includes(normalized)) return "red";
  return "amber";
}

export function titleCase(value?: string | null) {
  return (value ?? "Unknown")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
