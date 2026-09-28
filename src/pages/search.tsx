import { EmptyState } from "@/components/state";

export default function SearchPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Search</h1>
      <EmptyState title="Coming soon" description="Search is coming soon." />
    </div>
  );
}
