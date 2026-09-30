export type CustomerEmailKind = "approval" | "shipment" | "completed";

/** The locale-neutral base template plus the three supported template locales (P7). */
export type EmailTemplateVariant = "default" | "en_US" | "ja_JP" | "zh_CN";

export interface EmailOrderLine {
  categoryId: string;
  productId: string;
  itemId: string;
  quantity: number;
  /** Decimal amount in the order's currency. */
  unitPrice: number;
}

export interface EmailOrder {
  orderId: string;
  locale: string;
  lines: EmailOrderLine[];
  /** Required for the approval e-mail. */
  decision?: "APPROVED" | "DENIED";
}

export interface RenderedEmail {
  templateId: string;
  subject: string;
  body: string;
}
