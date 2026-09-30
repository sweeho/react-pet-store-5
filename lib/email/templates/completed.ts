import { emailDocument, escapeHtml, linesTable, orderIdChip, statusBox } from "../html";
import type { EmailOrder, EmailTemplateVariant, RenderedEmail } from "../types";

interface CompletedCopy {
  headline: (orderId: string) => string;
  detail: string;
}

const COPY: Record<Exclude<EmailTemplateVariant, "default">, CompletedCopy> = {
  en_US: {
    headline: (id) => `Your entire order ${id} has shipped.`,
    detail: "Your order is complete. It contained the following:",
  },
  ja_JP: {
    headline: (id) => `ご注文 ${id} のすべての商品を発送しました。`,
    detail: "ご注文は完了しました。ご注文内容は次のとおりです:",
  },
  zh_CN: {
    headline: (id) => `您的整个订单 ${id} 已发货。`,
    detail: "您的订单已完成。订单包含以下商品:",
  },
};

export function renderCompletedEmail(
  variant: EmailTemplateVariant,
  order: EmailOrder,
): RenderedEmail {
  const copy = COPY[variant === "default" ? "en_US" : variant];
  const content =
    statusBox("ok", copy.headline(orderIdChip(order.orderId, 15)), escapeHtml(copy.detail)) +
    linesTable(variant, order.lines);

  return {
    templateId: `completed_${variant}`,
    subject: `Java Pet Store Order COMPLETED: ${order.orderId}`,
    body: emailDocument(variant, content),
  };
}
