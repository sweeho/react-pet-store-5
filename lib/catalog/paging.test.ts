import { describe, expect, it } from "vitest";

import { buildPage, DEFAULT_PAGE_SIZE } from "./paging";

/**
 * UNIT TEST
 *
 * `buildPage` is a pure function: it shapes a `Page<T>` from the
 * `count + 1` rows a query fetches, with no database involved (design.md
 * P1). The paged-query scenarios that exercise real data (middle/last page,
 * start beyond the last result) are proven against `listItems` in
 * queries.test.ts instead — this file covers the shaping rules in
 * isolation, including the two cases the platform tracks as unit-level.
 */
describe("buildPage", () => {
  it("exports a default page size of 2 (design.md D6)", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(2);
  });

  it("returns a full page with no next page when exactly `count` rows are fetched", () => {
    const page = buildPage(["a", "b"], 0, 2);

    expect(page.items).toEqual(["a", "b"]);
    expect(page.paging).toMatchObject({ hasNext: false, nextStart: null });
  });

  it("truncates to `count` items and reports a next page when `count + 1` rows are fetched", () => {
    const page = buildPage(["a", "b", "c"], 2, 2);

    expect(page.items).toEqual(["a", "b"]);
    expect(page.paging).toMatchObject({ hasNext: true, nextStart: 4 });
  });

  it("[SWHR-C-0171] starts the previous page at the current start minus the results on this page", () => {
    const page = buildPage(["d", "e"], 4, 2);

    expect(page.paging).toMatchObject({ hasPrevious: true, previousStart: 2 });
  });

  it("[SWHR-C-0172] offers no previous page for a page starting at 0", () => {
    const page = buildPage(["a", "b"], 0, 2);

    expect(page.paging).toMatchObject({ hasPrevious: false, previousStart: null });
  });

  it("floors the previous start at zero rather than going negative", () => {
    const page = buildPage(["e"], 1, 2);

    expect(page.paging).toMatchObject({ hasPrevious: true, previousStart: 0 });
  });

  it("offers no previous page for an empty page even when start is past zero", () => {
    const page = buildPage([], 9, 2);

    expect(page.paging).toMatchObject({
      hasNext: false,
      hasPrevious: false,
      previousStart: null,
    });
  });
});
