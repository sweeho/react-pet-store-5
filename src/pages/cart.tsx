import { EmptyState } from "@/components/state";

export default function CartPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Cart</h1>
      <EmptyState title="Coming soon" description="Your cart is coming soon." />
    </div>
  );
}
