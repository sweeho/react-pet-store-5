import { EmptyState } from "@/components/state";

export default function CheckoutPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <EmptyState title="Coming soon" description="Checkout is coming soon." />
    </div>
  );
}
