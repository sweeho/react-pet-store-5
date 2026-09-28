import { EmptyState } from "@/components/state";

export default function AdminPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Administration</h1>
      <EmptyState title="Coming soon" description="Order approval is coming soon." />
    </div>
  );
}
