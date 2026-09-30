import { emailDocument, escapeHtml, orderIdChip, paragraph, statusBox } from "../html";
import type { EmailOrder, EmailTemplateVariant, RenderedEmail } from "../types";

interface ApprovalCopy {
  status: (orderId: string) => string;
  approved: [string, string];
  denied: [string, string];
}

const COPY: Record<Exclude<EmailTemplateVariant, "default">, ApprovalCopy> = {
  en_US: {
    status: (id) => `Your order number ${id} was:`,
    approved: ["approved!", "We will now fulfill your order."],
    denied: ["denied unfortunately.", "Sorry we could not place your order."],
  },
  ja_JP: {
    status: (id) => `ご注文番号 ${id} の結果:`,
    approved: ["承認されました。", "ご注文の手配を進めます。"],
    denied: ["残念ながら却下されました。", "ご注文をお受けできませんでした。申し訳ありません。"],
  },
  zh_CN: {
    status: (id) => `您的订单号 ${id} 的结果:`,
    approved: ["已获批准!", "我们现在将为您处理订单。"],
    denied: ["很遗憾,已被拒绝。", "抱歉,我们无法受理您的订单。"],
  },
};

export function renderApprovalEmail(
  variant: EmailTemplateVariant,
  order: EmailOrder,
): RenderedEmail {
  if (!order.decision) {
    throw new Error(`Approval e-mail for order ${order.orderId} needs a decision`);
  }
  const copy = COPY[variant === "default" ? "en_US" : variant];
  const approved = order.decision === "APPROVED";
  const [headline, detail] = approved ? copy.approved : copy.denied;
  const content =
    paragraph(copy.status(orderIdChip(order.orderId))) +
    statusBox(approved ? "ok" : "no", escapeHtml(headline), escapeHtml(detail));

  return {
    templateId: `approval_${variant}`,
    subject: `Java Pet Store Order Status: ${order.orderId}`,
    body: emailDocument(variant, content),
  };
}
