import { Lock, Shield } from "lucide-react";
import type { FormEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface StaffSignInFormStrings {
  heading: string;
  hint: string;
  staffOnlyLabel: string;
  userIdLabel: string;
  userIdPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitLabel: string;
  /** `{field}` is replaced with the empty field's own label. */
  emptyFieldTemplate: string;
}

export interface StaffSignInFormProps {
  strings: StaffSignInFormStrings;
  onSubmit: (userId: string, password: string) => void | Promise<void>;
}

interface RequiredField {
  label: string;
  value: string;
  ref: RefObject<HTMLInputElement | null>;
}

/**
 * Shared by /admin/signin and /supplier/signin (design.md P12) — one
 * component, each realm's own copy passed in as `strings` (admin's from
 * the en/de catalogue, supplier's as English literals, SD-5/P12). Never
 * pre-filled (supplier-inventory R3, OQ-8): unlike the storefront form,
 * there is no remembered-user-name cookie for a staff realm.
 */
export function StaffSignInForm({ strings, onSubmit }: StaffSignInFormProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const userIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const emptyMessage = (label: string) => strings.emptyFieldTemplate.replace("{field}", label);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fields: RequiredField[] = [
      { label: strings.userIdLabel, value: userId, ref: userIdRef },
      { label: strings.passwordLabel, value: password, ref: passwordRef },
    ];
    const empty = fields.filter((field) => !field.value.trim());
    if (empty.length > 0) {
      setErrors(empty.map((field) => emptyMessage(field.label)));
      empty[0].ref.current?.focus();
      return;
    }

    setErrors([]);
    void onSubmit(userId, password);
  };

  return (
    <form
      aria-labelledby="staff-signin-heading"
      onSubmit={handleSubmit}
      className="border-line-2 bg-background mx-auto flex w-full max-w-md flex-col gap-4.5 rounded-xl border p-7"
    >
      <div className="flex items-center gap-3">
        <div className="bg-primary-50 text-primary flex size-11 items-center justify-center rounded-full">
          <Shield aria-hidden="true" className="size-5.5" />
        </div>
        <span className="bg-background-2 text-muted-foreground-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
          <Lock aria-hidden="true" className="size-3" />
          {strings.staffOnlyLabel}
        </span>
      </div>
      <div>
        <h1 id="staff-signin-heading" className="text-lg font-semibold">
          {strings.heading}
        </h1>
        <p className="text-muted-foreground-1 mt-0.5 text-sm">{strings.hint}</p>
      </div>
      {errors.length > 0 ? (
        <div role="alert" className="text-destructive flex flex-col gap-1 text-sm">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
      <Input
        ref={userIdRef}
        label={strings.userIdLabel}
        placeholder={strings.userIdPlaceholder}
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
      />
      <Input
        ref={passwordRef}
        type="password"
        label={strings.passwordLabel}
        placeholder={strings.passwordPlaceholder}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button type="submit" className="w-full">
        {strings.submitLabel}
      </Button>
    </form>
  );
}

export default StaffSignInForm;
