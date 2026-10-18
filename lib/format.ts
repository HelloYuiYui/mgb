/** Formats a date string (YYYY-MM-DD) into a human-readable label, e.g. "Friday, 19 June 2026". */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
