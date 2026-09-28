import { Link } from "react-router";

import { useAdminStrings } from "@/i18n/admin/useAdminStrings";

/**
 * design.md P12: the public administration landing page — anyone can see
 * it (SWHR-R-0069/design.md's "anonymous access to sign-on services"
 * extends to reaching the sign-in form), only a signed-in administrator
 * gets past `/admin/signin` to the console.
 */
export default function AdminLandingPage() {
  const strings = useAdminStrings();

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1
        className="text-2xl font-bold"
        title={strings.title.tooltip}
        accessKey={strings.title.mnemonic}
      >
        {strings.title.label}
      </h1>
      <p className="text-muted-foreground-2 max-w-2xl">{strings.landingDescription.label}</p>
      <Link to="/admin/signin" className="text-primary self-start font-semibold underline">
        {strings.signInLink.label}
      </Link>
    </div>
  );
}
