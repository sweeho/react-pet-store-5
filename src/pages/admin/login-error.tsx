import { ErrorState } from "@/components/state";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";

/** SWHR-R-0077: mockup-administrator-sign-in-error.html. */
export default function AdminLoginErrorPage() {
  const strings = useAdminStrings();

  return (
    <div className="p-8">
      <ErrorState
        title={strings.loginErrorTitle.label}
        description={strings.loginErrorDescription.label}
        primaryAction={{ label: strings.backToSignInLink.label, to: "/admin/signin" }}
        secondaryLabel={strings.storeHomeLink.label}
      />
    </div>
  );
}
