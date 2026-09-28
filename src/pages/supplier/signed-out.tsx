import { ErrorState } from "@/components/state";

/** SWHR-R-0083: shown after supplier sign-out, linking back into the supplier application. */
export default function SupplierSignedOutPage() {
  return (
    <div className="p-8">
      <ErrorState
        title="You are signed out"
        description="You have been signed out of the supplier application."
        primaryAction={{ label: "Return to supplier sign-in", to: "/supplier/signin" }}
        secondaryLabel="Store home"
      />
    </div>
  );
}
