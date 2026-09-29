import { ErrorState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

/** The general error page a failed order submission lands on (SWHR-R-0147). */
export default function ErrorPage() {
  const t = useScreen("error");

  return (
    <div className="p-8">
      <ErrorState
        title={t.title}
        description={t.description}
        primaryAction={{ label: t.tryAgain, to: "/checkout" }}
        secondaryLabel={t.goHome}
      />
    </div>
  );
}
