import { ErrorState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

/**
 * SWHR-R-0054: shown when a sign-on attempt fails. The shopper is never
 * signed on by getting here — the page only renders the message; the
 * server never marked the session signed on in the first place.
 */
export default function SignInErrorPage() {
  const t = useScreen("signin-error");

  return (
    <div className="p-8">
      <ErrorState
        title={t.title}
        description={t.description}
        primaryAction={{ label: t.tryAgain, to: "/signin" }}
        secondaryLabel={t.backToHome}
      />
    </div>
  );
}
