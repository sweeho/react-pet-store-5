/**
 * Storefront listings and search default to a page of 2 (design.md P1, D6)
 * when no paging parameters are supplied. Callers that accept paging input
 * (routes) own falling back to this; this module only shapes a page.
 */
export const DEFAULT_PAGE_SIZE = 2;

export interface PageInfo {
  start: number;
  count: number;
  hasNext: boolean;
  nextStart: number | null;
  hasPrevious: boolean;
  previousStart: number | null;
}

export interface Page<T> {
  items: T[];
  paging: PageInfo;
}

/**
 * Shapes a page from up to `count + 1` fetched rows (design.md P1): the
 * extra row, when present, proves a next page exists without a separate
 * count query. `previousStart` follows the legacy rule (design.md Q3/D7):
 * the current start minus the number of results actually on this page,
 * floored at zero, offered only when the page starts past the first result
 * and isn't itself empty.
 */
export function buildPage<T>(rows: T[], start: number, count: number): Page<T> {
  const items = rows.slice(0, count);
  const hasNext = rows.length > count;
  const hasPrevious = start > 0 && items.length > 0;

  return {
    items,
    paging: {
      start,
      count,
      hasNext,
      nextStart: hasNext ? start + items.length : null,
      hasPrevious,
      previousStart: hasPrevious ? Math.max(0, start - items.length) : null,
    },
  };
}
