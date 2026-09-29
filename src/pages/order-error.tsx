import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";

import { useScreen } from "@/i18n/screens";

/** The empty-cart Order Error (SWHR-R-0148), also shown on a double submit. */
export default function OrderErrorPage() {
  const t = useScreen("order-error");

  return (
    <div className="p-8">
      <section
        role="alert"
        className="border-line-2 bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-14 text-center"
      >
        <span className="bg-background-2 text-muted-foreground-2 flex size-14 items-center justify-center rounded-full">
          <ShoppingCart aria-hidden="true" className="size-6.5" />
        </span>
        <h1 className="text-[28px] font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground-2">{t.description}</p>
        <p className="text-muted-foreground-1 max-w-md text-[13px]">{t.note}</p>
        <div className="mt-3 flex gap-2.5">
          <Link
            to="/"
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-[42px] items-center rounded-lg px-4.5 text-sm font-semibold"
          >
            {t.continueShopping}
          </Link>
          <Link
            to="/cart"
            className="border-line-2 bg-background hover:bg-background-1 inline-flex h-[42px] items-center rounded-lg border px-4.5 text-sm font-semibold"
          >
            {t.viewCart}
          </Link>
        </div>
      </section>
    </div>
  );
}
