import { EmptyState } from "@/components/state";

export default function SignInPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <EmptyState title="Coming soon" description="Sign in is coming soon." />
    </div>
  );
}
