import { formatEmailPrice } from "../price";
import type { EmailOrder, EmailTemplateVariant, RenderedEmail } from "../types";

const SUBJECT: Record<EmailTemplateVariant, string> = {
  default: "Your order is complete",
  en_US: "Your order is complete",
  ja_JP: "ご注文が完了しました",
  zh_CN: "您的订单已完成",
};

function renderLine(variant: EmailTemplateVariant, order: EmailOrder): string {
  return order.lines
    .map((line) => `${line.name} x${line.quantity} @ ${formatEmailPrice(line.unitPrice, variant)}`)
    .join("\n");
}

export function renderCompletedEmail(
  variant: EmailTemplateVariant,
  order: EmailOrder,
): RenderedEmail {
  return {
    templateId: `completed_${variant}`,
    subject: SUBJECT[variant],
    body: `Order ${order.orderId}\n${renderLine(variant, order)}`,
  };
}
