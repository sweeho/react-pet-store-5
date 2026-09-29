import { ErrorState } from "@/components/state";

export default function NotAuthorised() {
  return (
    <div className="p-8">
      <ErrorState title="Not authorised" description="You are not authorised to update orders." />
    </div>
  );
}
