import AccountForm from "@/components/account/AccountForm";
import { useSignOnSession } from "@/hooks/useSignOnSession";
import { useScreen } from "@/i18n/screens";

import type { AccountField, AccountFormInput } from "../../lib/account/form";

interface RegistrationResponse {
  redirect?: string;
  data?: { missing?: AccountField[] };
}

/**
 * Registration step 2 (design.md P8, P9): the full account-information form
 * posted to POST /api/customers, which needs the pending registration session.
 */
export default function RegisterPage() {
  const t = useScreen("register");
  const account = useScreen("account");
  const { refresh } = useSignOnSession();
  const navigate = useNavigate();
  const [missing, setMissing] = useState<AccountField[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: AccountFormInput) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json()) as RegistrationResponse;
      if (!response.ok || !body.redirect) {
        setMissing(body.data?.missing ?? []);
        return;
      }
      await refresh();
      navigate(body.redirect);
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
      <AccountForm
        mode="create"
        serverMissing={missing}
        submitting={submitting}
        submitLabel={t.submitButton ?? account.submit}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
