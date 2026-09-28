import { StaffSignInForm } from "@/components/auth/StaffSignInForm";

// Supplier copy is English literals (design.md P12/SD-5) — no i18n
// catalogue, matching the legacy supplier application.
const STRINGS = {
  heading: "Supplier sign-in",
  hint: "Sign in with your supplier user ID and password to view and update inventory.",
  staffOnlyLabel: "Staff only",
  userIdLabel: "User ID",
  userIdPlaceholder: "Enter your user ID",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter your password",
  submitLabel: "Sign in",
  emptyFieldTemplate: "{field} is empty.",
};

interface RedirectResult {
  redirect: string;
}

async function postStaffSignOn(userId: string, password: string): Promise<RedirectResult> {
  const response = await fetch("/api/staff/signon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ realm: "supplier", userId, password }),
  });
  return (await response.json()) as RedirectResult;
}

/** SWHR-R-0082: the supplier sign-in form, mockup-supplier-sign-in.html. */
export default function SupplierSignInPage() {
  const navigate = useNavigate();

  const handleSubmit = async (userId: string, password: string) => {
    const result = await postStaffSignOn(userId, password);
    navigate(result.redirect);
  };

  return (
    <div className="p-8">
      <StaffSignInForm strings={STRINGS} onSubmit={handleSubmit} />
    </div>
  );
}
