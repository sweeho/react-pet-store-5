import { StaffSignInForm } from "@/components/auth/StaffSignInForm";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";

interface RedirectResult {
  redirect: string;
}

async function postStaffSignOn(userId: string, password: string): Promise<RedirectResult> {
  const response = await fetch("/api/staff/signon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ realm: "admin", userId, password }),
  });
  return (await response.json()) as RedirectResult;
}

/** SWHR-R-0075: the administrator sign-in form, mockup-administrator-sign-in.html. */
export default function AdminSignInPage() {
  const strings = useAdminStrings();
  const navigate = useNavigate();

  const handleSubmit = async (userId: string, password: string) => {
    const result = await postStaffSignOn(userId, password);
    navigate(result.redirect);
  };

  return (
    <div className="p-8">
      <StaffSignInForm
        strings={{
          heading: strings.signInHeading.label,
          hint: strings.signInHint.label,
          staffOnlyLabel: strings.staffOnlyLabel.label,
          userIdLabel: strings.userIdLabel.label,
          userIdPlaceholder: strings.userIdPlaceholder.label,
          passwordLabel: strings.passwordLabel.label,
          passwordPlaceholder: strings.passwordPlaceholder.label,
          submitLabel: strings.submitLabel.label,
          emptyFieldTemplate: strings.emptyFieldTemplate.label,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
