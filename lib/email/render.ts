import { parseLocale } from "../locale/model";
import { renderApprovalEmail } from "./templates/approval";
import { renderCompletedEmail } from "./templates/completed";
import { renderShipmentEmail } from "./templates/shipment";
import type { CustomerEmailKind, EmailOrder, EmailTemplateVariant, RenderedEmail } from "./types";

export type { CustomerEmailKind, EmailOrder, RenderedEmail } from "./types";

const TEMPLATE_LOCALES: readonly EmailTemplateVariant[] = ["en_US", "ja_JP", "zh_CN"];

const RENDERERS: Record<
  CustomerEmailKind,
  (variant: EmailTemplateVariant, order: EmailOrder) => RenderedEmail
> = {
  approval: renderApprovalEmail,
  shipment: renderShipmentEmail,
  completed: renderCompletedEmail,
};

export class EmailTemplateNotFoundError extends Error {
  constructor(localeId: string) {
    super(`No template found for locale ${localeId}`);
    this.name = "EmailTemplateNotFoundError";
  }
}

function isTemplateLocale(id: string): id is EmailTemplateVariant {
  return (TEMPLATE_LOCALES as readonly string[]).includes(id);
}

/**
 * Selects the template by order locale (D5, Q3): an unparseable locale
 * falls back to the locale-neutral base template, a parsed locale with no
 * matching template fails outright rather than falling back further.
 */
export function renderCustomerEmail(kind: CustomerEmailKind, order: EmailOrder): RenderedEmail {
  const render = RENDERERS[kind];
  const parsed = parseLocale(order.locale);

  if (!parsed) {
    return render("default", order);
  }

  if (!isTemplateLocale(parsed.id)) {
    throw new EmailTemplateNotFoundError(parsed.id);
  }

  return render(parsed.id, order);
}
