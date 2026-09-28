import { formatEmailPrice } from "../price";
import type { EmailOrder, EmailTemplateVariant, RenderedEmail } from "../types";

const SUBJECT: Record<EmailTemplateVariant, string> = {
  default: "Your order has shipped",
  en_US: "Your order has shipped",
  ja_JP: "ご注文の商品を発送しました",
  zh_CN: "您的订单已发货",
};

function renderLine(variant: EmailTemplateVariant, order: EmailOrder): string {
  return order.lines
    .map((line) => `${line.name} x${line.quantity} @ ${formatEmailPrice(line.unitPrice, variant)}`)
    .join("\n");
}

export function renderShipmentEmail(
  variant: EmailTemplateVariant,
  order: EmailOrder,
): RenderedEmail {
  return {
    templateId: `shipment_${variant}`,
    subject: SUBJECT[variant],
    body: `Order ${order.orderId}\n${renderLine(variant, order)}`,
  };
}
