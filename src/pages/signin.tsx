import type { FormEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignOnSession } from "@/hooks/useSignOnSession";
import { useScreen } from "@/i18n/screens";

const REMEMBER_COOKIE_NAME = "signon_username";

function readRememberedUserName(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REMEMBER_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface RedirectResult {
  redirect: string;
}

async function postSignOn(
  userId: string,
  password: string,
  remember: boolean,
): Promise<RedirectResult> {
  const response = await fetch("/api/signon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password, remember }),
  });
  return (await response.json()) as RedirectResult;
}

async function postCreateAccount(userId: string, password: string): Promise<RedirectResult> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  return (await response.json()) as RedirectResult;
}

interface RequiredField {
  label: string;
  value: string;
  ref: RefObject<HTMLInputElement | null>;
}

/**
 * SWHR-R-0053: the returning-customer and new-account forms, side by side.
 * The client-side empty check shows one message per empty field and does
 * not submit (DESIGN.md §Forms); the server repeats every rule. SD-5: the
 * mockup's demo-credential pre-fill is not built — only a remembered user
 * name (P7's `signon_username` cookie) fills in the returning-customer user
 * name, and no form ever pre-fills a password.
 */
export default function SignInPage() {
  const t = useScreen("signin");
  const navigate = useNavigate();
  const { refresh } = useSignOnSession();

  const [remembered] = useState(() => readRememberedUserName());

  const [returningUserName, setReturningUserName] = useState(remembered ?? "");
  const [returningPassword, setReturningPassword] = useState("");
  const [remember, setRemember] = useState(remembered !== null);
  const [returningErrors, setReturningErrors] = useState<string[]>([]);
  const returningUserNameRef = useRef<HTMLInputElement>(null);
  const returningPasswordRef = useRef<HTMLInputElement>(null);

  const [newUserName, setNewUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [newAccountErrors, setNewAccountErrors] = useState<string[]>([]);
  const newUserNameRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const repeatPasswordRef = useRef<HTMLInputElement>(null);

  const emptyMessage = (label: string) => t.emptyFieldTemplate.replace("{field}", label);

  const findEmpty = (fields: RequiredField[]) => fields.filter((field) => !field.value.trim());

  const handleReturningSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const empty = findEmpty([
      { label: t.userNameLabel, value: returningUserName, ref: returningUserNameRef },
      { label: t.passwordLabel, value: returningPassword, ref: returningPasswordRef },
    ]);
    if (empty.length > 0) {
      setReturningErrors(empty.map((field) => emptyMessage(field.label)));
      empty[0].ref.current?.focus();
      return;
    }
    setReturningErrors([]);
    const result = await postSignOn(returningUserName, returningPassword, remember);
    await refresh();
    navigate(result.redirect);
  };

  const handleNewAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const empty = findEmpty([
      { label: t.userNameLabel, value: newUserName, ref: newUserNameRef },
      { label: t.passwordLabel, value: newPassword, ref: newPasswordRef },
      { label: t.repeatPasswordLabel, value: repeatPassword, ref: repeatPasswordRef },
    ]);
    if (empty.length > 0) {
      setNewAccountErrors(empty.map((field) => emptyMessage(field.label)));
      empty[0].ref.current?.focus();
      return;
    }
    setNewAccountErrors([]);
    const result = await postCreateAccount(newUserName, newPassword);
    navigate(result.redirect);
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground-2 mt-1 max-w-2xl">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form
          aria-labelledby="returning-customer-heading"
          onSubmit={(event) => void handleReturningSubmit(event)}
          className="border-line-2 bg-background flex flex-col gap-4.5 rounded-xl border p-7"
        >
          <div>
            <h2 id="returning-customer-heading" className="text-lg font-semibold">
              {t.returningHeading}
            </h2>
            <p className="text-muted-foreground-1 mt-0.5 text-sm">{t.returningHint}</p>
          </div>
          {returningErrors.length > 0 ? (
            <div role="alert" className="text-destructive flex flex-col gap-1 text-sm">
              {returningErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          ) : null}
          <Input
            ref={returningUserNameRef}
            label={t.userNameLabel}
            value={returningUserName}
            onChange={(event) => setReturningUserName(event.target.value)}
          />
          <Input
            ref={returningPasswordRef}
            type="password"
            label={t.passwordLabel}
            value={returningPassword}
            onChange={(event) => setReturningPassword(event.target.value)}
          />
          <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="border-line-3 size-4.5 rounded"
            />
            {t.rememberLabel}
          </label>
          <Button type="submit" className="self-start">
            {t.signInButton}
          </Button>
          <p className="text-muted-foreground-1 text-xs">{t.passwordNote}</p>
        </form>

        <form
          aria-labelledby="new-account-heading"
          onSubmit={(event) => void handleNewAccountSubmit(event)}
          className="border-line-2 bg-background flex flex-col gap-4.5 rounded-xl border p-7"
        >
          <div>
            <h2 id="new-account-heading" className="text-lg font-semibold">
              {t.newAccountHeading}
            </h2>
            <p className="text-muted-foreground-1 mt-0.5 text-sm">{t.newAccountHint}</p>
          </div>
          {newAccountErrors.length > 0 ? (
            <div role="alert" className="text-destructive flex flex-col gap-1 text-sm">
              {newAccountErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          ) : null}
          <Input
            ref={newUserNameRef}
            label={t.userNameLabel}
            helperText={t.newUserNameHelper}
            value={newUserName}
            onChange={(event) => setNewUserName(event.target.value)}
          />
          <Input
            ref={newPasswordRef}
            type="password"
            label={t.passwordLabel}
            helperText={t.newPasswordHelper}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            ref={repeatPasswordRef}
            type="password"
            label={t.repeatPasswordLabel}
            helperText={t.repeatPasswordHelper}
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
          />
          <Button type="submit" variant="outline" className="self-start">
            {t.createAccountButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
