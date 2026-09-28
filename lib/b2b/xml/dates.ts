// Document dates (design.md P3, R3): calendar date only, no time of day,
// in the server's local time zone — matching the legacy formatter.

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatDocumentDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * `null` for a missing or unparseable date — including a value that
 * matches `yyyy-MM-dd` syntactically but names no real calendar date (e.g.
 * 2002-02-30). The caller substitutes "now" (P3); this function never
 * does.
 */
export function parseDocumentDate(s: string | null): Date | null {
  if (!s) {
    return null;
  }

  const match = DATE_PATTERN.exec(s);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRealDate ? date : null;
}
