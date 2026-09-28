import { EmptyState } from "@/components/state";

export default function AccountPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Account</h1>
      <EmptyState title="Coming soon" description="Account management is coming soon." />
    </div>
  );
}
