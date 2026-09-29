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

export function buildPage<T>(rows: T[], start: number, count: number): Page<T> {
  void rows;
  void start;
  void count;
  throw new Error("VortexNotImplemented");
}
