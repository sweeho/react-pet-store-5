import { emailDocument, escapeHtml, linesTable, orderIdChip, statusBox } from "../html";
import type { EmailOrder, EmailTemplateVariant, RenderedEmail } from "../types";

interface ShipmentCopy {
  headline: (orderId: string) => string;
  detail: string;
}

const COPY: Record<Exclude<EmailTemplateVariant, "default">, ShipmentCopy> = {
  en_US: {
    headline: (id) => `Part of your order ${id} has shipped.`,
    detail: "This shipment contains the following:",
  },
  ja_JP: {
    headline: (id) => `ご注文 ${id} の一部を発送しました。`,
    detail: "今回の発送内容は次のとおりです:",
  },
  zh_CN: {
    headline: (id) => `您的订单 ${id} 中的一部分商品已发货。`,
    detail: "本次发货包含以下商品:",
  },
};

export function renderShipmentEmail(
  variant: EmailTemplateVariant,
  order: EmailOrder,
): RenderedEmail {
  const copy = COPY[variant === "default" ? "en_US" : variant];
  const content =
    statusBox("info", copy.headline(orderIdChip(order.orderId, 15)), escapeHtml(copy.detail)) +
    linesTable(variant, order.lines);

  return {
    templateId: `shipment_${variant}`,
    subject: `Java Pet Store Order Shipped: ${order.orderId}`,
    body: emailDocument(variant, content),
  };
}
