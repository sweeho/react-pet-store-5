export type CustomerEmailKind = "approval" | "shipment" | "completed";

/** The locale-neutral base template plus the three supported template locales (P7). */
export type EmailTemplateVariant = "default" | "en_US" | "ja_JP" | "zh_CN";

export interface EmailOrderLine {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface EmailOrder {
  orderId: string;
  locale: string;
  lines: EmailOrderLine[];
  [k: string]: unknown;
}

export interface RenderedEmail {
  templateId: string;
  subject: string;
  body: string;
}
