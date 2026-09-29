import { Check } from "lucide-react";
import { Link } from "react-router";

import { ErrorState, LoadingState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

interface LastOrder {
  orderId: string;
  email: string;
}

/** The confirmation, read from the session's last order (design.md P8). */
export default function OrderCompletePage() {
  const t = useScreen("order-complete");
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let live = true;
    fetch("/api/orders/last")
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as LastOrder;
      })
      .then(
        (body) => {
          if (live) {
            setOrder(body);
            setState("ready");
          }
        },
        () => {
          if (live) setState("failed");
        },
      );
    return () => {
      live = false;
    };
  }, []);

  if (state === "loading") return <LoadingState />;
  if (state === "failed" || !order) {
    return (
      <div className="p-8">
        <ErrorState title={t.loadError} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <nav aria-label="Breadcrumb" className="text-muted-foreground-1 flex gap-2 text-[13px]">
        <Link to="/cart" className="text-muted-foreground-2 font-medium">
          {t.crumbCart}
        </Link>
        <span aria-hidden="true">›</span>
        <Link to="/checkout" className="text-muted-foreground-2 font-medium">
          {t.crumbCheckout}
        </Link>
        <span aria-hidden="true">›</span>
        <b className="text-foreground font-medium">{t.crumbComplete}</b>
      </nav>
      <section className="border-line-2 bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-14 text-center">
        <span className="bg-primary-50 text-primary flex size-14 items-center justify-center rounded-full">
          <Check aria-hidden="true" className="size-6.5" />
        </span>
        <h1 className="text-[28px] font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground-2">{t.thanks}</p>
        <div className="border-line-2 bg-background-1 my-2.5 min-w-[360px] rounded-xl border px-7 py-4.5">
          <div className="text-muted-foreground-1 text-xs font-semibold tracking-wider uppercase">
            {t.orderNumber}
          </div>
          <div className="mt-0.5 font-mono text-3xl font-bold tracking-wide">{order.orderId}</div>
        </div>
        {order.email ? (
          <p className="text-muted-foreground-2">
            {t.emailBefore}
            <b className="text-foreground">{order.email}</b>
            {t.emailAfter}
          </p>
        ) : null}
        <p className="text-muted-foreground-1 text-[13px]">{t.keep}</p>
        <Link
          to="/"
          className="bg-primary text-primary-foreground hover:bg-primary-hover mt-3 inline-flex h-[42px] items-center rounded-lg px-4.5 text-sm font-semibold"
        >
          {t.continueShopping}
        </Link>
      </section>
    </div>
  );
}
