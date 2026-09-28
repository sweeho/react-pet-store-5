import { Link } from "react-router";

import { useSignOnSession } from "@/hooks/useSignOnSession";
import { useScreen } from "@/i18n/screens";
import { cn } from "@/utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * The protected page a successful sign-on lands on (design.md SD-6,
 * P6/P7) — no mockup for this screen; built from the shared shell and
 * heading pattern per PLAN.md.
 */
export default function SignOnWelcomePage() {
  const t = useScreen("signon-welcome");
  const { userId } = useSignOnSession();

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      {userId ? (
        <p className="text-muted-foreground-2">{t.signedInAs.replace("{userId}", userId)}</p>
      ) : null}
      <p className="text-muted-foreground-2 max-w-2xl">{t.body}</p>
      <div className="flex gap-2.5">
        <Link
          to="/"
          className={cn(
            "bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold",
            FOCUS_RING,
          )}
        >
          {t.continueShopping}
        </Link>
        <Link
          to="/account"
          className={cn(
            "border-line-2 bg-background hover:bg-background-1 inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold",
            FOCUS_RING,
          )}
        >
          {t.viewAccount}
        </Link>
      </div>
    </div>
  );
}
