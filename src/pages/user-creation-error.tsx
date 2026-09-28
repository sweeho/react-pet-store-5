import { ErrorState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

// SWHR-R-0057: shown when the chosen user id is already in use.
export default function UserCreationErrorPage() {
  const t = useScreen("user-creation-error");

  return (
    <div className="p-8">
      <ErrorState
        title={t.title}
        description={t.description}
        primaryAction={{ label: t.chooseAnother, to: "/signin" }}
        secondaryLabel={t.backToHome}
      />
    </div>
  );
}
