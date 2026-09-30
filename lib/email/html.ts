import { formatEmailPrice } from "./price";
import type { EmailOrderLine, EmailTemplateVariant } from "./types";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/** Wording shared by the three e-mails. The `default` variant reads as en_US. */
interface CommonCopy {
  lang: string;
  thanks: string;
  closing: string;
  footer: string;
  headers: readonly [string, string, string, string];
}

const COMMON: Record<Exclude<EmailTemplateVariant, "default">, CommonCopy> = {
  en_US: {
    lang: "en",
    thanks: "Thank you for placing an order with us.",
    closing: "Thank you for shopping with us.",
    footer: "Pet Store Customer Service",
    headers: ["Category", "Product #", "Quantity", "Unit Price"],
  },
  ja_JP: {
    lang: "ja",
    thanks: "ご注文ありがとうございます。",
    closing: "ご利用ありがとうございました。",
    footer: "Pet Store カスタマーサービス",
    headers: ["カテゴリ", "商品番号", "数量", "単価"],
  },
  zh_CN: {
    lang: "zh",
    thanks: "感谢您在我们这里下单。",
    closing: "感谢您的惠顾。",
    footer: "Pet Store 客户服务",
    headers: ["类别", "产品编号", "数量", "单价"],
  },
};

export function commonCopy(variant: EmailTemplateVariant): CommonCopy {
  return COMMON[variant === "default" ? "en_US" : variant];
}

export const SERVICE_ADDRESS = "customerservice@javapetstoredemo.com";

// Colours, spacing and rules from the mockups, carried inline because mail
// clients strip <style> and classes.
const FONT = "font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;";
const PARAGRAPH = `${FONT}font-size:15px;line-height:1.5;color:#4b5563;margin:20px 0 0;`;
const TH = `${FONT}text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;background:#f9fafb;padding:10px 16px;border-bottom:1px solid #e5e7eb;`;
const TD = `${FONT}font-size:14px;color:#1f2937;padding:12px 16px;border-bottom:1px solid #e5e7eb;`;
const MONO = "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;";

/** An order id chip. `orderId` is escaped here. */
export function orderIdChip(orderId: string, fontSize = 14): string {
  return `<span style="display:inline-block;font-weight:600;color:#1f2937;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:0 8px;font-size:${fontSize}px;">${escapeHtml(orderId)}</span>`;
}

export function paragraph(html: string): string {
  return `<p style="${PARAGRAPH}">${html}</p>`;
}

export type StatusTone = "ok" | "no" | "info";

const TONES: Record<
  StatusTone,
  { bg: string; border: string; fg: string; icon: string; glyph: string }
> = {
  ok: { bg: "#f0fdf4", border: "#dcfce7", fg: "#15803d", icon: "#dcfce7", glyph: "&#10003;" },
  no: { bg: "#fef2f2", border: "#fee2e2", fg: "#b91c1c", icon: "#fee2e2", glyph: "&#10005;" },
  info: { bg: "#eff6ff", border: "#dbeafe", fg: "#1d4ed8", icon: "#dbeafe", glyph: "&#9993;" },
};

/** The coloured statement box. `headline` and `detail` are trusted HTML the caller has escaped. */
export function statusBox(tone: StatusTone, headline: string, detail: string): string {
  const t = TONES[tone];
  return `<div style="${FONT}margin-top:20px;border-radius:12px;padding:18px 20px;font-size:15px;background:${t.bg};border:1px solid ${t.border};color:${t.fg};"><span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:9999px;text-align:center;background:${t.icon};font-weight:700;margin-right:14px;vertical-align:top;">${t.glyph}</span><span style="display:inline-block;vertical-align:top;max-width:460px;"><b style="display:block;font-size:16px;font-weight:600;margin-bottom:2px;">${headline}</b><span style="color:#4b5563;">${detail}</span></span></div>`;
}

export function linesTable(
  variant: EmailTemplateVariant,
  lines: readonly EmailOrderLine[],
): string {
  const [category, product, quantity, price] = commonCopy(variant).headers;
  const head = [category, product, quantity, price]
    .map((h, i) => `<th style="${TH}${i >= 2 ? "text-align:right;" : ""}">${escapeHtml(h)}</th>`)
    .join("");
  const body = lines
    .map(
      (l) =>
        `<tr><td style="${TD}">${escapeHtml(l.categoryId)}</td><td style="${TD}${MONO}">${escapeHtml(l.productId)}</td><td style="${TD}text-align:right;">${l.quantity}</td><td style="${TD}text-align:right;">${escapeHtml(formatEmailPrice(l.unitPrice, variant))}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e5e7eb;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/** The message from the "Pet Store" heading to the customer-service footer. `content` is trusted HTML. */
export function emailDocument(variant: EmailTemplateVariant, content: string): string {
  const c = commonCopy(variant);
  return `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"></head><body style="margin:0;padding:32px 0;background:#ffffff;${FONT}color:#1f2937;"><div style="max-width:600px;margin:0 auto;"><div style="${FONT}font-weight:700;font-size:18px;letter-spacing:-.01em;padding-bottom:20px;border-bottom:1px solid #e5e7eb;"><span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:8px;background:#2563eb;color:#ffffff;text-align:center;margin-right:10px;vertical-align:middle;">P</span><span style="vertical-align:middle;">Pet Store</span></div>${paragraph(escapeHtml(c.thanks))}${content}<p style="${PARAGRAPH}margin-top:24px;">${escapeHtml(c.closing)}</p><div style="${FONT}margin-top:28px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">${escapeHtml(c.footer)} · ${SERVICE_ADDRESS}</div></div></body></html>`;
}
