import { EmptyState } from "@/components/state";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";

export default function AdminPlaceholder() {
  const strings = useAdminStrings();

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1
        className="text-2xl font-bold"
        title={strings.title.tooltip}
        accessKey={strings.title.mnemonic}
      >
        {strings.title.label}
      </h1>
      <EmptyState title={strings.emptyTitle.label} description={strings.emptyDescription.label} />
    </div>
  );
}
