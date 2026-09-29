import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

import type { PageInfo } from "../../../lib/catalog/paging";

export interface PagingLinksProps {
  paging: PageInfo;
  makeHref: (start: number) => string;
}

const LINK_CLASSES =
  "border-line-2 bg-background hover:bg-background-1 inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-sm font-semibold";

/**
 * Shared Previous/Next control (design.md PLAN step 9): a direction that
 * isn't available is omitted entirely, never shown disabled — matching
 * every listing mockup, none of which render a disabled pager link.
 */
export default function PagingLinks({ paging, makeHref }: PagingLinksProps) {
  const t = useScreen("shell");

  if (!paging.hasPrevious && !paging.hasNext) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      {paging.hasPrevious && paging.previousStart !== null ? (
        <Link to={makeHref(paging.previousStart)} className={LINK_CLASSES}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t.previous}
        </Link>
      ) : (
        <span />
      )}
      {paging.hasNext && paging.nextStart !== null ? (
        <Link to={makeHref(paging.nextStart)} className={cn(LINK_CLASSES, "ml-auto")}>
          {t.next}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
