const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Formats a `YYYY-MM-DD` date as a medium locale date. Both the parse and the
 * format use UTC, so the calendar day never shifts with the user's time zone.
 */
export function formatDate(isoDate: string, locale?: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
