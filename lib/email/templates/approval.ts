import { formatEmailPrice } from "../price";
import type { EmailOrder, EmailTemplateVariant, RenderedEmail } from "../types";

const SUBJECT: Record<EmailTemplateVariant, string> = {
  default: "Your order has been approved",
  en_US: "Your order has been approved",
  ja_JP: "ご注文が承認されました",
  zh_CN: "您的订单已获批准",
};

function renderLine(variant: EmailTemplateVariant, order: EmailOrder): string {
  return order.lines
    .map((line) => `${line.name} x${line.quantity} @ ${formatEmailPrice(line.unitPrice, variant)}`)
    .join("\n");
}

export function renderApprovalEmail(
  variant: EmailTemplateVariant,
  order: EmailOrder,
): RenderedEmail {
  return {
    templateId: `approval_${variant}`,
    subject: SUBJECT[variant],
    body: `Order ${order.orderId}\n${renderLine(variant, order)}`,
  };
}
