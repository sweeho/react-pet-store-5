import AccountForm from "@/components/account/AccountForm";
import { ErrorState, LoadingState } from "@/components/state";
import { useAccount } from "@/hooks/useAccount";
import { useScreen } from "@/i18n/screens";

import type { AccountField, AccountFormInput } from "../../lib/account/form";

/** The account edit form, preselected with the stored values (design.md P8). */
export default function AccountEditPage() {
  const t = useScreen("account-edit");
  const copy = useScreen("account");
  const { account, loading, error } = useAccount();
  const navigate = useNavigate();
  const [missing, setMissing] = useState<AccountField[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: AccountFormInput) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (response.ok) {
        navigate("/account");
        return;
      }
      const body = (await response.json()) as { data?: { missing?: AccountField[] } };
      setMissing(body.data?.missing ?? []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground-2 mt-1 max-w-2xl">{t.subtitle}</p>
      </div>
      {loading ? (
        <LoadingState />
      ) : error || !account ? (
        <ErrorState title={copy.loadError} />
      ) : (
        <AccountForm
          mode="edit"
          initial={account}
          serverMissing={missing}
          submitting={submitting}
          cancelTo="/account"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
