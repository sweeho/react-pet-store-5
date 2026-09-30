# SWHR-T-0159 summary

Rewrote the approval, shipment and completed e-mails as self-contained inline-styled HTML in en_US, ja_JP, zh_CN (default reads as en_US), following the mockups: Pet Store heading, thanks, order-id chip, coloured status box, Category / Product # / Quantity / Unit Price table, closing thanks and footer. Subjects are `Java Pet Store Order Status|Shipped|COMPLETED: <id>` in every locale. Every interpolated value is escaped.

Files: `lib/email/types.ts` (P4 shapes), `lib/email/html.ts` (escape, frame, status box, table), `lib/email/templates/{approval,shipment,completed}.ts`, tests `html.test.ts`, `templates/templates.test.ts`, `render.test.ts` fixtures. `render.ts` and `price.ts` unchanged.

Decisions / deviations:

- Approval with no `decision` throws (no safe default); render.test fixtures now set one.
- Status icon is a text glyph and the logo mark a "P" square, since inline SVG is unreliable in mail clients.

For human sign-off (SD-4), ja_JP / zh_CN wording: thanks ご注文ありがとうございます。/ 感谢您在我们这里下单。; approved 承認されました。ご注文の手配を進めます。/ 已获批准!我们现在将为您处理订单。; denied 残念ながら却下されました。ご注文をお受けできませんでした。申し訳ありません。/ 很遗憾,已被拒绝。抱歉,我们无法受理您的订单。; shipment 一部を発送しました。/ 一部分商品已发货。; completed 全商品を発送しました。ご注文は完了しました。/ 整个订单已发货。您的订单已完成。; headers カテゴリ・商品番号・数量・単価 / 类别・产品编号・数量・单价.

Verification: `bun run verify` exit 0 (1014 tests passed); recorded red and green runs for SWHR-C-0428/0429/0430.
