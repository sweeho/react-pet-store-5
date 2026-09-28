import { ErrorState } from "@/components/state";

/** SWHR-R-0077: mockup-supplier-sign-in-error.html. English literals, like the legacy supplier app. */
export default function SupplierLoginErrorPage() {
  return (
    <div className="p-8">
      <ErrorState
        title="Login error"
        description="The user could not be authenticated. Please check your username and password and try again."
        primaryAction={{ label: "Back to supplier sign-in", to: "/supplier/signin" }}
        secondaryLabel="Store home"
      />
    </div>
  );
}
