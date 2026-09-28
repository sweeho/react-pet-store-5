import { EmptyState } from "@/components/state";

export default function SupplierPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Supplier</h1>
      <EmptyState title="Coming soon" description="Supplier inventory is coming soon." />
    </div>
  );
}
