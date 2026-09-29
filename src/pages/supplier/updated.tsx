import { Check, LogOut } from "lucide-react";
import { Link } from "react-router";

import NotAuthorised from "@/components/supplier/NotAuthorised";
import { useSupplierLogout, useSupplierSession } from "@/components/supplier/useSupplierSession";
import { Button } from "@/components/ui/button";

/** SWHR-R-0232: confirmation after a committed update (mockup-inventory-update-confirmation.html). */
export default function SupplierUpdatedPage() {
  const session = useSupplierSession();
  const logout = useSupplierLogout();

  if (!session) {
    return null;
  }

  if (!session.isAdministrator) {
    return <NotAuthorised />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-8 pt-6 pb-10">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground-1 flex items-center gap-2 text-sm"
      >
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/supplier">Supplier</Link>
        <span>/</span>
        <b className="text-foreground font-medium">Inventory updated</b>
      </nav>
      <section className="bg-background border-line-2 flex max-w-180 flex-col gap-4 rounded-xl border p-12">
        <span
          aria-hidden="true"
          className="bg-primary-50 text-primary grid size-14 place-items-center rounded-full"
        >
          <Check className="size-7" />
        </span>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Inventory updated</h1>
        <p role="status" className="text-muted-foreground-2 text-base">
          The inventory was updated successfully. Approved orders that were waiting for this stock
          will now be shipped automatically, and their customers e-mailed.
        </p>
        <div className="mt-2 flex gap-2.5">
          <Button asChild>
            <Link to="/supplier/inventory">Display Inventory</Link>
          </Button>
          <Button variant="outline" onClick={() => void logout()}>
            <LogOut aria-hidden="true" className="mr-2 size-4" />
            Logout
          </Button>
        </div>
      </section>
    </div>
  );
}
