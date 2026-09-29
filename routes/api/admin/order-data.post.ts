import { defineHandler, readBody } from "nitro/h3";

import { requireAdminDataSession } from "../../../lib/auth/adminDataSession";
import {
  listOrdersByStatus,
  parseReportDate,
  queueDecisions,
  salesReport,
} from "../../../lib/orders/adminData";

// SWHR-R-0080: the exact legacy ApplRequestProcessor reply text.
const SESSION_TIMED_OUT_ERROR =
  "Session Timed Out; Please exit and login as admin from the login page";
const ORDER_STATUSES = ["PENDING", "APPROVED", "DENIED", "SHIPPED_PART", "COMPLETED"];

class BadRequest extends Error {}

function invalid(detail: string): BadRequest {
  return new BadRequest(`Error processing request: ${detail}. Please try again.`);
}

function reportDate(value: unknown, field: string): Date {
  const date = typeof value === "string" ? parseReportDate(value) : null;
  if (!date) throw invalid(`${field} must be a date in MM/dd/yyyy format`);
  return date;
}

/** design.md P6: one service, typed requests (SD-6). */
export default defineHandler(async (event) => {
  if (!(await requireAdminDataSession(event))) {
    event.res.status = 401;
    return { error: SESSION_TIMED_OUT_ERROR };
  }

  let body: unknown;
  try {
    body = await readBody(event);
  } catch (error) {
    event.res.status = 400;
    return { error: invalid(error instanceof Error ? error.message : "unreadable body").message };
  }
  if (typeof body !== "object" || body === null) {
    event.res.status = 400;
    return { error: invalid("the request body must be a JSON object").message };
  }
  const request = body as Record<string, unknown>;
  const type = request.type;

  try {
    switch (type) {
      case "GETORDERS": {
        const status = request.status;
        if (typeof status !== "string" || !ORDER_STATUSES.includes(status)) {
          throw invalid("status is missing or unknown");
        }
        try {
          return listOrdersByStatus(status);
        } catch {
          event.res.status = 500;
          return { error: `Could not find ${status} orders` };
        }
      }
      case "UPDATESTATUS": {
        if (!Array.isArray(request.orders)) throw invalid("orders must be a list");
        return { result: "SUCCESS", queued: queueDecisions(request.orders) };
      }
      case "REVENUE":
      case "ORDERS": {
        const start = reportDate(request.start, "start");
        const end = reportDate(request.end, "end");
        const category = request.category;
        if (category !== undefined && typeof category !== "string") {
          throw invalid("category must be text");
        }
        return salesReport(type, start, end, category);
      }
      default:
        event.res.status = 400;
        return { error: `Unable to process an unknown request type "${String(type)}"` };
    }
  } catch (error) {
    if (error instanceof BadRequest) {
      event.res.status = 400;
      return { error: error.message };
    }
    throw error;
  }
});
