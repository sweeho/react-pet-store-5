import type { AccountFormInput, AccountField } from "../../../lib/account/form";
import type { AccountView } from "../../../lib/account/view";

export interface AccountFormProps {
  mode: "create" | "edit";
  initial?: AccountView | null;
  serverMissing?: AccountField[];
  submitting?: boolean;
  cancelTo?: string;
  onSubmit: (input: AccountFormInput) => void | Promise<void>;
}

export default function AccountForm(_props: AccountFormProps): never {
  throw new Error("VortexNotImplemented");
}
