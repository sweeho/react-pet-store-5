import { createError, getQuery } from "nitro/h3";
import type { H3Event } from "nitro/h3";

import { parseLocale } from "../locale/model";
import { CatalogError } from "./errors";
import { DEFAULT_PAGE_SIZE } from "./paging";

export interface RequestPaging {
  start: number;
  count: number;
}

/**
 * Effective locale (design.md P3, Q5): the request's own `?locale=` when it
 * parses, else the session locale `middleware/locale.ts` already put in
 * context. Shared by every catalog route so each one resolves it the same
 * way the product route already did.
 */
export function resolveLocale(event: H3Event): string {
  const query = getQuery(event);
  const requested = typeof query.locale === "string" ? query.locale : undefined;
  const parsed = requested ? parseLocale(requested) : null;
  return parsed ? parsed.id : (event.context.locale as string);
}

const INTEGER_PATTERN = /^-?\d+$/;

function parseIntegerParam(value: unknown, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || !INTEGER_PATTERN.test(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${name} must be an integer`,
    });
  }
  return Number.parseInt(value, 10);
}

/**
 * `start`/`count` paging input (design.md P3): both must be integers when
 * present, and `count` must additionally be at least 1 — anything else is
 * a 400. A negative `start` is a valid request (the query layer answers an
 * empty page for it); missing values default to a full first page.
 */
export function resolvePaging(event: H3Event): RequestPaging {
  const query = getQuery(event);

  const start = parseIntegerParam(query.start, "start") ?? 0;
  const count = parseIntegerParam(query.count, "count") ?? DEFAULT_PAGE_SIZE;

  if (count < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "count must be at least 1",
    });
  }

  return { start, count };
}

/**
 * Catalog error mapping (design.md P2, SWHR-R-0098): a `CatalogError` from
 * any query function becomes a 503 with no partial body and no retry. Any
 * other error (e.g. a route's own 404 `createError`) passes through
 * unchanged.
 */
export function withCatalogErrorHandling<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof CatalogError) {
      throw createError({
        statusCode: 503,
        statusMessage: "Catalog unavailable",
        data: { code: "CATALOG_ERROR", message: error.message },
      });
    }
    throw error;
  }
}
