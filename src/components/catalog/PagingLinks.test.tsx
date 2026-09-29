import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

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

/**
 * UI / COMPONENT TEST
 *
 * Shared paging control (design.md PLAN step 9): Previous only when
 * `hasPrevious`, Next only when `hasNext` — a missing direction is omitted
 * entirely (no disabled state), matching every listing mockup.
 */
describe("PagingLinks", () => {
  it("renders only Next on a fresh listing (hasNext, no hasPrevious)", () => {
    render(
      <MemoryRouter>
        <PagingLinks
          paging={paging({ hasNext: true, nextStart: 2 })}
          makeHref={(start) => `/category/DOGS?start=${start}&count=2`}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute(
      "href",
      "/category/DOGS?start=2&count=2",
    );
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument();
  });

  it("renders both Previous and Next on a middle page", () => {
    render(
      <MemoryRouter>
        <PagingLinks
          paging={paging({ hasNext: true, nextStart: 4, hasPrevious: true, previousStart: 0 })}
          makeHref={(start) => `/product/K9-BD-01?start=${start}&count=2`}
        />
      </MemoryRouter>,
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
    render(
      <MemoryRouter>
        <PagingLinks
          paging={paging({ hasPrevious: true, previousStart: 2 })}
          makeHref={(start) => `/search?start=${start}`}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Previous/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Next/ })).not.toBeInTheDocument();
  });

  it("renders nothing when there is no previous and no next page", () => {
    const { container } = render(
      <MemoryRouter>
        <PagingLinks paging={paging({})} makeHref={() => "/x"} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
