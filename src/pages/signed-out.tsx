import { ErrorState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

// SWHR-R-0073: shown after sign-out, in whatever language the shopper had
// selected — useScreen already renders every page in the session locale.
export default function SignedOutPage() {
  const t = useScreen("signed-out");

  return (
    <div className="p-8">
      <ErrorState
        title={t.title}
        description={t.description}
        primaryAction={{ label: t.signInAgain, to: "/signon-welcome" }}
        secondaryLabel={t.keepBrowsing}
      />
    </div>
  );
}
