import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/i18n/LocaleProvider";

import type { PageInfo } from "../../../lib/catalog/paging";
import PagingLinks from "./PagingLinks";

function paging(overrides: Partial<PageInfo>): PageInfo {
  return {
    start: 0,
    count: 2,
    hasNext: false,
    nextStart: null,
    hasPrevious: false,
    previousStart: null,
    ...overrides,
  };
}

function renderPaging(pagingInfo: PageInfo, makeHref: (start: number) => string) {
  return render(
    <MemoryRouter>
      <LocaleProvider fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}>
        <PagingLinks paging={pagingInfo} makeHref={makeHref} />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/**
 * UI / COMPONENT TEST
 *
 * Shared paging control (design.md PLAN step 9): Previous only when
 * `hasPrevious`, Next only when `hasNext` — a missing direction is omitted
 * entirely (no disabled state), matching every listing mockup.
 */
describe("PagingLinks", () => {
  it("renders only Next on a fresh listing (hasNext, no hasPrevious)", () => {
    renderPaging(
      paging({ hasNext: true, nextStart: 2 }),
      (start) => `/category/DOGS?start=${start}&count=2`,
    );

    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute(
      "href",
      "/category/DOGS?start=2&count=2",
    );
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument();
  });

  it("renders both Previous and Next on a middle page", () => {
    renderPaging(
      paging({ hasNext: true, nextStart: 4, hasPrevious: true, previousStart: 0 }),
      (start) => `/product/K9-BD-01?start=${start}&count=2`,
    );

    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute(
      "href",
      "/product/K9-BD-01?start=0&count=2",
    );
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute(
      "href",
      "/product/K9-BD-01?start=4&count=2",
    );
  });

  it("renders only Previous on the last page (no hasNext)", () => {
    renderPaging(
      paging({ hasPrevious: true, previousStart: 2 }),
      (start) => `/search?start=${start}`,
    );

    expect(screen.getByRole("link", { name: /Previous/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Next/ })).not.toBeInTheDocument();
  });

  it("renders nothing when there is no previous and no next page", () => {
    const { container } = render(
      <MemoryRouter>
        <LocaleProvider
          fetchLocale={() => Promise.resolve({ locale: "en_US", cartLocale: "en_US" })}
        >
          <PagingLinks paging={paging({})} makeHref={() => "/x"} />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
