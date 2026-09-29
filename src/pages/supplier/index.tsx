import { LogOut, Package } from "lucide-react";
import { Link } from "react-router";

import NotAuthorised from "@/components/supplier/NotAuthorised";
import { useSupplierLogout, useSupplierSession } from "@/components/supplier/useSupplierSession";
import { Button } from "@/components/ui/button";

/**
 * SWHR-R-0229: supplier home (mockup-supplier-home.html). Sign-in is required
 * (SWHR-R-0082); a signed-in user without the administrator role sees a
 * not-authorised message and no actions (SWHR-R-0082.01).
 */
export default function SupplierHomePage() {
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
        <b className="text-foreground font-medium">Supplier</b>
      </nav>
      <div className="flex flex-col gap-2.5">
        <span className="text-primary text-[13px] font-semibold">Supplier · Warehouse staff</span>
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">Supplier</h1>
        <p className="text-muted-foreground-2 max-w-155 text-base">
          Keep the stock levels in the warehouse current. Updating inventory lets you fill the
          orders marked "Back Ordered": entering new stock also releases approved orders that have
          been waiting for it.
        </p>
      </div>
      <section className="bg-background border-line-2 flex items-center gap-6 rounded-xl border p-7">
        <span
          aria-hidden="true"
          className="bg-primary-50 text-primary grid size-14 flex-none place-items-center rounded-xl"
        >
          <Package className="size-6" />
        </span>
        <div className="flex-1">
          <h2 className="text-[17px] font-semibold">Inventory</h2>
          <p className="text-muted-foreground-1">
            See every stock record and replace the quantity for the items you have counted.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/supplier/inventory">Display Inventory</Link>
        </Button>
      </section>
      <section className="bg-background border-line-2 flex items-center gap-6 rounded-xl border px-7 py-5">
        <div className="flex-1">
          <h2 className="font-semibold">Finished for now?</h2>
          <p className="text-muted-foreground-1">Log out before you leave this computer.</p>
        </div>
        <Button variant="outline" onClick={() => void logout()}>
          <LogOut aria-hidden="true" className="mr-2 size-4" />
          Logout
        </Button>
      </section>
    </div>
  );
}
